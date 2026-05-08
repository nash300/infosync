import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { recordAuditEvent } from "@/lib/server/audit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("Webhook signature error:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const customerId = session.metadata?.customer_id;

    if (customerId) {
      const { error } = await supabaseAdmin
        .from("customers")
        .update({
          status: "active",
          payment_status: "paid",
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          activated_at: new Date().toISOString(),
        })
        .eq("id", customerId);

      if (error) {
        console.error("Checkout completed customer update error:", error);
      } else {
        await recordAuditEvent(supabaseAdmin, {
          customerId,
          actorType: "stripe",
          eventType: "payment_completed",
          eventDescription:
            "Stripe checkout completed. Customer paid and is ready for screen setup.",
          metadata: {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            stripeCheckoutSessionId: session.id,
          },
        });
      }

      if (session.subscription) {
        const { error: subscriptionError } = await supabaseAdmin
          .from("customer_subscriptions")
          .update({
            status: "active",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            setup_fee_paid: true,
          })
          .eq("stripe_checkout_session_id", session.id);

        if (subscriptionError) {
          console.error(
            "Checkout completed subscription update error:",
            subscriptionError,
          );
        }
      }
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;

    const customerId = invoice.customer;

    const { data, error } = await supabaseAdmin
      .from("customers")
      .update({
        status: "suspended",
        payment_status: "failed",
        inactive_reason: "payment_failed",
        cancellation_source: "stripe",
      })
      .eq("stripe_customer_id", customerId)
      .select();

    if (error) {
      console.error("Payment failed update error:", error);
    }

    if (!data || data.length === 0) {
      console.warn("No customer found for failed payment:", customerId);
    } else {
      await Promise.all(
        data.map((customer) =>
          recordAuditEvent(supabaseAdmin, {
            customerId: customer.id,
            actorType: "stripe",
            eventType: "payment_failed",
            eventDescription:
              "Stripe reported a failed payment. Customer was suspended.",
            metadata: {
              stripeCustomerId: customerId,
              invoiceId: invoice.id,
            },
          }),
        ),
      );
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    const customerId = subscription.customer;

    const { error } = await supabaseAdmin
      .from("customers")
      .update({
        status: "suspended",
        payment_status: "cancelled",
        inactive_reason: "subscription_cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_source: "stripe",
      })
      .eq("stripe_customer_id", customerId);

    if (error) {
      console.error("Subscription deleted error:", error);
    } else {
      const { data } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("stripe_customer_id", customerId);

      await Promise.all(
        (data || []).map((customer) =>
          recordAuditEvent(supabaseAdmin, {
            customerId: customer.id,
            actorType: "stripe",
            eventType: "subscription_cancelled",
            eventDescription:
              "Stripe subscription was cancelled. Customer was suspended.",
            metadata: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscription.id,
            },
          }),
        ),
      );
    }
  }

  return NextResponse.json({ received: true });
}

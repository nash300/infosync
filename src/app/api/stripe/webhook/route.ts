import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

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
      await supabaseAdmin
        .from("customers")
        .update({
          status: "active",
          payment_status: "paid",
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          activated_at: new Date().toISOString(),
        })
        .eq("id", customerId);
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
      })
      .eq("stripe_customer_id", customerId)
      .select();

    if (error) {
      console.error("Payment failed update error:", error);
    }

    if (!data || data.length === 0) {
      console.warn("No customer found for failed payment:", customerId);
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
      })
      .eq("stripe_customer_id", customerId);

    if (error) {
      console.error("Subscription deleted error:", error);
    }
  }

  return NextResponse.json({ received: true });
}

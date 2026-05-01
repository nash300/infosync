import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  try {
    const { customerId, subscriptionId } = await request.json();

    if (!customerId || !subscriptionId) {
      return NextResponse.json(
        { error: "Missing customerId or subscriptionId" },
        { status: 400 },
      );
    }

    let cancelledInStripe = false;

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      if (subscription.status !== "canceled") {
        await stripe.subscriptions.cancel(subscriptionId);
      }

      cancelledInStripe = true;
    } catch (err: any) {
      // If Stripe says it doesn't exist, we still continue
      if (err.code === "resource_missing") {
        console.warn("Subscription not found in Stripe, continuing anyway");
      } else {
        throw err;
      }
    }

    const { error } = await supabaseAdmin
      .from("customers")
      .update({
        status: "suspended",
        payment_status: "cancelled",
        inactive_reason: "subscription_cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_source: "admin",
      })
      .eq("id", customerId);

    if (error) {
      console.error("Supabase cancel update error:", error);
      return NextResponse.json(
        { error: "Subscription cancelled, but database update failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel subscription error:", error);

    return NextResponse.json(
      { error: "Could not cancel subscription" },
      { status: 500 },
    );
  }
}

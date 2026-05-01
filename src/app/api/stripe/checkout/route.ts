import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { customerId, email } = await request.json();

    if (!customerId || !email) {
      return NextResponse.json(
        { error: "Missing customerId or email" },
        { status: 400 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const priceId = process.env.STRIPE_PRICE_ID;

    if (!appUrl || !priceId) {
      return NextResponse.json(
        { error: "Stripe environment variables are missing" },
        { status: 500 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/onboarding/payment-success?customer_id=${customerId}`,
      cancel_url: `${appUrl}/onboarding/payment-cancelled`,
      metadata: {
        customer_id: customerId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      { error: "Could not create checkout session" },
      { status: 500 },
    );
  }
}
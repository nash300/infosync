import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getRequestIp, recordAuditEvent } from "@/lib/server/audit";
import { normalizeCustomerLanguage } from "@/lib/customer-language";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, email, pricingPlanCode, legalAccepted } = body;
    const language = normalizeCustomerLanguage(body.language);
    const ipAddress = getRequestIp(request);
    const userAgent = request.headers.get("user-agent");

    if (!customerId || !email || !pricingPlanCode) {
      return NextResponse.json(
        { error: "Kund, e-post eller prispaket saknas." },
        { status: 400 },
      );
    }

    if (!legalAccepted) {
      return NextResponse.json(
        { error: "Villkoren måste godkännas före betalning." },
        { status: 400 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      return NextResponse.json(
        { error: "Appens URL saknas." },
        { status: 500 },
      );
    }

    const { data: plan, error: planError } = await supabaseAdmin
      .from("pricing_plans")
      .select("*")
      .eq("code", pricingPlanCode)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: "Prispaketet hittades inte." },
        { status: 404 },
      );
    }

    if (!plan.stripe_setup_price_id || !plan.stripe_monthly_price_id) {
      return NextResponse.json(
        { error: "Betalningsinställningar saknas för detta paket." },
        { status: 500 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: plan.stripe_setup_price_id,
          quantity: 1,
        },
        {
          price: plan.stripe_monthly_price_id,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: plan.trial_days,
        metadata: {
          customer_id: customerId,
          pricing_plan_id: plan.id,
          pricing_plan_code: plan.code,
        },
      },
      success_url: `${appUrl}/onboarding/payment-success?customer_id=${customerId}&lang=${language}`,
      cancel_url: `${appUrl}/onboarding/payment-cancelled?lang=${language}`,
      metadata: {
        customer_id: customerId,
        pricing_plan_id: plan.id,
        pricing_plan_code: plan.code,
      },
    });

    await supabaseAdmin.from("customer_subscriptions").insert({
      customer_id: customerId,
      pricing_plan_id: plan.id,
      status: "checkout_started",
      stripe_checkout_session_id: session.id,
      legal_acceptance_at: new Date().toISOString(),
      legal_acceptance_ip: ipAddress,
    });

    await recordAuditEvent(supabaseAdmin, {
      customerId,
      actorType: "customer",
      eventType: "stripe_checkout_started",
      eventDescription: "Customer started Stripe checkout from onboarding.",
      metadata: {
        pricingPlanCode: plan.code,
        pricingPlanId: plan.id,
        stripeCheckoutSessionId: session.id,
        language,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      { error: "Det gick inte att starta betalningen." },
      { status: 500 },
    );
  }
}

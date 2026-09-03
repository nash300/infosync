import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRequestIp } from "@/lib/server/audit";
import { checkPersistentRateLimit } from "@/lib/server/persistent-rate-limit";
import { rateLimitHeaders } from "@/lib/server/rate-limit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const payableStatuses = ["quote_prepared", "quote_sent", "checkout_started"];
const ONBOARDING_LOOKUP_LIMIT = 30;
const ONBOARDING_LOOKUP_WINDOW_MS = 15 * 60 * 1000;

function isMissingOrExpiredToken(expiresAt: string | null | undefined) {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

function noStoreJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...init?.headers,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const rateLimit = await checkPersistentRateLimit(supabaseAdmin, {
    key: `onboarding-status:${getRequestIp(request) || "unknown"}`,
    limit: ONBOARDING_LOOKUP_LIMIT,
    windowMs: ONBOARDING_LOOKUP_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return noStoreJson(
      { error: "For manga forsok. Forsok igen senare." },
      { status: 429, headers: rateLimitHeaders(rateLimit) },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { token?: unknown };
  const token = String(body.token || "").trim();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(token)) {
    return noStoreJson({ error: "Ogiltig startlank." }, { status: 404 });
  }

  const { data: customer, error: customerError } = await supabaseAdmin
    .from("customers")
    .select("id, name, email, status, payment_status, onboarding_token_expires_at")
    .eq("onboarding_token", token)
    .single();

  if (customerError || !customer) {
    return noStoreJson({ error: "Ogiltig startlank." }, { status: 404 });
  }

  if (isMissingOrExpiredToken(customer.onboarding_token_expires_at)) {
    return noStoreJson(
      { error: "Startlanken har gatt ut." },
      { status: 410 },
    );
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("customer_subscriptions")
    .select("id, status, stripe_payment_status")
    .eq("customer_id", customer.id)
    .in("status", payableStatuses)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) {
    console.error("Onboarding order status lookup error:", orderError);
    return noStoreJson(
      { error: "Orderstatus kunde inte hamtas." },
      { status: 500 },
    );
  }

  return noStoreJson({
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      status: customer.status,
      payment_status: customer.payment_status,
      onboarding_token_expires_at: customer.onboarding_token_expires_at,
    },
    hasPayableOrder:
      Boolean(order) && !["paid", "complete"].includes(order?.stripe_payment_status || ""),
    orderStatus: order?.status || null,
  }, { headers: rateLimitHeaders(rateLimit) });
}

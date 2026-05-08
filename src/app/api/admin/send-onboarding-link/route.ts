import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getRequestIp, recordAuditEvent } from "@/lib/server/audit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

const getResendErrorMessage = async (response: Response) => {
  const text = await response.text();

  if (!text.trim()) {
    return `Resend returned ${response.status}.`;
  }

  try {
    const data: unknown = JSON.parse(text);
    if (data && typeof data === "object") {
      const message =
        "message" in data && typeof data.message === "string"
          ? data.message
          : null;
      const error =
        "error" in data && typeof data.error === "string" ? data.error : null;

      return message || error || `Resend returned ${response.status}.`;
    }
  } catch {
    return text.trim();
  }

  return `Resend returned ${response.status}.`;
};

const createAuthenticatedClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
};

export async function POST(request: Request) {
  const supabase = await createAuthenticatedClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { customerId } = await request.json();
  const ipAddress = getRequestIp(request);
  const userAgent = request.headers.get("user-agent");

  if (!customerId) {
    return NextResponse.json(
      { error: "Missing customer id." },
      { status: 400 },
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const resendFromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() || "InfoSync <onboarding@resend.dev>";

  const canSendEmail = Boolean(resendApiKey);

  const { data: customer, error: customerError } = await supabaseAdmin
    .from("customers")
    .select("id, name, email, notes")
    .eq("id", customerId)
    .single();

  if (customerError || !customer) {
    return NextResponse.json(
      { error: "Customer was not found." },
      { status: 404 },
    );
  }

  if (canSendEmail && !customer.email) {
    return NextResponse.json(
      { error: "Customer does not have an email address." },
      { status: 400 },
    );
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    `${new URL(request.url).protocol}//${new URL(request.url).host}`;
  const onboardingUrl = `${appUrl}/onboarding/${token}`;
  const customerName = escapeHtml(customer.name);

  const { error: tokenError } = await supabaseAdmin
    .from("customers")
    .update({
      onboarding_token: token,
      onboarding_token_expires_at: expiresAt.toISOString(),
    })
    .eq("id", customer.id);

  if (tokenError) {
    console.error("Onboarding token database update error:", tokenError);
    return NextResponse.json(
      { error: "Could not prepare onboarding link." },
      { status: 500 },
    );
  }

  await recordAuditEvent(supabaseAdmin, {
    customerId: customer.id,
    actorType: "admin",
    actorId: user.id,
    eventType: "onboarding_link_prepared",
    eventDescription: "Admin prepared an onboarding link.",
    metadata: {
      expiresAt: expiresAt.toISOString(),
    },
    ipAddress,
    userAgent,
  });

  if (!canSendEmail) {
    return NextResponse.json({
      success: true,
      emailSent: false,
      onboardingUrl,
      warning:
        "Onboarding link created. Email sending is not configured. Add RESEND_API_KEY to send emails.",
    });
  }

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: customer.email,
      subject: "Din onboardinglänk till InfoSync",
      text: `Hej ${customer.name},

Slutför din onboarding för InfoSync här:
${onboardingUrl}

Länken gäller i 14 dagar.

Vänliga hälsningar,
InfoSync`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #102033; line-height: 1.6;">
          <h1 style="color: #09244a;">Välkommen till InfoSync</h1>
          <p>Hej ${customerName},</p>
          <p>Slutför din onboarding via den säkra länken nedan.</p>
          <p>
            <a href="${onboardingUrl}" style="display: inline-block; background: #145da0; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 700;">
              Slutför onboarding
            </a>
          </p>
          <p style="color: #5f7187;">Länken gäller i 14 dagar.</p>
          <p>Vänliga hälsningar,<br />InfoSync</p>
        </div>
      `,
    }),
  });

  if (!emailResponse.ok) {
    const errorMessage = await getResendErrorMessage(emailResponse);
    console.error("Resend email error:", errorMessage);

    return NextResponse.json(
      { error: `Could not send onboarding email: ${errorMessage}` },
      { status: 502 },
    );
  }

  const existingNotes = customer.notes?.trim();
  const sentNote = `Onboarding email sent: ${new Date().toISOString()}`;

  const { error: updateError } = await supabaseAdmin
    .from("customers")
    .update({
      status: "invited",
      notes: existingNotes ? `${existingNotes}\n${sentNote}` : sentNote,
    })
    .eq("id", customer.id);

  if (updateError) {
    console.error("Onboarding email database update error:", updateError);
    return NextResponse.json(
      { error: "Email was sent, but customer status update failed." },
      { status: 500 },
    );
  }

  await recordAuditEvent(supabaseAdmin, {
    customerId: customer.id,
    actorType: "system",
    eventType: "onboarding_email_sent",
    eventDescription: "System sent onboarding email to customer.",
    metadata: {
      sentTo: customer.email,
      expiresAt: expiresAt.toISOString(),
    },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({
    success: true,
    emailSent: true,
    sentTo: customer.email,
    onboardingUrl,
  });
}

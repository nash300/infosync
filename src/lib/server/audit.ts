import type { SupabaseClient } from "@supabase/supabase-js";

type AuditEventInput = {
  customerId?: string | null;
  actorType: "system" | "admin" | "customer" | "stripe";
  actorId?: string | null;
  eventType: string;
  eventDescription: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function recordAuditEvent(
  supabaseAdmin: SupabaseClient,
  event: AuditEventInput,
) {
  const { error } = await supabaseAdmin.from("audit_events").insert({
    customer_id: event.customerId || null,
    actor_type: event.actorType,
    actor_id: event.actorId || null,
    event_type: event.eventType,
    event_description: event.eventDescription,
    metadata: event.metadata || {},
    ip_address: event.ipAddress || null,
    user_agent: event.userAgent || null,
  });

  if (error) {
    console.warn("Audit event was not stored:", error.message);
  }
}

type ConsentRecordInput = {
  customerId: string;
  consentType: string;
  granted: boolean;
  statement: string;
  documentName: string;
  documentVersion: string;
  documentUrl?: string | null;
  collectionPoint: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function recordConsent(
  supabaseAdmin: SupabaseClient,
  consent: ConsentRecordInput,
) {
  const { error } = await supabaseAdmin.from("consent_records").insert({
    customer_id: consent.customerId,
    consent_type: consent.consentType,
    granted: consent.granted,
    statement: consent.statement,
    document_name: consent.documentName,
    document_version: consent.documentVersion,
    document_url: consent.documentUrl || null,
    collection_point: consent.collectionPoint,
    ip_address: consent.ipAddress || null,
    user_agent: consent.userAgent || null,
  });

  if (error) {
    console.warn("Consent record was not stored:", error.message);
  }
}

export function getRequestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

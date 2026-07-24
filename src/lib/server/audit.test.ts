import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getRequestIp,
  recordAuditEvent,
  recordConsent,
  recordLegalAgreement,
} from "./audit";

function insertClient({
  insertError = null,
  legalDocument = { data: { id: "legal-1" }, error: null },
}: {
  insertError?: { code?: string; message: string } | null;
  legalDocument?: {
    data: { id: string } | null;
    error: { message: string } | null;
  };
} = {}) {
  const inserts: Array<{ table: string; payload: Record<string, unknown> }> = [];

  const client = {
    from: (table: string) => ({
      insert: async (payload: Record<string, unknown>) => {
        inserts.push({ table, payload });
        return { error: insertError };
      },
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => legalDocument,
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;

  return { client, inserts };
}

describe("audit event persistence", () => {
  it("maps complete audit evidence into the database row", async () => {
    const { client, inserts } = insertClient();

    await recordAuditEvent(
      client,
      {
        customerId: "customer-1",
        actorType: "customer",
        actorId: "actor-1",
        eventType: "customer_created",
        eventDescription: "Customer was created.",
        dedupeKey: "customer-created:customer-1",
        metadata: { source: "test" },
        ipAddress: "192.0.2.10",
        userAgent: "Lifecycle test",
      },
      { throwOnError: true },
    );

    expect(inserts).toEqual([
      {
        table: "audit_events",
        payload: {
          customer_id: "customer-1",
          actor_type: "customer",
          actor_id: "actor-1",
          event_type: "customer_created",
          event_description: "Customer was created.",
          dedupe_key: "customer-created:customer-1",
          metadata: { source: "test" },
          ip_address: "192.0.2.10",
          user_agent: "Lifecycle test",
        },
      },
    ]);
  });

  it("treats a duplicate dedupe key as an idempotent success", async () => {
    const { client } = insertClient({
      insertError: { code: "23505", message: "duplicate key" },
    });

    await expect(
      recordAuditEvent(
        client,
        {
          actorType: "stripe",
          eventType: "payment_completed",
          eventDescription: "Payment completed.",
          dedupeKey: "stripe:event-1",
        },
        { throwOnError: true },
      ),
    ).resolves.toBeUndefined();
  });

  it("throws storage errors in strict mode", async () => {
    const { client } = insertClient({
      insertError: { code: "500", message: "database unavailable" },
    });

    await expect(
      recordAuditEvent(
        client,
        {
          actorType: "system",
          eventType: "required_evidence",
          eventDescription: "Required evidence.",
        },
        { throwOnError: true },
      ),
    ).rejects.toMatchObject({ message: "database unavailable" });
  });

  it("logs but does not throw optional audit errors", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { client } = insertClient({
      insertError: { code: "500", message: "optional audit unavailable" },
    });

    await expect(
      recordAuditEvent(client, {
        actorType: "system",
        eventType: "optional_evidence",
        eventDescription: "Optional evidence.",
      }),
    ).resolves.toBeUndefined();
    expect(warning).toHaveBeenCalledWith(
      "Audit event was not stored:",
      "optional audit unavailable",
    );
    warning.mockRestore();
  });
});

describe("consent and legal evidence", () => {
  it("stores consent with document and request attribution", async () => {
    const { client, inserts } = insertClient();

    await recordConsent(
      client,
      {
        customerId: "customer-1",
        consentType: "privacy",
        granted: true,
        statement: "Accepted",
        documentName: "Privacy policy",
        documentVersion: "v1",
        documentUrl: "/privacy",
        collectionPoint: "onboarding",
        ipAddress: "192.0.2.10",
        userAgent: "Lifecycle test",
      },
      { throwOnError: true },
    );

    expect(inserts[0]).toMatchObject({
      table: "consent_records",
      payload: {
        customer_id: "customer-1",
        consent_type: "privacy",
        granted: true,
        document_version: "v1",
        collection_point: "onboarding",
        ip_address: "192.0.2.10",
      },
    });
  });

  it("links a legal agreement to the matching legal document", async () => {
    const { client, inserts } = insertClient();

    await recordLegalAgreement(
      client,
      {
        customerId: "customer-1",
        documentType: "terms",
        documentTitle: "Terms",
        documentVersion: "v1",
        contentSnapshot: "Terms snapshot",
        collectionPoint: "onboarding",
      },
      { throwOnError: true },
    );

    expect(inserts[0]).toMatchObject({
      table: "customer_legal_agreements",
      payload: {
        customer_id: "customer-1",
        legal_document_id: "legal-1",
        document_type: "terms",
        document_version: "v1",
        content_snapshot: "Terms snapshot",
      },
    });
  });

  it("stores the legal snapshot without a foreign key when lookup fails", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { client, inserts } = insertClient({
      legalDocument: {
        data: null,
        error: { message: "legal catalog unavailable" },
      },
    });

    await recordLegalAgreement(client, {
      customerId: "customer-1",
      documentType: "privacy",
      documentTitle: "Privacy",
      documentVersion: "v2",
      contentSnapshot: "Privacy snapshot",
      collectionPoint: "onboarding",
    });

    expect(inserts[0].payload.legal_document_id).toBeNull();
    expect(warning).toHaveBeenCalledWith(
      "Legal document lookup failed:",
      "legal catalog unavailable",
    );
    warning.mockRestore();
  });
});

describe("request attribution", () => {
  it("uses the first forwarded IP address", () => {
    const request = new Request("https://screenia.se", {
      headers: { "x-forwarded-for": "192.0.2.10, 198.51.100.4" },
    });
    expect(getRequestIp(request)).toBe("192.0.2.10");
  });

  it("falls back to the direct proxy IP and then null", () => {
    expect(
      getRequestIp(
        new Request("https://screenia.se", {
          headers: { "x-real-ip": "198.51.100.4" },
        }),
      ),
    ).toBe("198.51.100.4");
    expect(getRequestIp(new Request("https://screenia.se"))).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import {
  journalEntriesFromAuditEvents,
  mergeJournalEntries,
  normalizeJournalCategory,
} from "./customer-journal";
import type { AuditEvent } from "./types";

const auditEvent = (overrides: Partial<AuditEvent>): AuditEvent => ({
  id: "audit-1",
  actor_type: "admin",
  actor_id: "admin-1",
  event_type: "admin_inventory_item_allocated",
  event_description: "Admin allocated inventory to the customer.",
  metadata: {},
  created_at: "2026-08-13T10:00:00.000Z",
  ...overrides,
});

describe("customer journal", () => {
  it("turns a manual audit entry into a categorized journal entry", () => {
    expect(
      journalEntriesFromAuditEvents([
        auditEvent({
          event_type: "customer_journal_entry_created",
          metadata: {
            category: "troubleshooting",
            title: "Display offline",
            note: "Asked the customer to restart the media unit.",
          },
        }),
      ]),
    ).toEqual([
      expect.objectContaining({
        category: "troubleshooting",
        title: "Display offline",
        body: "Asked the customer to restart the media unit.",
        source: "Journal entry",
      }),
    ]);
  });

  it("surfaces an allocation reason as an operational journal note", () => {
    expect(
      journalEntriesFromAuditEvents([
        auditEvent({ metadata: { reason: "Prepared for the reception screen." } }),
      ]),
    ).toEqual([
      expect.objectContaining({
        category: "troubleshooting",
        body: "Prepared for the reception screen.",
        source: "Operational action",
      }),
    ]);
  });

  it("ignores unrelated technical metadata", () => {
    expect(
      journalEntriesFromAuditEvents([
        auditEvent({ metadata: { inventoryItemId: "item-1", deviceCode: "ABC" } }),
      ]),
    ).toEqual([]);
  });

  it("deduplicates identical contextual notes and orders newest first", () => {
    const entries = mergeJournalEntries(
      [
        {
          id: "old",
          category: "general",
          title: "Customer note",
          body: "Call after lunch.",
          source: "Customer profile",
          createdAt: "2026-08-12T10:00:00.000Z",
        },
      ],
      [
        {
          id: "duplicate",
          category: "general",
          title: "Customer note",
          body: "Call after lunch.",
          source: "Customer profile",
          createdAt: "2026-08-12T11:00:00.000Z",
        },
        {
          id: "new",
          category: "follow_up",
          title: "Follow-up",
          body: "Send confirmation tomorrow.",
          source: "Journal entry",
          createdAt: "2026-08-13T10:00:00.000Z",
        },
      ],
    );

    expect(entries.map((entry) => entry.id)).toEqual(["new", "old"]);
  });

  it("falls back to the general category for unknown values", () => {
    expect(normalizeJournalCategory("unknown")).toBe("general");
  });
});

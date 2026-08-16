import { describe, expect, it } from "vitest";
import { groupCustomerMessageThreads } from "./customer-message-threads";

describe("groupCustomerMessageThreads", () => {
  it("keeps every message and orders each conversation chronologically", () => {
    const threads = groupCustomerMessageThreads([
      { id: "reply", ticketNumber: "IS-1", createdAt: "2026-08-16T10:02:00Z" },
      { id: "other", ticketNumber: "IS-2", createdAt: "2026-08-16T11:00:00Z" },
      { id: "question", ticketNumber: "IS-1", createdAt: "2026-08-16T10:00:00Z" },
      { id: "follow-up", ticketNumber: "IS-1", createdAt: "2026-08-16T10:03:00Z" },
    ]);

    expect(threads.map((thread) => thread.ticketNumber)).toEqual(["IS-2", "IS-1"]);
    expect(threads[1].messages.map((message) => message.id)).toEqual([
      "question",
      "reply",
      "follow-up",
    ]);
  });

  it("does not merge legacy messages that have no ticket number", () => {
    const threads = groupCustomerMessageThreads([
      { id: "one", ticketNumber: null, createdAt: "2026-08-16T10:00:00Z" },
      { id: "two", ticketNumber: null, createdAt: "2026-08-16T10:01:00Z" },
    ]);

    expect(threads).toHaveLength(2);
    expect(threads.every((thread) => thread.messages.length === 1)).toBe(true);
  });
});

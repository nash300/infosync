import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  contactInquiryReplyAddress,
  extractLatestEmailReply,
  findContactCaseNumber,
  processInboundContactReply,
  type InboundContactEmailEvent,
  type InboundContactReplyDependencies,
} from "./contact-inquiry-inbound";

const event: InboundContactEmailEvent = {
  emailId: "inbound-1",
  messageId: "<message-1@example.test>",
  from: "Visitor <visitor@example.test>",
  to: ["sc-20260816-ABC123@reply.screenia.se"],
  subject: "Re: Screenia case",
  createdAt: "2026-08-16T17:00:00Z",
};

const createDependencies = () => {
  const dependencies: InboundContactReplyDependencies = {
    findInquiry: vi.fn().mockResolvedValue({
      id: "inquiry-1",
      caseNumber: "SC-20260816-ABC123",
      email: "visitor@example.test",
      name: "Visitor",
    }),
    retrieveEmail: vi.fn().mockResolvedValue({
      text: "My latest reply\n\nOn Sun, Screenia wrote:\n> Earlier text",
      html: null,
      createdAt: "2026-08-16T17:00:01Z",
    }),
    saveReply: vi.fn().mockResolvedValue({ id: "reply-1", duplicate: false }),
    reopenInquiry: vi.fn().mockResolvedValue(undefined),
    notify: vi.fn().mockResolvedValue(undefined),
    audit: vi.fn().mockResolvedValue(undefined),
  };
  return dependencies;
};

describe("contact inquiry inbound email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds a case-specific address on the isolated reply subdomain", () => {
    expect(
      contactInquiryReplyAddress(
        "SC-20260816-ABC123",
        "reply.screenia.se",
      ),
    ).toBe("sc-20260816-abc123@reply.screenia.se");
    expect(
      contactInquiryReplyAddress("SC-20260816-ABC123", "invalid domain"),
    ).toBe("service@screenia.se");
  });

  it("matches the case from the recipient before falling back to the subject", () => {
    expect(findContactCaseNumber(event.to, event.subject)).toBe(
      "SC-20260816-ABC123",
    );
    expect(
      findContactCaseNumber(
        ["support@reply.screenia.se"],
        "Re: SC-20260815-DEF456",
      ),
    ).toBe("SC-20260815-DEF456");
  });

  it("keeps only the newest reply and removes quoted email history", () => {
    expect(
      extractLatestEmailReply({
        text: "Here is the answer.\n\nOn Sunday, Screenia wrote:\n> Old reply",
        html: null,
      }),
    ).toBe("Here is the answer.");
    expect(
      extractLatestEmailReply({
        text: null,
        html: "<div>HTML answer</div><blockquote>Old text</blockquote>",
      }),
    ).toBe("HTML answer");
  });

  it("stores a valid visitor reply, reopens the case, notifies, and audits", async () => {
    const dependencies = createDependencies();
    const result = await processInboundContactReply(event, dependencies);

    expect(result).toEqual({
      status: "stored",
      inquiryId: "inquiry-1",
      caseNumber: "SC-20260816-ABC123",
      replyId: "reply-1",
    });
    expect(dependencies.saveReply).toHaveBeenCalledWith(
      expect.objectContaining({
        inquiryId: "inquiry-1",
        senderEmail: "visitor@example.test",
        message: "My latest reply",
        inboundEmailId: "inbound-1",
      }),
    );
    expect(dependencies.reopenInquiry).toHaveBeenCalledWith("inquiry-1");
    expect(dependencies.notify).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "visitor_contact_reply_received" }),
    );
    expect(dependencies.audit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "visitor_contact_reply_received" }),
    );
  });

  it("heals the open state but does not notify twice for a duplicate webhook", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.saveReply).mockResolvedValue({
      id: "reply-existing",
      duplicate: true,
    });

    const result = await processInboundContactReply(event, dependencies);

    expect(result.status).toBe("duplicate");
    expect(dependencies.reopenInquiry).toHaveBeenCalledWith("inquiry-1");
    expect(dependencies.notify).not.toHaveBeenCalled();
    expect(dependencies.audit).not.toHaveBeenCalled();
  });

  it("keeps an unknown case out of the conversation and alerts the admin", async () => {
    const dependencies = createDependencies();
    vi.mocked(dependencies.findInquiry).mockResolvedValue(null);

    const result = await processInboundContactReply(event, dependencies);

    expect(result.status).toBe("ignored");
    expect(dependencies.retrieveEmail).not.toHaveBeenCalled();
    expect(dependencies.saveReply).not.toHaveBeenCalled();
    expect(dependencies.notify).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "visitor_contact_reply_unknown_case" }),
    );
  });

  it("rejects a different sender and records security evidence", async () => {
    const dependencies = createDependencies();
    const result = await processInboundContactReply(
      { ...event, from: "attacker@example.test" },
      dependencies,
    );

    expect(result.status).toBe("rejected");
    expect(dependencies.retrieveEmail).not.toHaveBeenCalled();
    expect(dependencies.saveReply).not.toHaveBeenCalled();
    expect(dependencies.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "visitor_contact_reply_sender_mismatch",
        priority: "urgent",
      }),
    );
    expect(dependencies.audit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "visitor_contact_reply_rejected" }),
    );
  });
});

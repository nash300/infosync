import { describe, expect, it } from "vitest";
import { buildContactInquiryConversation } from "./contact-inquiry-conversation";

describe("buildContactInquiryConversation", () => {
  it("shows the visitor message and Screenia replies in time order", () => {
    const conversation = buildContactInquiryConversation({
      inquiryId: "case-1",
      message: "Can you help me?",
      createdAt: "2026-08-16T10:00:00Z",
      replies: [
        {
          id: "reply-2",
          senderRole: "visitor",
          message: "Here is the next step.",
          emailStatus: null,
          createdAt: "2026-08-16T10:10:00Z",
        },
        {
          id: "reply-1",
          senderRole: "admin",
          message: "Yes, we can help.",
          emailStatus: "sent",
          createdAt: "2026-08-16T10:05:00Z",
        },
      ],
    });

    expect(conversation.map((item) => item.sender)).toEqual([
      "visitor",
      "screenia",
      "visitor",
    ]);
    expect(conversation.map((item) => item.message)).toEqual([
      "Can you help me?",
      "Yes, we can help.",
      "Here is the next step.",
    ]);
    expect(conversation[2].emailStatus).toBeNull();
  });

  it("still creates a conversation when no reply has been sent", () => {
    const conversation = buildContactInquiryConversation({
      inquiryId: "case-2",
      message: "What does the service cost?",
      createdAt: "2026-08-16T11:00:00Z",
      replies: [],
    });

    expect(conversation).toEqual([
      {
        id: "inquiry:case-2",
        sender: "visitor",
        message: "What does the service cost?",
        createdAt: "2026-08-16T11:00:00Z",
        emailStatus: null,
      },
    ]);
  });
});

export type ContactInquiryReply = {
  id: string;
  senderRole: "visitor" | "admin";
  message: string;
  emailStatus: string | null;
  createdAt: string;
};

export type ContactInquiryConversationItem = {
  id: string;
  sender: "visitor" | "screenia";
  message: string;
  createdAt: string;
  emailStatus: string | null;
};

type ContactInquiryConversationInput = {
  inquiryId: string;
  message: string;
  createdAt: string;
  replies: ContactInquiryReply[];
};

export function buildContactInquiryConversation({
  inquiryId,
  message,
  createdAt,
  replies,
}: ContactInquiryConversationInput): ContactInquiryConversationItem[] {
  return [
    {
      id: `inquiry:${inquiryId}`,
      sender: "visitor" as const,
      message,
      createdAt,
      emailStatus: null,
    },
    ...replies.map((reply) => ({
      id: `reply:${reply.id}`,
      sender: reply.senderRole === "visitor" ? ("visitor" as const) : ("screenia" as const),
      message: reply.message,
      createdAt: reply.createdAt,
      emailStatus: reply.emailStatus,
    })),
  ].sort(
    (left, right) =>
      Date.parse(left.createdAt) - Date.parse(right.createdAt),
  );
}

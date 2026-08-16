export type InboundContactEmailEvent = {
  emailId: string;
  messageId: string | null;
  from: string;
  to: string[];
  subject: string;
  createdAt: string;
};

export type ReceivedEmailContent = {
  text: string | null;
  html: string | null;
  createdAt: string | null;
};

export type ContactInquiryMatch = {
  id: string;
  caseNumber: string;
  email: string;
  name: string;
};

type StoredReply = {
  id: string;
  duplicate: boolean;
};

type NotificationInput = {
  eventType: string;
  title: string;
  message: string;
  priority: "high" | "urgent";
  metadata: Record<string, unknown>;
};

type AuditInput = {
  eventType: string;
  eventDescription: string;
  metadata: Record<string, unknown>;
};

export type InboundContactReplyDependencies = {
  findInquiry(caseNumber: string): Promise<ContactInquiryMatch | null>;
  retrieveEmail(emailId: string): Promise<ReceivedEmailContent>;
  saveReply(input: {
    inquiryId: string;
    senderEmail: string;
    message: string;
    inboundEmailId: string;
    inboundMessageId: string | null;
    createdAt: string;
  }): Promise<StoredReply>;
  reopenInquiry(inquiryId: string): Promise<void>;
  notify(input: NotificationInput): Promise<void>;
  audit(input: AuditInput): Promise<void>;
};

export type InboundContactReplyResult = {
  status: "stored" | "duplicate" | "ignored" | "rejected";
  inquiryId: string | null;
  caseNumber: string | null;
  replyId: string | null;
};

const caseNumberPattern = /\bSC-\d{8}-[A-Z0-9]{6}\b/i;

export function findContactCaseNumber(to: string[], subject: string) {
  for (const recipient of to) {
    const match = recipient.match(caseNumberPattern);
    if (match) return match[0].toUpperCase();
  }

  const subjectMatch = subject.match(caseNumberPattern);
  return subjectMatch ? subjectMatch[0].toUpperCase() : null;
}

export function normalizeEmailAddress(value: string) {
  const bracketed = value.match(/<([^<>]+)>/);
  return (bracketed?.[1] || value).trim().toLowerCase();
}

function decodeBasicHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code) =>
      String.fromCodePoint(Number(code)),
    );
}

export function htmlEmailToText(html: string) {
  return decodeBasicHtmlEntities(
    html
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<blockquote\b[^>]*>[\s\S]*?<\/blockquote>/gi, "")
      .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  );
}

export function extractLatestEmailReply({
  text,
  html,
}: Pick<ReceivedEmailContent, "text" | "html">) {
  const source = (text || (html ? htmlEmailToText(html) : ""))
    .replace(/\r\n?/g, "\n")
    .trim();
  if (!source) return "";

  const replyBoundary = /^(?:On .+wrote:|Den .+skrev:|From:|Från:|Sent:|Skickat:|-----Original Message-----|_{5,})$/i;
  const kept: string[] = [];

  for (const line of source.split("\n")) {
    const trimmed = line.trim();
    if (replyBoundary.test(trimmed)) break;
    if (trimmed.startsWith(">")) continue;
    kept.push(line.trimEnd());
  }

  return kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 4000);
}

export function contactInquiryReplyAddress(
  caseNumber: string,
  inboundDomain: string | null | undefined,
  fallbackAddress = "service@screenia.se",
) {
  const domain = String(inboundDomain || "")
    .trim()
    .toLowerCase();
  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)) {
    return fallbackAddress;
  }
  return `${caseNumber.toLowerCase()}@${domain}`;
}

export async function processInboundContactReply(
  event: InboundContactEmailEvent,
  dependencies: InboundContactReplyDependencies,
): Promise<InboundContactReplyResult> {
  const caseNumber = findContactCaseNumber(event.to, event.subject);
  if (!caseNumber) {
    await dependencies.notify({
      eventType: "visitor_contact_reply_unmatched",
      title: "Email reply could not be matched",
      message: `An incoming email from ${event.from} has no Screenia case number.`,
      priority: "high",
      metadata: { inboundEmailId: event.emailId, subject: event.subject },
    });
    return { status: "ignored", inquiryId: null, caseNumber: null, replyId: null };
  }

  const inquiry = await dependencies.findInquiry(caseNumber);
  if (!inquiry) {
    await dependencies.notify({
      eventType: "visitor_contact_reply_unknown_case",
      title: `Unknown email case ${caseNumber}`,
      message: `An incoming email refers to ${caseNumber}, but that case was not found.`,
      priority: "high",
      metadata: { inboundEmailId: event.emailId, caseNumber, subject: event.subject },
    });
    return { status: "ignored", inquiryId: null, caseNumber, replyId: null };
  }

  const senderEmail = normalizeEmailAddress(event.from);
  if (senderEmail !== normalizeEmailAddress(inquiry.email)) {
    await dependencies.notify({
      eventType: "visitor_contact_reply_sender_mismatch",
      title: `Check sender for ${caseNumber}`,
      message: `An email for ${caseNumber} came from ${senderEmail}, not the visitor's saved email.`,
      priority: "urgent",
      metadata: {
        inboundEmailId: event.emailId,
        caseNumber,
        expectedEmail: inquiry.email,
        senderEmail,
      },
    });
    await dependencies.audit({
      eventType: "visitor_contact_reply_rejected",
      eventDescription: "An inbound contact reply was rejected because the sender did not match the case.",
      metadata: { inboundEmailId: event.emailId, caseNumber, senderEmail },
    });
    return {
      status: "rejected",
      inquiryId: inquiry.id,
      caseNumber,
      replyId: null,
    };
  }

  const email = await dependencies.retrieveEmail(event.emailId);
  const message = extractLatestEmailReply(email);
  if (!message) {
    await dependencies.notify({
      eventType: "visitor_contact_reply_empty",
      title: `Empty reply for ${caseNumber}`,
      message: "An incoming customer email had no readable message text.",
      priority: "high",
      metadata: { inboundEmailId: event.emailId, caseNumber },
    });
    return {
      status: "ignored",
      inquiryId: inquiry.id,
      caseNumber,
      replyId: null,
    };
  }

  const saved = await dependencies.saveReply({
    inquiryId: inquiry.id,
    senderEmail,
    message,
    inboundEmailId: event.emailId,
    inboundMessageId: event.messageId,
    createdAt: email.createdAt || event.createdAt,
  });

  await dependencies.reopenInquiry(inquiry.id);

  if (!saved.duplicate) {
    await Promise.all([
      dependencies.notify({
        eventType: "visitor_contact_reply_received",
        title: `New reply from ${inquiry.name}`,
        message: `${inquiry.name} replied to ${caseNumber}. Open Messages to read it.`,
        priority: "high",
        metadata: {
          inquiryId: inquiry.id,
          replyId: saved.id,
          inboundEmailId: event.emailId,
          caseNumber,
        },
      }),
      dependencies.audit({
        eventType: "visitor_contact_reply_received",
        eventDescription: "A visitor email reply was added to its contact conversation.",
        metadata: {
          inquiryId: inquiry.id,
          replyId: saved.id,
          inboundEmailId: event.emailId,
          caseNumber,
          senderEmail,
        },
      }),
    ]);
  }

  return {
    status: saved.duplicate ? "duplicate" : "stored",
    inquiryId: inquiry.id,
    caseNumber,
    replyId: saved.id,
  };
}

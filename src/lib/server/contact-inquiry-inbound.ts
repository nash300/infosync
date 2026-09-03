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
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  let decoded = "";

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== "&") {
      decoded += value[index];
      continue;
    }

    const semicolon = value.indexOf(";", index + 1);
    if (semicolon < 0 || semicolon - index > 12) {
      decoded += "&";
      continue;
    }

    const entity = value.slice(index + 1, semicolon);
    const named = namedEntities[entity.toLowerCase()];
    let replacement = named;

    if (!replacement && entity.startsWith("#")) {
      const hexadecimal = entity[1]?.toLowerCase() === "x";
      const digits = entity.slice(hexadecimal ? 2 : 1);
      const radix = hexadecimal ? 16 : 10;
      const codePoint = Number.parseInt(digits, radix);
      const validDigits = digits.length > 0 && [...digits].every((character) => {
        const code = character.charCodeAt(0);
        if (code >= 48 && code <= 57) return true;
        return hexadecimal && (
          (code >= 65 && code <= 70) ||
          (code >= 97 && code <= 102)
        );
      });

      if (
        validDigits &&
        Number.isInteger(codePoint) &&
        codePoint > 0 &&
        codePoint <= 0x10ffff &&
        !(codePoint >= 0xd800 && codePoint <= 0xdfff)
      ) {
        replacement = String.fromCodePoint(codePoint);
      }
    }

    if (replacement === undefined) {
      decoded += value.slice(index, semicolon + 1);
    } else {
      decoded += replacement;
    }
    index = semicolon;
  }

  return decoded;
}

function findHtmlTagEnd(html: string, start: number) {
  let quote = "";

  for (let index = start + 1; index < html.length; index += 1) {
    const character = html[index];
    if (quote) {
      if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === ">") return index;
  }

  return -1;
}

function parseHtmlTag(value: string) {
  let cursor = 0;
  while (value[cursor] === " " || value[cursor] === "\t" || value[cursor] === "\n") {
    cursor += 1;
  }
  const closing = value[cursor] === "/";
  if (closing) cursor += 1;
  while (value[cursor] === " " || value[cursor] === "\t" || value[cursor] === "\n") {
    cursor += 1;
  }

  let name = "";
  for (; cursor < value.length; cursor += 1) {
    const character = value[cursor].toLowerCase();
    const code = character.charCodeAt(0);
    if ((code < 97 || code > 122) && (code < 48 || code > 57)) break;
    name += character;
  }

  return { closing, name, selfClosing: value.trimEnd().endsWith("/") };
}

export function htmlEmailToText(html: string) {
  const ignoredTags: string[] = [];
  const hiddenTags = new Set(["blockquote", "script", "style"]);
  const lineBreakTags = new Set(["div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "p"]);
  let text = "";

  const appendLineBreak = () => {
    if (text && !text.endsWith("\n")) text += "\n";
  };

  for (let index = 0; index < html.length;) {
    if (html[index] !== "<") {
      if (ignoredTags.length === 0) text += html[index];
      index += 1;
      continue;
    }

    if (html.startsWith("<!--", index)) {
      const commentEnd = html.indexOf("-->", index + 4);
      index = commentEnd < 0 ? html.length : commentEnd + 3;
      continue;
    }

    const tagEnd = findHtmlTagEnd(html, index);
    if (tagEnd < 0) {
      if (ignoredTags.length === 0) text += html.slice(index);
      break;
    }

    const tag = parseHtmlTag(html.slice(index + 1, tagEnd));
    const activeIgnoredTag = ignoredTags.at(-1);
    if (activeIgnoredTag) {
      if (tag.closing && tag.name === activeIgnoredTag) {
        ignoredTags.pop();
      } else if (
        activeIgnoredTag === "blockquote" &&
        !tag.closing &&
        !tag.selfClosing &&
        tag.name === activeIgnoredTag
      ) {
        ignoredTags.push(tag.name);
      }
    } else if (!tag.closing && !tag.selfClosing && hiddenTags.has(tag.name)) {
      ignoredTags.push(tag.name);
    } else {
      if (tag.name === "br" || (tag.closing && lineBreakTags.has(tag.name))) {
        appendLineBreak();
      }
    }

    index = tagEnd + 1;
  }

  return decodeBasicHtmlEntities(text);
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

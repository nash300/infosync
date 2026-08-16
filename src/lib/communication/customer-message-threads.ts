export type ThreadMessage = {
  id: string;
  ticketNumber: string | null;
  createdAt: string;
};

export type MessageThread<T extends ThreadMessage> = {
  key: string;
  ticketNumber: string | null;
  messages: T[];
  latestMessage: T;
};

export function groupCustomerMessageThreads<T extends ThreadMessage>(
  messages: T[],
): MessageThread<T>[] {
  const groups = new Map<string, T[]>();

  for (const message of messages) {
    const key = message.ticketNumber || `message:${message.id}`;
    const current = groups.get(key) || [];
    current.push(message);
    groups.set(key, current);
  }

  return Array.from(groups.entries())
    .map(([key, threadMessages]) => {
      const sorted = [...threadMessages].sort(
        (left, right) =>
          Date.parse(left.createdAt) - Date.parse(right.createdAt),
      );
      return {
        key,
        ticketNumber: sorted[0]?.ticketNumber || null,
        messages: sorted,
        latestMessage: sorted[sorted.length - 1],
      };
    })
    .sort(
      (left, right) =>
        Date.parse(right.latestMessage.createdAt) -
        Date.parse(left.latestMessage.createdAt),
    );
}

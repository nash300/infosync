export type AdminNotificationLevel = "success" | "info" | "warning" | "error";

export type AdminNotification = {
  id: string;
  level: AdminNotificationLevel;
  message: string;
};

export function showAdminNotification(
  level: AdminNotificationLevel,
  message: string,
) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<AdminNotification>("admin-notification", {
      detail: {
        id: crypto.randomUUID(),
        level,
        message,
      },
    }),
  );
}

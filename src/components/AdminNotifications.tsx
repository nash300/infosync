"use client";

import { useEffect, useState } from "react";
import type { AdminNotification } from "@/lib/admin/notifications";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  useEffect(() => {
    const handleNotification = (event: Event) => {
      const customEvent = event as CustomEvent<AdminNotification>;
      const nextNotification = customEvent.detail;

      setNotifications((current) => [...current.slice(-2), nextNotification]);

      window.setTimeout(() => {
        setNotifications((current) =>
          current.filter((item) => item.id !== nextNotification.id),
        );
      }, 4600);
    };

    window.addEventListener("admin-notification", handleNotification);

    return () => {
      window.removeEventListener("admin-notification", handleNotification);
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="admin-toast-region" aria-live="polite" aria-atomic="false">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`admin-toast admin-toast-${notification.level}`}
        >
          <span className="admin-toast-label">
            {notification.level.toUpperCase()}
          </span>
          <p>{notification.message}</p>
        </div>
      ))}
    </div>
  );
}

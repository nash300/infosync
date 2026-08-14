"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

const privatePathPrefixes = [
  "/account",
  "/admin",
  "/admin-login",
  "/display",
  "/login",
  "/onboarding",
  "/reset-password",
];

export function VercelAnalytics() {
  return (
    <Analytics
      beforeSend={(event: BeforeSendEvent) => {
        const { pathname } = new URL(event.url);

        if (
          privatePathPrefixes.some(
            (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
          )
        ) {
          return null;
        }

        return event;
      }}
    />
  );
}

import { describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue(null),
  getCustomerForUser: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/server/customer-account", () => ({
  customerAccessDeniedResponse: () => ({ error: "denied" }),
  getAuthenticatedUser: authMocks.getAuthenticatedUser,
  getCustomerForUser: authMocks.getCustomerForUser,
  hasCustomerServiceAccess: () => false,
  sanitizeFileName: (value: string) => value,
  supabaseAdmin: {},
}));

vi.mock("stripe", () => ({
  default: class StripeMock {},
}));

vi.mock("@/lib/server/audit", () => ({
  getRequestIp: () => "192.0.2.1",
  recordAuditEvent: vi.fn(),
  recordConsent: vi.fn(),
}));

vi.mock("@/lib/server/admin-notifications", () => ({
  createAdminNotification: vi.fn(),
}));

vi.mock("@/lib/server/email", () => ({
  escapeHtml: (value: string) => value,
  renderBrandedEmail: () => "",
  sendTransactionalEmail: vi.fn(),
}));

import { GET as getAccount } from "./route";
import { POST as openBillingPortal } from "./billing-portal/route";
import { POST as cancelDevices } from "./cancel-devices/route";
import { POST as cancelSubscription } from "./cancel-subscription/route";
import { PATCH as updateConsents } from "./consents/route";
import { POST as saveContentSetup } from "./content-setup/route";
import { POST as saveDisplayAssets } from "./display-assets/route";
import { GET as exportAccount } from "./export/route";
import { POST as sendMessage } from "./messages/route";
import { POST as pauseDevice } from "./pause-device/route";
import { POST as pauseSubscription } from "./pause-subscription/route";
import { POST as savePreviewDecision } from "./preview-decision/route";
import { POST as resumeSubscription } from "./resume-subscription/route";
import { POST as uploadVideo } from "./video-upload/route";

const jsonRequest = (path: string, method = "POST") =>
  new Request(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });

describe("customer account route authentication", () => {
  it.each([
    ["account", () => getAccount()],
    ["billing portal", () => openBillingPortal(jsonRequest("/api/account/billing-portal"))],
    ["device cancellation", () => cancelDevices(jsonRequest("/api/account/cancel-devices"))],
    ["subscription cancellation", () => cancelSubscription(jsonRequest("/api/account/cancel-subscription"))],
    ["consents", () => updateConsents(jsonRequest("/api/account/consents", "PATCH"))],
    ["content setup", () => saveContentSetup(jsonRequest("/api/account/content-setup"))],
    ["display assets", () => saveDisplayAssets(jsonRequest("/api/account/display-assets"))],
    ["data export", () => exportAccount(new Request("http://localhost/api/account/export"))],
    ["messages", () => sendMessage(jsonRequest("/api/account/messages"))],
    ["device pause", () => pauseDevice(jsonRequest("/api/account/pause-device"))],
    ["subscription pause", () => pauseSubscription(jsonRequest("/api/account/pause-subscription"))],
    ["preview decision", () => savePreviewDecision(jsonRequest("/api/account/preview-decision"))],
    ["subscription resume", () => resumeSubscription(jsonRequest("/api/account/resume-subscription"))],
    ["video upload", () => uploadVideo(jsonRequest("/api/account/video-upload"))],
  ])("blocks anonymous access to %s", async (_name, callRoute) => {
    const response = await callRoute();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized." });
  });
});

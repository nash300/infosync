import { beforeEach, describe, expect, it, vi } from "vitest";

const validationMocks = vi.hoisted(() => ({
  hasAccess: true,
  customer: {
    id: "customer-1",
    name: "Test Customer",
    email: "customer@example.test",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    marketing_consent: false,
    analytics_consent: false,
    remote_support_consent: false,
  },
}));

vi.mock("@/lib/server/customer-account", () => ({
  customerAccessDeniedResponse: () => ({ error: "Tjänsten är inte aktiv." }),
  getAuthenticatedUser: vi.fn().mockResolvedValue({
    id: "user-1",
    email: validationMocks.customer.email,
  }),
  getCustomerForUser: vi.fn().mockResolvedValue(validationMocks.customer),
  hasCustomerServiceAccess: () => validationMocks.hasAccess,
  sanitizeFileName: (value: string) => value,
  supabaseAdmin: {},
}));

vi.mock("stripe", () => ({ default: class StripeMock {} }));
vi.mock("@/lib/server/audit", () => ({
  getRequestIp: () => "192.0.2.1",
  recordAuditEvent: vi.fn(),
  recordConsent: vi.fn(),
}));
vi.mock("@/lib/server/admin-notifications", () => ({ createAdminNotification: vi.fn() }));
vi.mock("@/lib/server/email", () => ({
  escapeHtml: (value: string) => value,
  renderBrandedEmail: () => "",
  sendTransactionalEmail: vi.fn(),
}));

import { POST as openBillingPortal } from "./billing-portal/route";
import { POST as cancelDevices } from "./cancel-devices/route";
import { POST as cancelSubscription } from "./cancel-subscription/route";
import { PATCH as updateConsents } from "./consents/route";
import { POST as saveContentSetup } from "./content-setup/route";
import { POST as saveDisplayAssets } from "./display-assets/route";
import { POST as sendMessage } from "./messages/route";
import { POST as pauseDevice } from "./pause-device/route";
import { POST as pauseSubscription } from "./pause-subscription/route";
import { POST as savePreviewDecision } from "./preview-decision/route";
import { POST as uploadVideo } from "./video-upload/route";

const request = (path: string, body: Record<string, unknown> = {}, method = "POST") =>
  new Request(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  validationMocks.hasAccess = true;
});

describe("customer account request validation", () => {
  it("returns a simple message when no Stripe billing profile exists", async () => {
    const response = await openBillingPortal(request("/api/account/billing-portal"));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(
      "Ingen betalningsprofil är kopplad till kontot ännu.",
    );
  });

  it("returns a simple message when no active subscription exists", async () => {
    const response = await cancelSubscription(request("/api/account/cancel-subscription"));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(
      "Inget aktivt abonnemang är kopplat till kontot.",
    );
  });

  it.each([
    [
      "device cancellation",
      () => cancelDevices(request("/api/account/cancel-devices")),
      "Välj minst en skärm",
    ],
    [
      "content setup",
      () => saveContentSetup(request("/api/account/content-setup")),
      "Välj hur du vill skicka innehåll",
    ],
    [
      "display material",
      () => saveDisplayAssets(request("/api/account/display-assets")),
      "Lägg till en beskrivning eller minst en fil",
    ],
    [
      "support message",
      () => sendMessage(request("/api/account/messages")),
      "Meddelande krävs",
    ],
    [
      "device pause",
      () => pauseDevice(request("/api/account/pause-device")),
      "Välj skärmen",
    ],
    [
      "subscription pause",
      () => pauseSubscription(request("/api/account/pause-subscription", { durationMonths: 0 })),
      "mellan 1 och 4 månader",
    ],
    [
      "preview decision",
      () => savePreviewDecision(request("/api/account/preview-decision")),
      "Välj om förhandsvisningen",
    ],
  ])("rejects invalid %s input", async (_name, callRoute, expectedError) => {
    const response = await callRoute();
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain(expectedError);
  });

  it("treats an unchanged consent request as a successful no-op", async () => {
    const response = await updateConsents(
      request(
        "/api/account/consents",
        {
          marketingConsent: false,
          analyticsConsent: false,
          remoteSupportConsent: false,
        },
        "PATCH",
      ),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, changedConsents: [] });
  });

  it.each([
    ["content setup", () => saveContentSetup(request("/api/account/content-setup"))],
    ["display material", () => saveDisplayAssets(request("/api/account/display-assets"))],
    ["preview decision", () => savePreviewDecision(request("/api/account/preview-decision"))],
    ["video upload", () => uploadVideo(request("/api/account/video-upload"))],
  ])("blocks %s changes when service access is inactive", async (_name, callRoute) => {
    validationMocks.hasAccess = false;
    const response = await callRoute();
    expect(response.status).toBe(403);
    expect((await response.json()).error).toContain("inte aktiv");
  });
});

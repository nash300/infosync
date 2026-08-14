import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSession: vi.fn(),
  recordAuditEvent: vi.fn(),
  createAdminNotification: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: class StripeMock {
    billingPortal = { sessions: { create: mocks.createSession } };
  },
}));

vi.mock("@/lib/server/customer-account", () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({
    id: "user-1",
    email: "customer@example.test",
  }),
  getCustomerForUser: vi.fn().mockResolvedValue({
    id: "customer-1",
    name: "Customer AB",
    email: "customer@example.test",
    stripe_customer_id: "cus_test_1",
  }),
  supabaseAdmin: {},
}));

vi.mock("@/lib/server/audit", () => ({
  getRequestIp: () => "192.0.2.1",
  recordAuditEvent: mocks.recordAuditEvent,
}));

vi.mock("@/lib/server/admin-notifications", () => ({
  createAdminNotification: mocks.createAdminNotification,
}));

import { POST } from "./route";

const request = () =>
  new Request("http://localhost/api/account/billing-portal", {
    method: "POST",
    headers: { "user-agent": "Screenia account test" },
  });

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  mocks.createSession.mockReset().mockResolvedValue({
    id: "bps_test_1",
    url: "https://billing.stripe.test/session",
  });
  mocks.recordAuditEvent.mockReset().mockResolvedValue(undefined);
  mocks.createAdminNotification.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("customer Stripe billing portal", () => {
  it("creates a session with a safe return URL and audits access", async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: "https://billing.stripe.test/session",
    });
    expect(mocks.createSession).toHaveBeenCalledWith({
      customer: "cus_test_1",
      return_url: "http://localhost:3000/account",
    });
    expect(mocks.recordAuditEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        customerId: "customer-1",
        eventType: "billing_portal_session_created",
      }),
      { throwOnError: true },
    );
  });

  it("records Stripe failures and gives the customer a simple error", async () => {
    mocks.createSession.mockRejectedValue(new Error("Stripe unavailable"));

    const response = await POST(request());

    expect(response.status).toBe(502);
    expect((await response.json()).error).toContain("inte att öppna betalningsportalen");
    expect(mocks.recordAuditEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: "billing_portal_session_failed" }),
      { throwOnError: true },
    );
    expect(mocks.createAdminNotification).toHaveBeenCalled();
  });

  it("does not release an unaudited billing portal session", async () => {
    mocks.recordAuditEvent.mockRejectedValue(new Error("audit unavailable"));

    const response = await POST(request());

    expect(response.status).toBe(500);
    expect((await response.json()).error).toContain("öppnas säkert");
  });
});

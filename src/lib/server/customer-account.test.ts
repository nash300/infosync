import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ recordAuditEvent: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({}),
}));

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("@/lib/server/audit", () => ({ recordAuditEvent: mocks.recordAuditEvent }));

import {
  customerAccessDeniedResponse,
  getCustomerForUser,
  hasCustomerPortalAccess,
  hasCustomerServiceAccess,
  markCustomerAccountActivated,
  sanitizeFileName,
} from "./customer-account";

afterEach(() => {
  vi.useRealTimers();
  mocks.recordAuditEvent.mockReset();
});

const user = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "user-1",
    email: "customer@example.test",
    app_metadata: {},
    user_metadata: {},
    ...overrides,
  }) as never;

function lookupClient(
  resolveLookup: (field: string, value: string, select: string) => unknown,
) {
  return {
    from: () => ({
      select: (columns: string) => ({
        eq: (field: string, value: string) => ({
          maybeSingle: async () => resolveLookup(field, value, columns),
        }),
      }),
    }),
  } as never;
}

describe("customer account access controls", () => {
  it("allows only paid or active identities into the customer portal", () => {
    expect(hasCustomerPortalAccess({ status: "paid", payment_status: "paid" })).toBe(true);
    expect(
      hasCustomerPortalAccess({ status: "new_request", payment_status: "pending" }),
    ).toBe(false);
  });

  it.each(["paid", "content_pending", "content_received", "active"])(
    "allows paid customers in the %s lifecycle state",
    (status) => {
      expect(
        hasCustomerServiceAccess({
          status,
          payment_status: "paid",
          service_access_status: "active",
        }),
      ).toBe(true);
    },
  );

  it.each([
    { status: "new_request", payment_status: "paid", service_access_status: "active" },
    { status: "active", payment_status: "failed", service_access_status: "active" },
    { status: "active", payment_status: "paid", service_access_status: "paused" },
    {
      status: "active",
      payment_status: "paid",
      service_access_status: "active_until_period_end",
      service_access_until: "2026-08-14T09:59:59.000Z",
    },
  ])("blocks unsafe service-access state %#", (customer) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T10:00:00.000Z"));
    expect(hasCustomerServiceAccess(customer)).toBe(false);
  });

  it("allows access through a future cancellation date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T10:00:00.000Z"));
    expect(
      hasCustomerServiceAccess({
        status: "active",
        payment_status: "paid",
        service_access_status: "active_until_period_end",
        service_access_until: "2026-09-15T10:00:00.000Z",
      }),
    ).toBe(true);
  });

  it("returns a customer-safe explanation when access is blocked", () => {
    expect(customerAccessDeniedResponse().error).toContain("Tjänsten är inte aktiv");
  });

  it("sanitizes and limits uploaded file names", () => {
    expect(sanitizeFileName("kund logotyp (ny).png")).toBe("kund-logotyp-ny-.png");
    expect(sanitizeFileName(`${"a".repeat(130)}.png`)).toHaveLength(120);
  });

  it("does not resolve anonymous users or administrator accounts", async () => {
    const client = lookupClient(() => {
      throw new Error("database should not be called");
    });
    await expect(getCustomerForUser(null, client)).resolves.toBeNull();
    await expect(
      getCustomerForUser(user({ app_metadata: { role: "admin" } }), client),
    ).resolves.toBeNull();
  });

  it("uses a matching metadata customer id first", async () => {
    const calls: Array<[string, string]> = [];
    const customer = {
      id: "customer-1",
      email: "customer@example.test",
      status: "paid",
      payment_status: "paid",
    };
    const client = lookupClient((field, value) => {
      calls.push([field, value]);
      return { data: customer, error: null };
    });

    await expect(
      getCustomerForUser(
        user({ user_metadata: { customer_id: "customer-1" } }),
        client,
      ),
    ).resolves.toBe(customer);
    expect(calls).toEqual([["id", "customer-1"]]);
  });

  it("falls back from mismatched metadata to auth user and then email", async () => {
    const calls: Array<[string, string]> = [];
    const emailCustomer = {
      id: "customer-email",
      email: "customer@example.test",
      status: "active",
      payment_status: "paid",
    };
    const client = lookupClient((field, value) => {
      calls.push([field, value]);
      if (field === "id") {
        return { data: { id: "wrong", email: "someone-else@example.test" }, error: null };
      }
      if (field === "auth_user_id") return { data: null, error: null };
      return { data: emailCustomer, error: null };
    });

    await expect(
      getCustomerForUser(
        user({ user_metadata: { customer_id: "wrong" } }),
        client,
      ),
    ).resolves.toBe(emailCustomer);
    expect(calls).toEqual([
      ["id", "wrong"],
      ["auth_user_id", "user-1"],
      ["email", "customer@example.test"],
    ]);
  });

  it("supports a database that has not received newer optional columns", async () => {
    const selectedColumns: string[] = [];
    const customer = {
      id: "customer-legacy",
      email: "customer@example.test",
      status: "paid",
      payment_status: "paid",
    };
    const client = lookupClient((_field, _value, select) => {
      selectedColumns.push(select);
      return select.includes("service_access_status")
        ? { data: null, error: { code: "PGRST204" } }
        : { data: customer, error: null };
    });

    await expect(getCustomerForUser(user(), client)).resolves.toBe(customer);
    expect(selectedColumns.some((select) => !select.includes("service_access_status"))).toBe(
      true,
    );
  });

  it("rejects an authenticated signup that only matches an unpaid lead", async () => {
    const lead = {
      id: "lead-1",
      email: "customer@example.test",
      status: "new_request",
      payment_status: "pending",
    };
    const client = lookupClient((field) => ({
      data: field === "email" ? lead : null,
      error: null,
    }));

    await expect(getCustomerForUser(user(), client)).resolves.toBeNull();
  });

  it("links and audits a newly activated customer account", async () => {
    const customer = {
      id: "customer-1",
      email: "customer@example.test",
      status: "paid",
      payment_status: "paid",
      activated_at: null,
      auth_user_id: null,
    };
    const update = vi.fn(() => ({
      eq: () => ({
        select: () => ({
          single: async () => ({
            data: { ...customer, activated_at: "now", auth_user_id: "user-1" },
            error: null,
          }),
        }),
      }),
    }));
    const client = {
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: customer, error: null }) }),
        }),
        update,
      }),
    } as never;
    mocks.recordAuditEvent.mockResolvedValue(undefined);

    const result = await markCustomerAccountActivated(
      user({ user_metadata: { customer_id: "customer-1" } }),
      client,
    );

    expect(result).toMatchObject({ auth_user_id: "user-1" });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ auth_user_id: "user-1" }),
    );
    expect(mocks.recordAuditEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: "customer_account_activated" }),
    );
  });
});

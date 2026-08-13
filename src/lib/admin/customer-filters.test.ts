import { describe, expect, it } from "vitest";

import { matchesCustomerFilter } from "./customer-filters";

const baseCustomer = {
  status: "active",
  paymentStatus: "paid",
  serviceAccessStatus: "active",
  deviceCount: 1,
  hasDeviceWithoutPlaylist: false,
};

describe("admin attention customer filters", () => {
  it.each(["failed", "payment_failed", "disputed"])(
    "includes %s payment problems in billing issues",
    (paymentStatus) => {
      expect(
        matchesCustomerFilter({ ...baseCustomer, paymentStatus }, "billing_issue"),
      ).toBe(true);
    },
  );

  it("includes suspended service access in billing issues", () => {
    expect(
      matchesCustomerFilter(
        { ...baseCustomer, serviceAccessStatus: "suspended" },
        "billing_issue",
      ),
    ).toBe(true);
  });

  it("excludes terminal suspended records from actionable billing issues", () => {
    expect(
      matchesCustomerFilter(
        {
          ...baseCustomer,
          status: "suspended",
          paymentStatus: "canceled",
        },
        "billing_issue",
      ),
    ).toBe(false);
    expect(
      matchesCustomerFilter(
        {
          ...baseCustomer,
          status: "suspended",
          serviceAccessStatus: "cancelled",
        },
        "billing_issue",
      ),
    ).toBe(false);
  });

  it("only marks a fully prepared content-received customer ready to activate", () => {
    expect(
      matchesCustomerFilter(
        { ...baseCustomer, status: "content_received" },
        "ready_to_activate",
      ),
    ).toBe(true);
    expect(
      matchesCustomerFilter(
        {
          ...baseCustomer,
          status: "content_received",
          hasDeviceWithoutPlaylist: true,
        },
        "ready_to_activate",
      ),
    ).toBe(false);
  });

  it.each([
    ["setup_pending", { status: "accepted_terms" }],
    ["material_pending", { status: "content_pending" }],
    ["needs_device", { status: "content_received", deviceCount: 0 }],
    [
      "needs_playlist",
      { status: "active", hasDeviceWithoutPlaylist: true },
    ],
  ] as const)("matches the %s operational queue", (filter, overrides) => {
    expect(
      matchesCustomerFilter({ ...baseCustomer, ...overrides }, filter),
    ).toBe(true);
  });
});

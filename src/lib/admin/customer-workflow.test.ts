import { describe, expect, it } from "vitest";

import { getCustomerWorkflowAction } from "./customer-workflow";

const baseCustomer = {
  id: "customer-1",
  status: "active",
  paymentStatus: "paid",
  serviceAccessStatus: "active",
  deviceCount: 1,
  firstDeviceCode: "ABC123",
  firstDeviceWithoutPlaylistCode: null,
};

describe("admin customer workflow scenarios", () => {
  it.each([
    ["cancelled", "paid", "active"],
    ["active", "refunded", "active"],
    ["active", "paid", "cancelled"],
  ])("does not suggest work for terminal states", (status, paymentStatus, serviceAccessStatus) => {
    expect(
      getCustomerWorkflowAction({
        ...baseCustomer,
        status,
        paymentStatus,
        serviceAccessStatus,
      }),
    ).toBeNull();
  });

  it("prioritizes a failed payment over normal fulfillment", () => {
    const action = getCustomerWorkflowAction({
      ...baseCustomer,
      paymentStatus: "payment_failed",
    });

    expect(action).toMatchObject({
      stage: 3,
      priority: "urgent",
      href: "/admin/customers/customer-1?section=orders",
    });
  });

  it.each([
    ["new_request", 1, "high"],
    ["invited", 2, "normal"],
    ["paid", 4, "high"],
  ] as const)("routes %s to stage %s", (status, stage, priority) => {
    expect(
      getCustomerWorkflowAction({ ...baseCustomer, status }),
    ).toMatchObject({ stage, priority });
  });

  it("routes an active customer without a device to allocation", () => {
    expect(
      getCustomerWorkflowAction({ ...baseCustomer, deviceCount: 0 }),
    ).toMatchObject({ stage: 5, href: "/admin/customers/customer-1?section=devices" });
  });

  it("routes an assigned device without a playlist to publishing", () => {
    expect(
      getCustomerWorkflowAction({
        ...baseCustomer,
        firstDeviceWithoutPlaylistCode: "ABC123",
      }),
    ).toMatchObject({ stage: 6, href: "/admin/devices/ABC123?section=media" });
  });
});

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
    ["active", "canceled", "active"],
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
      category: "billing_issue",
      href: "/admin/customers/customer-1?section=orders",
    });
  });

  it.each([
    ["new_request", 1, "high", "new_request"],
    ["invited", 2, "normal", "setup_pending"],
    ["paid", 4, "high", "material_pending"],
  ] as const)("routes %s to stage %s", (status, stage, priority, category) => {
    expect(
      getCustomerWorkflowAction({ ...baseCustomer, status }),
    ).toMatchObject({ stage, priority, category });
  });

  it("routes an active customer without a device to allocation", () => {
    expect(
      getCustomerWorkflowAction({ ...baseCustomer, deviceCount: 0 }),
    ).toMatchObject({
      stage: 5,
      category: "needs_device",
      href: "/admin/customers/customer-1?section=devices",
    });
  });

  it("routes an assigned device without a playlist to publishing", () => {
    expect(
      getCustomerWorkflowAction({
        ...baseCustomer,
        firstDeviceWithoutPlaylistCode: "ABC123",
      }),
    ).toMatchObject({
      stage: 6,
      category: "needs_playlist",
      href: "/admin/devices/ABC123?section=media",
    });
  });

  it("identifies a content-ready customer that only needs final activation", () => {
    expect(
      getCustomerWorkflowAction({
        ...baseCustomer,
        status: "content_received",
      }),
    ).toMatchObject({
      category: "ready_to_activate",
      title: "Verify display and activate service",
    });
  });
});

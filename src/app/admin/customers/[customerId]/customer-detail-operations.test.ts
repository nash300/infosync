import { describe, expect, it } from "vitest";

import {
  getCustomerBillingGuide,
  isExceptionalCustomerOperation,
} from "./customer-detail-operations";
import type { Customer, CustomerOperation, CustomerSubscription } from "./types";

const customer = {
  id: "customer-1",
  name: "Test customer",
  status: "active",
  payment_status: "paid",
  service_access_status: "active",
} as Customer;

const subscription = {
  id: "subscription-1",
  status: "active",
  cancel_at_period_end: false,
} as CustomerSubscription;

const resumeOperation = {
  id: "resume_subscription",
  title: "Resume subscription",
  description: "Resume billing.",
  result: "Billing resumes.",
  tone: "success",
} satisfies CustomerOperation;

describe("customer operation guidance", () => {
  it("prioritizes a billing failure without suggesting unsafe manual activation", () => {
    const guide = getCustomerBillingGuide({
      customer: { ...customer, payment_status: "payment_failed" },
      currentSubscription: { ...subscription, status: "payment_failed" },
      operations: [],
    });

    expect(guide).toMatchObject({
      tone: "danger",
      title: "Payment needs attention",
      recommendedOperationId: null,
    });
    expect(guide.steps).toHaveLength(3);
  });

  it("recommends resume only when that operation is available", () => {
    expect(
      getCustomerBillingGuide({
        customer: { ...customer, service_access_status: "paused" },
        currentSubscription: { ...subscription, status: "paused" },
        operations: [resumeOperation],
      }).recommendedOperationId,
    ).toBe("resume_subscription");
  });

  it("shows healthy billing without inventing an action", () => {
    expect(
      getCustomerBillingGuide({
        customer,
        currentSubscription: subscription,
        operations: [],
      }),
    ).toMatchObject({ tone: "success", recommendedOperationId: null });
  });

  it("keeps refunds and immediate cancellation in exceptional actions", () => {
    expect(isExceptionalCustomerOperation("issue_partial_refund")).toBe(true);
    expect(isExceptionalCustomerOperation("cancel_immediately")).toBe(true);
    expect(isExceptionalCustomerOperation("pause_subscription")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import {
  customerCanUploadVideos,
  subscriptionIncludesCustomerVideoUploads,
} from "./plan-entitlements";

describe("Premium Plus video entitlement", () => {
  it("allows an active mixed order containing Premium Plus", () => {
    expect(
      subscriptionIncludesCustomerVideoUploads({
        status: "active",
        quote_items: [
          { pricingPlanCode: "standard_fhd" },
          { pricingPlanCode: "premium_plus_4k" },
        ],
      }),
    ).toBe(true);
  });

  it("allows the related Premium Plus plan when quote items are unavailable", () => {
    expect(
      subscriptionIncludesCustomerVideoUploads({
        status: "paid",
        pricing_plans: { code: "premium_plus_4k" },
      }),
    ).toBe(true);
  });

  it.each(["cancelled", "refunded", "checkout_started"])(
    "blocks non-billable status %s",
    (status) => {
      expect(
        subscriptionIncludesCustomerVideoUploads({
          status,
          quote_items: [{ pricingPlanCode: "premium_plus_4k" }],
        }),
      ).toBe(false);
    },
  );

  it("does not grant video upload to Standard or Premium subscriptions", () => {
    expect(
      customerCanUploadVideos([
        {
          status: "active",
          quote_items: [{ pricingPlanCode: "standard_fhd" }],
        },
        {
          status: "trialing",
          pricing_plans: [{ code: "premium_4k" }],
        },
      ]),
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import {
  formatStripeSek,
  matchesOrderSection,
  normalizeOrder,
  summarizeQuoteItems,
} from "./order-workflow";
import type { OrderRow } from "./types";

const order = (overrides: Partial<OrderRow>): OrderRow =>
  normalizeOrder({ id: "order-1", status: "quote_prepared", ...overrides });

describe("order section scenarios", () => {
  it.each([
    [{ status: "payment_failed" }, "payment"],
    [{ status: "cancelled" }, "cancelled"],
    [{ status: "active" }, "pipeline"],
    [{ fulfillment_status: "shipped" }, "shipping"],
    [{ hardware_status: "assigned" }, "shipping"],
    [{ tracking_number: "TRACK-1" }, "shipping"],
  ] as const)("classifies an order into %s", (overrides, section) => {
    expect(matchesOrderSection(order(overrides), section)).toBe(true);
  });

  it("does not hide a cancelled order when fulfillment is cancelled", () => {
    expect(
      matchesOrderSection(
        order({ status: "paid", fulfillment_status: "cancelled" }),
        "cancelled",
      ),
    ).toBe(true);
  });
});

describe("order presentation scenarios", () => {
  it("summarizes explicit multi-item quotes", () => {
    expect(
      summarizeQuoteItems(
        order({
          quote_items: [
            { quantity: 2, name: "Standard", resolution: "FHD" },
            { quantity: 1, name: "Premium", resolution: "4K" },
          ],
        }),
      ),
    ).toBe("2 x Standard FHD, 1 x Premium 4K");
  });

  it("falls back to plan and screen quantity", () => {
    expect(
      summarizeQuoteItems(
        order({
          screen_quantity: 3,
          pricing_plans: { name: "Premium", resolution: "4K" },
        }),
      ),
    ).toBe("3 x Premium 4K");
  });

  it("formats Stripe ore as Swedish kronor", () => {
    expect(formatStripeSek(279700)).toBe("2 797 kr");
    expect(formatStripeSek(55940)).toBe("559,40 kr");
  });
});

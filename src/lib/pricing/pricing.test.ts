import { describe, expect, it } from "vitest";

import {
  calculateIncrementalSetupFeeSek,
  calculateSetupFeeSek,
} from "./setup-fee";
import { calculateShippingFeeSek } from "./shipping-fee";
import { includedVatFromGross } from "./vat";

describe("setup pricing scenarios", () => {
  it.each([
    [0, 0],
    [1, 1599],
    [3, 1599],
    [4, 1848],
    [5.9, 2097],
  ])("prices %s screens at %s SEK", (quantity, expected) => {
    expect(calculateSetupFeeSek(quantity)).toBe(expected);
  });

  it("charges only newly crossed setup thresholds for add-on screens", () => {
    expect(calculateIncrementalSetupFeeSek(2, 1)).toBe(0);
    expect(calculateIncrementalSetupFeeSek(3, 1)).toBe(249);
    expect(calculateIncrementalSetupFeeSek(4, 2)).toBe(498);
    expect(calculateIncrementalSetupFeeSek(4, 0)).toBe(0);
  });
});

describe("shipping pricing scenarios", () => {
  it.each([
    [0, 0],
    [1, 99],
    [3, 99],
    [4, 128],
    [5.8, 157],
  ])("prices shipping for %s devices at %s SEK", (quantity, expected) => {
    expect(calculateShippingFeeSek(quantity)).toBe(expected);
  });
});

describe("included Swedish VAT", () => {
  it("splits a VAT-inclusive amount using ore-safe rounding", () => {
    expect(includedVatFromGross(2797)).toEqual({
      gross: 2797,
      net: 2237.6,
      vat: 559.4,
    });
  });

  it("never returns negative amounts", () => {
    expect(includedVatFromGross(-100)).toEqual({ gross: 0, net: 0, vat: 0 });
  });
});

import { describe, expect, it } from "vitest";
import { PRICING_PLANS } from "./plans";

describe("pricing plan presentation limits", () => {
  it.each([
    ["standard_fhd", 8, 2],
    ["premium_4k", 8, 3],
    ["premium_plus_4k", 12, 6],
  ] as const)(
    "%s supports the configured slide and section capacity",
    (code, maxSlides, maxSectionsPerSlide) => {
      const plan = PRICING_PLANS.find((item) => item.code === code);

      expect(plan).toMatchObject({
        maxSlides,
        maxSectionsPerSlide,
      });
    },
  );
});

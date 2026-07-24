import { describe, expect, it } from "vitest";
import { getInitialOnboardingStep } from "./initial-step";

describe("getInitialOnboardingStep", () => {
  it("keeps a newly invited customer on details even when a quote is payable", () => {
    expect(getInitialOnboardingStep("invited", true)).toBe("details");
  });

  it("keeps an unquoted request on details", () => {
    expect(getInitialOnboardingStep("new_request", false)).toBe("details");
  });

  it("continues to payment after legal acceptance", () => {
    expect(getInitialOnboardingStep("accepted_terms", true)).toBe("payment");
  });

  it("lets an existing active customer pay for a new payable order", () => {
    expect(getInitialOnboardingStep("active", true)).toBe("payment");
  });
});

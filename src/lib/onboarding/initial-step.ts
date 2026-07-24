export type OnboardingStep = "details" | "payment";

export function getInitialOnboardingStep(
  customerStatus: string,
  hasPayableOrder: boolean,
): OnboardingStep {
  if (customerStatus === "accepted_terms") return "payment";

  if (
    hasPayableOrder &&
    !["new_request", "invited"].includes(customerStatus)
  ) {
    return "payment";
  }

  return "details";
}

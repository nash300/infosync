export const CUSTOMER_VIDEO_UPLOAD_PLAN_CODE = "premium_plus_4k";

type QuoteItem = {
  pricingPlanCode?: string | null;
};

type PricingPlanRelation =
  | { code?: string | null }
  | Array<{ code?: string | null }>
  | null;

export type VideoEntitlementSubscription = {
  status?: string | null;
  quote_items?: QuoteItem[] | null;
  pricing_plans?: PricingPlanRelation;
};

const videoEntitlementStatuses = new Set(["paid", "active", "trialing"]);

export function subscriptionIncludesCustomerVideoUploads(
  subscription: VideoEntitlementSubscription,
) {
  if (!videoEntitlementStatuses.has(subscription.status || "")) return false;

  if (
    (subscription.quote_items || []).some(
      (item) => item.pricingPlanCode === CUSTOMER_VIDEO_UPLOAD_PLAN_CODE,
    )
  ) {
    return true;
  }

  const relatedPlans = Array.isArray(subscription.pricing_plans)
    ? subscription.pricing_plans
    : subscription.pricing_plans
      ? [subscription.pricing_plans]
      : [];

  return relatedPlans.some(
    (plan) => plan.code === CUSTOMER_VIDEO_UPLOAD_PLAN_CODE,
  );
}

export function customerCanUploadVideos(
  subscriptions: VideoEntitlementSubscription[],
) {
  return subscriptions.some(subscriptionIncludesCustomerVideoUploads);
}

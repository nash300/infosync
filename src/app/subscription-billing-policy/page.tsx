import PublicLegalDocumentPage from "@/components/PublicLegalDocumentPage";
import { createPublicPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPublicPageMetadata({
  path: "/subscription-billing-policy",
  title: "Prenumerations- och betalningspolicy",
  description:
    "Villkor för Screenias prenumerationer, betalningar, fakturering och uppsägning.",
});

export default function SubscriptionBillingPolicyPage() {
  return <PublicLegalDocumentPage documentType="subscription_billing" />;
}

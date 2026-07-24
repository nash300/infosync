import PublicLegalDocumentPage from "@/components/PublicLegalDocumentPage";
import { createPublicPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPublicPageMetadata({
  path: "/support-service-policy",
  title: "Support- och servicepolicy",
  description:
    "Information om support, service och ansvar för Screenias tjänst för digital skyltning.",
});

export default function SupportServicePolicyPage() {
  return <PublicLegalDocumentPage documentType="support_service" />;
}

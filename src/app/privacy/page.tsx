import PublicLegalDocumentPage from "@/components/PublicLegalDocumentPage";
import { createPublicPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPublicPageMetadata({
  path: "/privacy",
  title: "Integritetspolicy",
  description:
    "Läs hur Screenia behandlar personuppgifter och skyddar din integritet när du använder våra tjänster.",
});

export default function PrivacyPage() {
  return <PublicLegalDocumentPage documentType="privacy" />;
}

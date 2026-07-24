import PublicLegalDocumentPage from "@/components/PublicLegalDocumentPage";
import { createPublicPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPublicPageMetadata({
  path: "/cookie-policy",
  title: "Cookiepolicy",
  description:
    "Information om hur Screenia använder cookies och liknande teknik på webbplatsen.",
});

export default function CookiePolicyPage() {
  return <PublicLegalDocumentPage documentType="cookie" />;
}

import PublicLegalDocumentPage from "@/components/PublicLegalDocumentPage";
import { createPublicPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPublicPageMetadata({
  path: "/terms",
  title: "Allmänna villkor",
  description:
    "Läs Screenias allmänna villkor för digital skyltning, beställning, leverans och användning av tjänsten.",
});

export default function TermsPage() {
  return <PublicLegalDocumentPage documentType="terms" />;
}

import type { Metadata } from "next";
import { createPublicPageMetadata, serializeJsonLd, siteUrl } from "@/lib/seo";

export const metadata: Metadata = createPublicPageMetadata({
  path: "/kontakt",
  title: "Kontakta oss om digital skyltning",
  description:
    "Kontakta Screenia om digital skyltning, paket, skärminnehåll eller support. Varje ärende får ett ärendenummer och besvaras via e-post.",
  keywords: [
    "kontakta Screenia",
    "digital skyltning offert",
    "digital signage support Sverige",
  ],
});

export default function ContactLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${siteUrl}/kontakt#webpage`,
    url: `${siteUrl}/kontakt`,
    name: "Kontakta Screenia",
    description: metadata.description,
    inLanguage: "sv-SE",
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#business` },
  };

  return (
    <>
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
    </>
  );
}

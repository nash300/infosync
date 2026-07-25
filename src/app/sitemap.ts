import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://screenia.se";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: { "sv-SE": siteUrl } },
      images: [
        `${siteUrl}/landing/hero-slides/01/image.png`,
      ],
    },
    {
      url: `${siteUrl}/sa-fungerar-det`,
      changeFrequency: "monthly",
      priority: 0.85,
      alternates: { languages: { "sv-SE": `${siteUrl}/sa-fungerar-det` } },
      images: [
        `${siteUrl}/landing/hero-slides/02/image.png`,
      ],
    },
    {
      url: `${siteUrl}/om-oss`,
      changeFrequency: "monthly",
      priority: 0.75,
      alternates: { languages: { "sv-SE": `${siteUrl}/om-oss` } },
      images: [
        `${siteUrl}/brand/screenia-helper.png`,
      ],
    },
    {
      url: `${siteUrl}/kontakt`,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: { languages: { "sv-SE": `${siteUrl}/kontakt` } },
    },
    {
      url: `${siteUrl}/terms`,
      changeFrequency: "monthly",
      priority: 0.35,
      alternates: { languages: { "sv-SE": `${siteUrl}/terms` } },
    },
    {
      url: `${siteUrl}/privacy`,
      changeFrequency: "monthly",
      priority: 0.35,
      alternates: { languages: { "sv-SE": `${siteUrl}/privacy` } },
    },
    {
      url: `${siteUrl}/cookie-policy`,
      changeFrequency: "monthly",
      priority: 0.25,
      alternates: { languages: { "sv-SE": `${siteUrl}/cookie-policy` } },
    },
    {
      url: `${siteUrl}/subscription-billing-policy`,
      changeFrequency: "monthly",
      priority: 0.25,
      alternates: {
        languages: { "sv-SE": `${siteUrl}/subscription-billing-policy` },
      },
    },
    {
      url: `${siteUrl}/support-service-policy`,
      changeFrequency: "monthly",
      priority: 0.25,
      alternates: {
        languages: { "sv-SE": `${siteUrl}/support-service-policy` },
      },
    },
  ];
}

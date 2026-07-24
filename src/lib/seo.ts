import type { Metadata } from "next";

export const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://screenia.se";

export const defaultSocialImage = "/landing/hero-slides/01/image.png";

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function createPublicPageMetadata({
  path,
  title,
  description,
  image = defaultSocialImage,
  imageAlt = title,
  keywords,
}: {
  path: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  keywords?: string[];
}): Metadata {
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
      languages: { "sv-SE": path },
    },
    openGraph: {
      title: `${title} | Screenia`,
      description,
      url: path,
      siteName: "Screenia",
      locale: "sv_SE",
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Screenia`,
      description,
      images: [image],
    },
  };
}

export const privatePageMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  createPublicPageMetadata,
  privatePageMetadata,
  serializeJsonLd,
  siteUrl,
} from "@/lib/seo";

describe("public search discovery", () => {
  it("publishes every customer-facing page in the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toEqual(
      expect.arrayContaining([
        siteUrl,
        `${siteUrl}/sa-fungerar-det`,
        `${siteUrl}/om-oss`,
        `${siteUrl}/kontakt`,
        `${siteUrl}/terms`,
        `${siteUrl}/privacy`,
      ]),
    );
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("does not claim that every sitemap page changed at build time", () => {
    expect(sitemap().every((entry) => entry.lastModified === undefined)).toBe(
      true,
    );
  });

  it("provides canonical, language, and social metadata per page", () => {
    const metadata = createPublicPageMetadata({
      path: "/kontakt",
      title: "Kontakta oss",
      description: "Kontakta Screenia.",
    });

    expect(metadata.alternates).toMatchObject({
      canonical: "/kontakt",
      languages: { "sv-SE": "/kontakt" },
    });
    expect(metadata.openGraph).toMatchObject({ url: "/kontakt", locale: "sv_SE" });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });
});

describe("private route indexing protection", () => {
  it("blocks private route roots and descendants in robots.txt", () => {
    const rules = robots().rules;
    const rule = Array.isArray(rules) ? rules[0] : rules;

    expect(rule.disallow).toEqual(
      expect.arrayContaining([
        "/account",
        "/account/",
        "/admin",
        "/admin/",
        "/display",
        "/display/",
        "/login",
        "/login/",
        "/onboarding",
        "/onboarding/",
      ]),
    );
  });

  it("marks private pages as noindex and nofollow", () => {
    expect(privatePageMetadata.robots).toMatchObject({
      index: false,
      follow: false,
      noarchive: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    });
  });
});

describe("structured data output", () => {
  it("escapes less-than signs before embedding JSON-LD in HTML", () => {
    const output = serializeJsonLd({
      description: "</script><script>alert('x')</script>",
    });

    expect(output).not.toContain("</script>");
    expect(output).toContain("\\u003c/script>");
  });
});

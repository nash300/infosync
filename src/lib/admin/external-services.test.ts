import { describe, expect, it } from "vitest";

import { adminExternalServices } from "./external-services";

describe("admin external services", () => {
  it("includes every operational service Screenia depends on", () => {
    expect(adminExternalServices.map((service) => service.name)).toEqual([
      "Stripe",
      "Vercel",
      "Supabase",
      "Resend",
      "Loopia",
      "Zoho Mail",
      "GitHub",
    ]);
  });

  it("uses unique secure dashboard links", () => {
    const links = adminExternalServices.map((service) => service.href);

    expect(new Set(links).size).toBe(links.length);
    links.forEach((link) => expect(new URL(link).protocol).toBe("https:"));
  });

  it("explains the Screenia role and gives an example for every service", () => {
    adminExternalServices.forEach((service) => {
      expect(service.description.length).toBeGreaterThan(40);
      expect(service.example.length).toBeGreaterThan(40);
    });
  });

  it("separates the Zoho customer mailbox from Loopia domain management", () => {
    const zoho = adminExternalServices.find(
      (service) => service.name === "Zoho Mail",
    );
    const loopia = adminExternalServices.find(
      (service) => service.name === "Loopia",
    );

    expect(zoho?.description).toContain("service@screenia.se");
    expect(loopia?.category).toBe("Domain and DNS");
    expect(adminExternalServices.some((service) => service.name === "Gmail")).toBe(false);
  });

  it("targets the configured Screenia projects where direct links are available", () => {
    expect(
      adminExternalServices.find((service) => service.name === "Vercel")?.href,
    ).toContain("/nadeesha7314-1449s-projects/screenia");
    expect(
      adminExternalServices.find((service) => service.name === "Supabase")?.href,
    ).toContain("/project/wcmhvldpelfhurlsuwwy");
    expect(
      adminExternalServices.find((service) => service.name === "GitHub")?.href,
    ).toBe("https://github.com/nash300/screenia");
    expect(
      adminExternalServices.find((service) => service.name === "Zoho Mail")?.href,
    ).toContain("mail.zoho.eu");
  });
});

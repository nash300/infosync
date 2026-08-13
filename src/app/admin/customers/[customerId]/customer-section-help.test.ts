import { describe, expect, it } from "vitest";

import { getCustomerSectionHelp } from "./customer-section-help";
import type { CustomerDetailSection } from "./types";

describe("customer section admin help", () => {
  const sections: CustomerDetailSection[] = [
    "overview",
    "onboarding",
    "communication",
    "orders",
    "devices",
    "history",
  ];

  it("provides a usable workflow and button explanation for every section", () => {
    for (const section of sections) {
      const help = getCustomerSectionHelp(section, "messages");

      expect(help.title.length).toBeGreaterThan(10);
      expect(help.purpose.length).toBeGreaterThan(20);
      expect(help.steps.length).toBeGreaterThanOrEqual(3);
      expect(help.actions.length).toBeGreaterThanOrEqual(3);
      expect(help.actions.every((action) => action.label && action.effect)).toBe(true);
    }
  });

  it("explains both communication workflows separately", () => {
    const messages = getCustomerSectionHelp("communication", "messages");
    const uploads = getCustomerSectionHelp("communication", "uploads");

    expect(messages.title).toContain("messages");
    expect(messages.actions.some((action) => action.label === "Send reply")).toBe(true);
    expect(uploads.title).toContain("files");
    expect(uploads.actions.some((action) => action.label.includes("Publish preview"))).toBe(true);
  });

  it("warns before billing and allocation consequences", () => {
    expect(getCustomerSectionHelp("orders", "messages").caution).toContain("future bills");
    expect(getCustomerSectionHelp("devices", "messages").caution).toContain("serial number");
  });
});

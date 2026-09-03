import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(resolve(process.cwd(), "src/app/page.tsx"), "utf8");
const landingStyles = readFileSync(
  resolve(process.cwd(), "src/app/landing.css"),
  "utf8",
);

describe("landing video gallery", () => {
  it("provides an obvious tap-to-play action with accessible video controls", () => {
    expect(pageSource).toContain("landing-video-gallery-play");
    expect(pageSource).toContain("Spela förhandsvisning:");
    expect(pageSource).toMatch(/autoPlay\s+controls\s+loop/u);
  });

  it("uses native horizontal snap scrolling on phones and touch screens", () => {
    expect(landingStyles).toContain(
      "@media (max-width: 760px), (hover: none) and (pointer: coarse)",
    );
    expect(landingStyles).toContain("overflow-x: auto");
    expect(landingStyles).toContain("scroll-snap-type: x proximity");
    expect(landingStyles).toContain("touch-action: pan-x");
    expect(landingStyles).toContain(
      '.landing-video-rail-group[aria-hidden="true"]',
    );
  });
});

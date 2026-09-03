import { describe, expect, it } from "vitest";
import { getSafeWebUrl } from "./safe-web-url";

describe("getSafeWebUrl", () => {
  it.each([
    ["/legal/terms.pdf", "/legal/terms.pdf"],
    ["https://carrier.example/track?id=123", "https://carrier.example/track?id=123"],
    ["http://carrier.example/track", "http://carrier.example/track"],
    ["javascript:alert(1)", null],
    ["data:text/html,<script>alert(1)</script>", null],
    ["//evil.example/path", null],
    ["/\\evil.example", null],
    ["https://user:password@example.com/", null],
  ])("maps %s safely", (value, expected) => {
    expect(getSafeWebUrl(value)).toBe(expected);
  });
});

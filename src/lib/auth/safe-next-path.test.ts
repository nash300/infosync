import { describe, expect, it } from "vitest";
import { getSafeNextPath } from "./safe-next-path";

describe("getSafeNextPath", () => {
  it.each([
    [null, "/account"],
    ["https://evil.example", "/account"],
    ["//evil.example", "/account"],
    ["/\\evil.example", "/account"],
    ["/public-page", "/account"],
    ["/administrator", "/account"],
    ["/account", "/account"],
    ["/account/reset-password?mode=admin", "/account/reset-password?mode=admin"],
    ["/admin", "/admin"],
    ["/admin/customers#active", "/admin/customers#active"],
  ])("maps %s to %s", (value, expected) => {
    expect(getSafeNextPath(value)).toBe(expected);
  });
});

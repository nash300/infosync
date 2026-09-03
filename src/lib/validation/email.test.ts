import { describe, expect, it } from "vitest";
import { isValidEmailAddress } from "./email";

describe("email validation", () => {
  it.each([
    "service@screenia.se",
    "orders+stockholm@example.test",
    "first.last@example-domain.com",
  ])("accepts %s", (value) => {
    expect(isValidEmailAddress(value)).toBe(true);
  });

  it.each([
    "",
    "invalid-email",
    "a@b",
    "two@@example.com",
    ".name@example.com",
    "name..name@example.com",
    "name@example..com",
    "name@-example.com",
    `name@${"a".repeat(64)}.com`,
    `${"a".repeat(65)}@example.com`,
    " name@example.com",
  ])("rejects %s", (value) => {
    expect(isValidEmailAddress(value)).toBe(false);
  });

  it("handles very large attacker-controlled input in bounded linear work", () => {
    expect(isValidEmailAddress(`name@${"a.".repeat(100_000)}com`)).toBe(false);
  });
});

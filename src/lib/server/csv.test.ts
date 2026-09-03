import { describe, expect, it } from "vitest";
import { safeCsvCell } from "./csv";

describe("safeCsvCell", () => {
  it.each([
    ["Screenia", "Screenia"],
    ["Company, AB", '"Company, AB"'],
    ['Name "quoted"', '"Name ""quoted"""'],
    ["=HYPERLINK(\"https://evil.example\")", '"\'=HYPERLINK(""https://evil.example"")"'],
    [" +SUM(1,1)", '"\' +SUM(1,1)"'],
    ["@malicious", "'@malicious"],
    [-123, "-123"],
  ])("serializes %s safely", (value, expected) => {
    expect(safeCsvCell(value)).toBe(expected);
  });
});

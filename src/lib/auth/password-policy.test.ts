import { describe, expect, it } from "vitest";

import {
  validateAdminPasswordPolicy,
  validatePasswordPolicy,
} from "./password-policy";

describe("customer password policy", () => {
  it.each([
    ["Abc123", true],
    ["Åäö123", true],
    ["abcdef", false],
    ["123456", false],
    ["Ab12", false],
  ])("validates %s", (password, expected) => {
    expect(validatePasswordPolicy(password)).toBe(expected);
  });
});

describe("admin password policy", () => {
  it.each([
    ["SecureAdmin1!", true],
    ["SäkertLösen1!", true],
    ["SecureAdmin12", false],
    ["secureadmin!", false],
    ["12345678901!", false],
    ["Admin1!", false],
  ])("validates %s", (password, expected) => {
    expect(validateAdminPasswordPolicy(password)).toBe(expected);
  });
});

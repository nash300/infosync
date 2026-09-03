import { describe, expect, it } from "vitest";
import { authorizeCronRequest } from "./cron-auth";

function requestWithAuthorization(value?: string) {
  return new Request("https://screenia.se/api/cron/test", {
    headers: value ? { authorization: value } : undefined,
  });
}

describe("authorizeCronRequest", () => {
  it("fails closed when the configured secret is missing", () => {
    expect(authorizeCronRequest(requestWithAuthorization(), "")).toBe(false);
  });

  it("rejects missing and incorrect bearer credentials", () => {
    expect(authorizeCronRequest(requestWithAuthorization(), "correct-secret")).toBe(false);
    expect(
      authorizeCronRequest(
        requestWithAuthorization("Bearer wrong-secret"),
        "correct-secret",
      ),
    ).toBe(false);
  });

  it("accepts an exact bearer credential", () => {
    expect(
      authorizeCronRequest(
        requestWithAuthorization("Bearer correct-secret"),
        "correct-secret",
      ),
    ).toBe(true);
  });
});

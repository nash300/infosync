import { describe, expect, it, vi } from "vitest";
import {
  checkPersistentRateLimit,
  hashRateLimitKey,
} from "./persistent-rate-limit";

describe("persistent rate limits", () => {
  it("hashes bucket identifiers before storage", () => {
    const digest = hashRateLimitKey("login-email:user@example.com");
    expect(digest).toMatch(/^[a-f0-9]{64}$/u);
    expect(digest).not.toContain("user@example.com");
  });

  it("returns the database decision and sends only a hash", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          allowed: false,
          remaining: 0,
          reset_at: "2030-01-01T00:00:00.000Z",
        },
      ],
      error: null,
    });

    const result = await checkPersistentRateLimit(
      { rpc },
      { key: "password-reset:user@example.com", limit: 3, windowMs: 60_000 },
    );

    expect(result).toMatchObject({ allowed: false, remaining: 0, persistent: true });
    expect(rpc).toHaveBeenCalledWith(
      "consume_security_rate_limit",
      expect.objectContaining({
        p_bucket_key_hash: expect.stringMatching(/^[a-f0-9]{64}$/u),
        p_limit: 3,
        p_window_seconds: 60,
      }),
    );
    expect(JSON.stringify(rpc.mock.calls)).not.toContain("user@example.com");
  });
});

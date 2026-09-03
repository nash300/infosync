import { createHash } from "node:crypto";
import { checkRateLimit } from "./rate-limit";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitRpcResult = {
  data: unknown;
  error: { code?: string; message?: string } | null;
};

type RateLimitRpcClient = {
  rpc: (
    functionName: string,
    args: Record<string, string | number>,
  ) => PromiseLike<RateLimitRpcResult>;
};

export type PersistentRateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  persistent: boolean;
};

type RateLimitRow = {
  allowed?: unknown;
  remaining?: unknown;
  reset_at?: unknown;
};

function firstRow(value: unknown): RateLimitRow | null {
  if (Array.isArray(value)) return (value[0] as RateLimitRow | undefined) || null;
  if (value && typeof value === "object") return value as RateLimitRow;
  return null;
}

export function hashRateLimitKey(key: string) {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

function inMemoryDecision(options: RateLimitOptions) {
  return {
    ...checkRateLimit(options),
    persistent: false,
  };
}

export async function checkPersistentRateLimit(
  client: RateLimitRpcClient,
  options: RateLimitOptions,
): Promise<PersistentRateLimitResult> {
  const windowSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));
  const fallbackResetAt = Date.now() + options.windowMs;

  try {
    const { data, error } = await client.rpc("consume_security_rate_limit", {
      p_bucket_key_hash: hashRateLimitKey(options.key),
      p_limit: Math.max(1, Math.floor(options.limit)),
      p_window_seconds: windowSeconds,
    });
    const row = firstRow(data);
    const resetAt = row?.reset_at ? new Date(String(row.reset_at)).getTime() : NaN;

    if (error?.code === "PGRST202") {
      console.warn(
        "Persistent rate-limit migration is pending; using the in-memory compatibility limiter.",
      );
      return inMemoryDecision(options);
    }

    if (error || !row || typeof row.allowed !== "boolean") {
      throw new Error(error?.message || "Rate-limit service returned an invalid response.");
    }

    return {
      allowed: row.allowed,
      remaining: Math.max(0, Number(row.remaining) || 0),
      resetAt: Number.isFinite(resetAt) ? resetAt : fallbackResetAt,
      persistent: true,
    };
  } catch (error) {
    console.error("Persistent rate limit unavailable:", error);

    if (process.env.NODE_ENV === "production") {
      return {
        allowed: false,
        remaining: 0,
        resetAt: fallbackResetAt,
        persistent: false,
      };
    }

    return inMemoryDecision(options);
  }
}

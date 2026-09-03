import { timingSafeEqual } from "node:crypto";

export function authorizeCronRequest(
  request: Request,
  configuredSecret = process.env.CRON_SECRET?.trim(),
) {
  if (!configuredSecret) return false;

  const authorization = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/iu.exec(authorization);
  const providedSecret = match?.[1] || "";
  const expected = Buffer.from(configuredSecret, "utf8");
  const provided = Buffer.from(providedSecret, "utf8");

  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

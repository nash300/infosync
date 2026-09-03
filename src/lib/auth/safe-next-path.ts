const SAFE_FALLBACK_PATH = "/account";
const SAFE_PATH_ROOTS = ["/account", "/admin"];
const SAFE_ORIGIN = "https://screenia.invalid";

export function getSafeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/")) return SAFE_FALLBACK_PATH;

  try {
    const parsed = new URL(value, SAFE_ORIGIN);
    const isAllowedPath = SAFE_PATH_ROOTS.some(
      (root) => parsed.pathname === root || parsed.pathname.startsWith(`${root}/`),
    );

    if (parsed.origin !== SAFE_ORIGIN || !isAllowedPath) {
      return SAFE_FALLBACK_PATH;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return SAFE_FALLBACK_PATH;
  }
}

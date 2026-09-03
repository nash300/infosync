const RELATIVE_URL_ORIGIN = "https://screenia.invalid";

export function getSafeWebUrl(value: unknown, allowRelative = true) {
  const input = typeof value === "string" ? value.trim() : "";
  if (!input || input.startsWith("//") || input.includes("\\")) return null;

  try {
    const url = new URL(input, RELATIVE_URL_ORIGIN);
    if (url.username || url.password) return null;

    if (url.origin === RELATIVE_URL_ORIGIN) {
      if (!allowRelative || !input.startsWith("/") || input.startsWith("//")) {
        return null;
      }

      return `${url.pathname}${url.search}${url.hash}`;
    }

    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export type CustomerLanguage = "sv" | "en";

export const defaultCustomerLanguage: CustomerLanguage = "sv";

export const normalizeCustomerLanguage = (
  value: unknown,
): CustomerLanguage => {
  return value === "en" ? "en" : "sv";
};

export const getCustomerLanguageFromNotes = (
  notes: string | null | undefined,
): CustomerLanguage => {
  const match = notes?.match(/Preferred language:\s*(en|sv)/i);
  return normalizeCustomerLanguage(match?.[1]?.toLowerCase());
};

export const appendLanguageToUrl = (url: string, language: CustomerLanguage) => {
  const nextUrl = new URL(url);
  nextUrl.searchParams.set("lang", language);
  return nextUrl.toString();
};

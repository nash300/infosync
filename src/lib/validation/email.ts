const LOCAL_EMAIL_CHARACTERS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.!#$%&'*+-/=?^_`{|}~";

function isAsciiLetterOrDigit(character: string) {
  const code = character.charCodeAt(0);
  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122)
  );
}

export function isValidEmailAddress(value: string) {
  if (value.length < 3 || value.length > 254 || value !== value.trim()) {
    return false;
  }

  const at = value.indexOf("@");
  if (at <= 0 || at !== value.lastIndexOf("@") || at > 64) return false;

  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..") ||
    domain.length < 3 ||
    domain.length > 253
  ) {
    return false;
  }

  for (const character of local) {
    if (!LOCAL_EMAIL_CHARACTERS.includes(character)) return false;
  }

  const labels = domain.split(".");
  if (labels.length < 2) return false;

  for (const label of labels) {
    if (
      label.length === 0 ||
      label.length > 63 ||
      label.startsWith("-") ||
      label.endsWith("-")
    ) {
      return false;
    }

    for (const character of label) {
      if (!isAsciiLetterOrDigit(character) && character !== "-") return false;
    }
  }

  return labels.at(-1)!.length >= 2;
}

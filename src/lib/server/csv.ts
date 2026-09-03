export function safeCsvCell(value: unknown) {
  if (value === null || value === undefined) return "";

  const rawText = String(value).replace(/\0/gu, "");
  const text =
    typeof value === "string" && /^\s*[=+\-@]/u.test(rawText)
      ? `'${rawText}`
      : rawText;

  return /[",\r\n]/u.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

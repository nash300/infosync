export function literalContainsPattern(value: string) {
  const escaped = value.replace(/[\\%_]/gu, (character) => `\\${character}`);
  return `%${escaped}%`;
}

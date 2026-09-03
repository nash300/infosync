import { describe, expect, it } from "vitest";
import { literalContainsPattern } from "./postgrest-search";

describe("literalContainsPattern", () => {
  it.each([
    ["menu", "%menu%"],
    ["100%", "%100\\%%"],
    ["file_name", "%file\\_name%"],
    ["path\\name", "%path\\\\name%"],
    ["a),description.ilike.%", "%a),description.ilike.\\%%"],
  ])("escapes LIKE metacharacters in %s", (value, expected) => {
    expect(literalContainsPattern(value)).toBe(expected);
  });
});

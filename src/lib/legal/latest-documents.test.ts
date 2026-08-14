import { describe, expect, it } from "vitest";
import { latestLegalDocuments } from "./latest-documents";

describe("customer current legal documents", () => {
  it("shows only the newest active version of each document type", () => {
    const result = latestLegalDocuments([
      {
        document_type: "privacy",
        version: "old",
        effective_at: "2026-07-12T00:00:00.000Z",
      },
      {
        document_type: "terms",
        version: "current-terms",
        effective_at: "2026-07-27T00:00:00.000Z",
      },
      {
        document_type: "privacy",
        version: "current-privacy",
        effective_at: "2026-07-27T00:00:00.000Z",
      },
    ]);

    expect(result).toHaveLength(2);
    expect(result.map((document) => document.version).sort()).toEqual([
      "current-privacy",
      "current-terms",
    ]);
  });

  it("keeps a document with no effective date when it is the only version", () => {
    expect(
      latestLegalDocuments([
        { document_type: "cookie", version: "draft", effective_at: null },
      ]),
    ).toHaveLength(1);
  });
});

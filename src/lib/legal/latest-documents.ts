type LegalDocumentVersion = {
  document_type: string;
  effective_at: string | null;
};

export function latestLegalDocuments<T extends LegalDocumentVersion>(documents: T[]) {
  const latestByType = new Map<string, T>();

  for (const document of documents) {
    const current = latestByType.get(document.document_type);
    if (
      !current ||
      new Date(document.effective_at || 0).getTime() >
        new Date(current.effective_at || 0).getTime()
    ) {
      latestByType.set(document.document_type, document);
    }
  }

  return Array.from(latestByType.values()).sort(
    (left, right) =>
      new Date(right.effective_at || 0).getTime() -
      new Date(left.effective_at || 0).getTime(),
  );
}

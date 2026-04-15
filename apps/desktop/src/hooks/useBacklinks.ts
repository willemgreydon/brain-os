import { useMemo } from "react";

type VaultDocument = {
  id: string;
  name: string;
  relativePath: string;
  folder: string;
  raw: string;
  tags: string[];
  links: string[];
  wordCount: number;
  updatedAt: string;
};

function normalizeRef(value: string): string {
  return value.trim().toLowerCase().replace(/\.md$/i, "");
}

export function useBacklinks(
  documents: VaultDocument[],
  selectedDocument: VaultDocument | null
) {
  return useMemo(() => {
    if (!selectedDocument) return [];

    const fileName = selectedDocument.name.replace(/\.md$/i, "");
    const pathName = selectedDocument.relativePath.replace(/\.md$/i, "");

    const aliases = new Set<string>([
      normalizeRef(fileName),
      normalizeRef(pathName),
      normalizeRef(selectedDocument.relativePath.split("/").pop() || ""),
    ]);

    return documents.filter((doc) => {
      if (doc.relativePath === selectedDocument.relativePath) return false;
      return doc.links.some((link) => aliases.has(normalizeRef(link)));
    });
  }, [documents, selectedDocument]);
}

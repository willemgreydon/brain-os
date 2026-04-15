import { useMemo } from "react";

type GraphNode = {
  id: string;
  title?: string;
  type?: string;
  layer?: string;
  cluster?: string;
  tags?: string[];
  score?: number;
};

type GraphEdge = {
  source: string;
  target: string;
  weight?: number;
};

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

function normalizeTag(tag: string): string {
  return tag.startsWith("#") ? tag.toLowerCase() : `#${tag.toLowerCase()}`;
}

export function useTagFilter({
  documents,
  nodes,
  edges,
  selectedTags,
}: {
  documents: VaultDocument[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedTags: string[];
}) {
  return useMemo(() => {
    const allTags = [...new Set(documents.flatMap((doc) => doc.tags))].sort((a, b) =>
      a.localeCompare(b)
    );

    if (!selectedTags.length) {
      return {
        allTags,
        filteredDocuments: documents,
        filteredNodes: nodes,
        filteredEdges: edges,
      };
    }

    const normalizedSelected = selectedTags.map(normalizeTag);

    const filteredDocuments = documents.filter((doc) => {
      const docTags = doc.tags.map(normalizeTag);
      return normalizedSelected.every((tag) => docTags.includes(tag));
    });

    const allowedIds = new Set(filteredDocuments.map((doc) => doc.id));

    const filteredNodes = nodes.filter((node) => {
      const nodeTags = (node.tags || []).map(normalizeTag);
      if (normalizedSelected.every((tag) => nodeTags.includes(tag))) return true;
      return allowedIds.has(node.id);
    });

    const allowedNodeIds = new Set(filteredNodes.map((node) => node.id));
    const filteredEdges = edges.filter(
      (edge) => allowedNodeIds.has(edge.source) && allowedNodeIds.has(edge.target)
    );

    return {
      allTags,
      filteredDocuments,
      filteredNodes,
      filteredEdges,
    };
  }, [documents, nodes, edges, selectedTags]);
}

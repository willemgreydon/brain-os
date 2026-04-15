// lib/graph/deriveGraphModeData.ts
import type { GraphData } from "@brain/graph-core";
import type { GraphLayerMode } from "@/lib/store";

export type VaultGraphDocument = {
  id: string;
  name: string;
  relativePath: string;
  folder: string;
  extension: string;
  type: string;
  sizeBytes: number;
  raw: string;
  tags: string[];
  links: string[];
  wordCount: number;
  updatedAt: string;
  metadata?: Record<string, unknown>;
};

type GraphNode = GraphData["nodes"][number];
type GraphEdge = GraphData["edges"][number];

type DeriveGraphModeDataInput = {
  baseGraph: GraphData | null;
  documents: VaultGraphDocument[];
  mode: GraphLayerMode;
  sessionActivityIds?: string[];
};

function dedupeEdges(edges: GraphEdge[]): GraphEdge[] {
  const seen = new Set<string>();
  const result: GraphEdge[] = [];

  for (const edge of edges) {
    const source = String(edge.source);
    const target = String(edge.target);
    const key = `${source}::${target}::${edge.kind ?? "edge"}`;

    if (seen.has(key)) continue;
    seen.add(key);
    result.push(edge);
  }

  return result;
}

function folderNodeId(folder: string) {
  return `folder:${folder || "root"}`;
}

function fileNodeId(doc: VaultGraphDocument) {
  return `file:${doc.relativePath}`;
}

function codeSymbolNodeId(doc: VaultGraphDocument, symbol: string, kind: "import" | "export") {
  return `${kind}:${doc.relativePath}:${symbol}`;
}

function docTitle(doc: VaultGraphDocument) {
  return doc.name?.replace(/\.[^/.]+$/u, "") || doc.relativePath;
}

function isCodeDocument(doc: VaultGraphDocument) {
  return ["code", "script", "json", "csv"].includes(doc.type) ||
    [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".java", ".go", ".rs", ".php", ".rb", ".json"]
      .includes(doc.extension.startsWith(".") ? doc.extension : `.${doc.extension}`);
}

function inboundLinkCount(relativePath: string, docs: VaultGraphDocument[]) {
  const base = docBaseName(relativePath);

  return docs.filter((doc) =>
    doc.relativePath !== relativePath &&
    doc.links.some((link) => docBaseName(link) === base)
  ).length;
}

function docBaseName(input: string) {
  const raw = input.split("/").pop() || input;
  return raw.replace(/\.[^/.]+$/u, "").toLowerCase();
}

function parseImports(raw: string) {
  const importMatches = raw.matchAll(
    /import\s+(?:[\w*\s{},]*from\s+)?["']([^"']+)["'];?/g,
  );
  return [...importMatches].map((match) => match[1]).filter(Boolean);
}

function parseExports(raw: string) {
  const exportMatches = raw.matchAll(
    /export\s+(?:default\s+)?(?:const|function|class|type|interface)?\s*([A-Za-z0-9_$]+)/g,
  );
  return [...exportMatches].map((match) => match[1]).filter(Boolean);
}

function normalizeGraph(nodes: GraphNode[], edges: GraphEdge[]): GraphData {
  return {
    nodes,
    edges: dedupeEdges(edges),
  };
}

function buildSemanticGraph(baseGraph: GraphData | null): GraphData {
  return baseGraph ?? { nodes: [], edges: [] };
}

function buildFileSystemGraph(documents: VaultGraphDocument[]): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const folderMap = new Map<string, GraphNode>();

  for (const doc of documents) {
    const folder = doc.folder || "root";
    const folderId = folderNodeId(folder);

    if (!folderMap.has(folderId)) {
      const folderNode: GraphNode = {
        id: folderId,
        title: folder,
        type: "folder",
        layer: "filesystem",
        cluster: folder,
        tags: [],
        score: 0.6,
      };
      folderMap.set(folderId, folderNode);
      nodes.push(folderNode);

      const parentParts = folder.split("/").filter(Boolean);
      if (parentParts.length > 1) {
        const parentFolder = parentParts.slice(0, -1).join("/");
        edges.push({
          source: folderNodeId(parentFolder),
          target: folderId,
          weight: 0.9,
          kind: "hierarchy",
          label: "parent folder",
        });
      }
    }

    const fileId = fileNodeId(doc);
    nodes.push({
      id: fileId,
      title: doc.name,
      type: "file",
      layer: "filesystem",
      cluster: folder,
      tags: doc.tags,
      score: 0.8,
    });

    edges.push({
      source: folderId,
      target: fileId,
      weight: 1,
      kind: "contains",
      label: "contains",
    });

    for (const link of doc.links) {
      const targetDoc = documents.find((item) => docBaseName(item.relativePath) === docBaseName(link));
      if (!targetDoc) continue;

      edges.push({
        source: fileId,
        target: fileNodeId(targetDoc),
        weight: 0.7,
        kind: "reference",
        label: "cross-file reference",
      });
    }
  }

  return normalizeGraph(nodes, edges);
}

function buildCodeGraph(documents: VaultGraphDocument[]): GraphData {
  const codeDocs = documents.filter(isCodeDocument);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const doc of codeDocs) {
    const moduleId = fileNodeId(doc);

    nodes.push({
      id: moduleId,
      title: doc.name,
      type: "module",
      layer: "code",
      cluster: doc.folder || "root",
      tags: doc.tags,
      score: 1,
    });

    const imports = parseImports(doc.raw || "");
    const exports = parseExports(doc.raw || "");

    for (const symbol of exports) {
      const exportId = codeSymbolNodeId(doc, symbol, "export");
      nodes.push({
        id: exportId,
        title: symbol,
        type: "export",
        layer: "code",
        cluster: doc.folder || "root",
        tags: [],
        score: 0.72,
      });

      edges.push({
        source: moduleId,
        target: exportId,
        weight: 1,
        kind: "exports",
        label: "exports",
      });
    }

    for (const importedPath of imports) {
      const matchedDoc = codeDocs.find((candidate) => {
        return candidate.relativePath.includes(importedPath) ||
          candidate.name === importedPath ||
          candidate.name.replace(/\.[^/.]+$/u, "") === importedPath.replace("./", "").replace("../", "");
      });

      if (matchedDoc) {
        edges.push({
          source: moduleId,
          target: fileNodeId(matchedDoc),
          weight: 0.9,
          kind: "imports",
          label: "imports",
        });
      } else {
        const externalId = `external:${importedPath}`;
        nodes.push({
          id: externalId,
          title: importedPath,
          type: "dependency",
          layer: "code",
          cluster: "external",
          tags: [],
          score: 0.5,
        });

        edges.push({
          source: moduleId,
          target: externalId,
          weight: 0.6,
          kind: "imports",
          label: "external import",
        });
      }
    }
  }

  return normalizeGraph(nodes, edges);
}

function buildHybridGraph(baseGraph: GraphData | null, documents: VaultGraphDocument[]): GraphData {
  const semantic = buildSemanticGraph(baseGraph);
  const filesystem = buildFileSystemGraph(documents);
  const code = buildCodeGraph(documents);

  const nodes: GraphNode[] = [...semantic.nodes];
  const edges: GraphEdge[] = [...semantic.edges];

  for (const node of filesystem.nodes) {
    if (!nodes.some((existing) => existing.id === node.id)) nodes.push(node);
  }

  for (const node of code.nodes) {
    if (!nodes.some((existing) => existing.id === node.id)) nodes.push(node);
  }

  edges.push(...filesystem.edges, ...code.edges);

  for (const doc of documents) {
    const semanticNode = semantic.nodes.find(
      (node) =>
        String(node.id) === doc.relativePath ||
        String(node.id) === doc.id ||
        String(node.title).toLowerCase() === docTitle(doc).toLowerCase(),
    );

    if (!semanticNode) continue;

    edges.push({
      source: semanticNode.id,
      target: fileNodeId(doc),
      weight: 0.8,
      kind: "represents",
      label: "document node",
    });
  }

  return normalizeGraph(nodes, edges);
}

function buildTemporalGraph(
  baseGraph: GraphData | null,
  documents: VaultGraphDocument[],
  sessionActivityIds: string[] = [],
): GraphData {
  const now = Date.now();
  const recentDocs = [...documents]
    .map((doc) => {
      const updatedAt = new Date(doc.updatedAt).getTime();
      const ageDays = Number.isFinite(updatedAt)
        ? Math.max(0, Math.floor((now - updatedAt) / 86400000))
        : 9999;

      const recencyScore = Math.max(0.1, 1 - ageDays / 30);
      const activityBoost = sessionActivityIds.some(
        (id) => id === doc.relativePath || id === doc.id || id === fileNodeId(doc),
      )
        ? 0.35
        : 0;

      return {
        doc,
        score: Number((recencyScore + activityBoost).toFixed(3)),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 80);

  const recentSet = new Set(recentDocs.map((item) => item.doc.relativePath));
  const nodes: GraphNode[] = recentDocs.map(({ doc, score }) => ({
    id: fileNodeId(doc),
    title: doc.name,
    type: "temporal-note",
    layer: "temporal",
    cluster: doc.folder || "recent",
    tags: doc.tags,
    score,
  }));

  const edges: GraphEdge[] = [];

  for (const { doc, score } of recentDocs) {
    for (const link of doc.links) {
      const target = documents.find((candidate) => docBaseName(candidate.relativePath) === docBaseName(link));
      if (!target || !recentSet.has(target.relativePath)) continue;

      edges.push({
        source: fileNodeId(doc),
        target: fileNodeId(target),
        weight: Math.max(0.4, score),
        kind: "recent-reference",
        label: "recent reference",
      });
    }
  }

  for (const activityId of sessionActivityIds) {
    const activeDoc = documents.find(
      (doc) => doc.relativePath === activityId || doc.id === activityId || fileNodeId(doc) === activityId,
    );
    if (!activeDoc || !recentSet.has(activeDoc.relativePath)) continue;

    nodes.push({
      id: `session:${activeDoc.relativePath}`,
      title: `${activeDoc.name} · active`,
      type: "session",
      layer: "temporal",
      cluster: "session",
      tags: activeDoc.tags,
      score: 1.25,
    });

    edges.push({
      source: `session:${activeDoc.relativePath}`,
      target: fileNodeId(activeDoc),
      weight: 1.2,
      kind: "session-activity",
      label: "session activity",
    });
  }

  if (baseGraph) {
    for (const edge of baseGraph.edges) {
      const source = String(edge.source);
      const target = String(edge.target);

      const sourceDoc = documents.find(
        (doc) => doc.relativePath === source || doc.id === source || fileNodeId(doc) === source,
      );
      const targetDoc = documents.find(
        (doc) => doc.relativePath === target || doc.id === target || fileNodeId(doc) === target,
      );

      if (!sourceDoc || !targetDoc) continue;
      if (!recentSet.has(sourceDoc.relativePath) || !recentSet.has(targetDoc.relativePath)) continue;

      edges.push({
        source: fileNodeId(sourceDoc),
        target: fileNodeId(targetDoc),
        weight: edge.weight ?? 0.6,
        kind: edge.kind ?? "temporal-link",
        label: edge.label ?? "temporal relation",
      });
    }
  }

  return normalizeGraph(nodes, edges);
}

export function deriveGraphModeData({
  baseGraph,
  documents,
  mode,
  sessionActivityIds = [],
}: DeriveGraphModeDataInput): GraphData {
  switch (mode) {
    case "filesystem":
      return buildFileSystemGraph(documents);
    case "code":
      return buildCodeGraph(documents);
    case "hybrid":
      return buildHybridGraph(baseGraph, documents);
    case "temporal":
      return buildTemporalGraph(baseGraph, documents, sessionActivityIds);
    case "semantic":
    default:
      return buildSemanticGraph(baseGraph);
  }
}

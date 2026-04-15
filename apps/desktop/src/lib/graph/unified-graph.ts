import type { GraphEdge, GraphNode, PersistedGraphPosition, VaultDocument } from "../types";

export type UnifiedGraphNode = GraphNode & {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  relativePath?: string;
  groupKey: string;
};

export type UnifiedGraphEdge = GraphEdge & {
  id: string;
  color: string;
  size: number;
  kind: "wikilink" | "import" | "tag-bridge" | "payload" | "semantic";
};

export type GraphFilters = {
  search: string;
  activeTag: string | null;
  activeLayer: "all" | "markdown" | "code";
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function stripExt(value: string) {
  return value.replace(/\.[^/.]+$/u, "");
}

function baseName(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, "/");
  const last = normalized.split("/").pop() || normalized;
  return stripExt(last);
}

function colorForLayer(layer?: string) {
  if (layer === "markdown") return "#4979ff";
  if (layer === "code") return "#19c39c";
  if (layer === "system") return "#9a67ea";
  return "#c9d5f0";
}

function extractImports(raw: string): string[] {
  const results = new Set<string>();

  for (const match of raw.matchAll(/from\s+["'](.+?)["']/g)) {
    const value = match[1]?.trim();
    if (value) results.add(value);
  }

  for (const match of raw.matchAll(/import\s+["'](.+?)["']/g)) {
    const value = match[1]?.trim();
    if (value) results.add(value);
  }

  return Array.from(results);
}

function resolveImportTarget(sourceDoc: VaultDocument, targetSpecifier: string, docs: VaultDocument[]) {
  const clean = targetSpecifier
    .replace(/^\.\//, "")
    .replace(/\.(ts|tsx|js|jsx|mjs|cjs|json|css|scss)$/i, "");

  const sourceFolder = sourceDoc.folder || "";
  const normalizedSourceFolder = sourceFolder.replace(/\\/g, "/");

  const candidates = docs.filter((doc) => {
    if (doc.type !== "code" && doc.type !== "script" && doc.type !== "json") return false;

    const rel = doc.relativePath.replace(/\\/g, "/");
    const relNoExt = rel.replace(/\.(ts|tsx|js|jsx|mjs|cjs|json|css|scss)$/i, "");
    const basenameNoExt = baseName(doc.relativePath);

    return (
      relNoExt.endsWith(clean) ||
      basenameNoExt === clean.split("/").pop() ||
      `${normalizedSourceFolder}/${clean}` === relNoExt
    );
  });

  return candidates[0] ?? null;
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase();
}

function computeSemanticScore(a: VaultDocument, b: VaultDocument) {
  const tagOverlap = (a.tags || []).filter((tag) =>
    (b.tags || []).map(normalizeTag).includes(normalizeTag(tag))
  ).length;

  const folderAffinity =
    a.folder && b.folder && a.folder.split("/")[0] === b.folder.split("/")[0] ? 1 : 0;

  const sharedLinks = (a.links || []).filter((link) =>
    (b.links || []).includes(link)
  ).length;

  return tagOverlap * 3 + folderAffinity * 2 + sharedLinks;
}

function applySemanticGrouping(nodes: UnifiedGraphNode[], edges: UnifiedGraphEdge[]) {
  const degreeMap = new Map<string, number>();
  for (const node of nodes) degreeMap.set(node.id, 0);
  for (const edge of edges) {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
    degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
  }

  const clusterIndexMap = new Map<string, number>();
  const uniqueClusters = Array.from(new Set(nodes.map((n) => n.groupKey)));
  uniqueClusters.forEach((cluster, index) => clusterIndexMap.set(cluster, index));

  for (const node of nodes) {
    const degree = degreeMap.get(node.id) || 0;
    node.size = clamp((node.layer === "markdown" ? 10 : 8.5) + degree * 0.95, 8, 22);

    const clusterIndex = clusterIndexMap.get(node.groupKey) || 0;
    const ring = 36 + clusterIndex * 20;
    const angle = (clusterIndex / Math.max(1, uniqueClusters.length)) * Math.PI * 2;

    const offsetX = Math.cos(angle) * ring;
    const offsetY = Math.sin(angle) * ring;
    const offsetZ = ((clusterIndex % 5) - 2) * 18;

    const seed = Array.from(node.id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const jitterX = Math.sin(seed * 0.31) * 12;
    const jitterY = Math.cos(seed * 0.17) * 12;
    const jitterZ = Math.sin(seed * 0.13) * 9;

    node.x = offsetX + jitterX;
    node.y = offsetY + jitterY;
    node.z = offsetZ + jitterZ;
  }
}

function matchesFilters(node: UnifiedGraphNode, filters: GraphFilters) {
  const search = filters.search.trim().toLowerCase();
  const haystack = [
    node.title || node.id,
    node.cluster || "",
    node.layer || "",
    ...(node.tags || []),
    node.relativePath || "",
  ]
    .join(" ")
    .toLowerCase();

  const layerOk = filters.activeLayer === "all" ? true : node.layer === filters.activeLayer;
  const tagOk = filters.activeTag ? (node.tags || []).includes(filters.activeTag) : true;
  const searchOk = !search ? true : haystack.includes(search);

  return layerOk && tagOk && searchOk;
}

export function buildUnifiedGraphFromDocuments(input: {
  documents: VaultDocument[];
  filters: GraphFilters;
  persistedPositions?: Record<string, PersistedGraphPosition>;
}) {
  const docs = input.documents || [];
  const noteDocs = docs.filter((doc) => doc.type === "markdown");
  const codeDocs = docs.filter((doc) => doc.type === "code" || doc.type === "script" || doc.type === "json");
  const allDocs = [...noteDocs, ...codeDocs];

  const titleLookup = new Map<string, VaultDocument>();
  for (const doc of allDocs) {
    titleLookup.set(baseName(doc.relativePath).toLowerCase(), doc);
  }

  const nodes: UnifiedGraphNode[] = allDocs.map((doc, index) => {
    const layer = doc.type === "markdown" ? "markdown" : "code";
    const cluster =
      doc.tags[0]?.replace(/^#/, "") ||
      doc.folder.split("/")[0] ||
      (layer === "markdown" ? "notes" : "code");

    const persisted = input.persistedPositions?.[doc.relativePath];

    return {
      id: doc.relativePath,
      title: baseName(doc.relativePath),
      type: doc.type,
      layer,
      cluster,
      tags: doc.tags || [],
      score: doc.wordCount,
      color: colorForLayer(layer),
      size: 9,
      x: persisted?.x ?? Math.cos(index) * 20,
      y: persisted?.y ?? Math.sin(index) * 20,
      z: ((index % 5) - 2) * 10,
      relativePath: doc.relativePath,
      groupKey: cluster,
    };
  });

  const edgesMap = new Map<string, UnifiedGraphEdge>();

  function addEdge(edge: UnifiedGraphEdge) {
    if (!edgesMap.has(edge.id)) {
      edgesMap.set(edge.id, edge);
    }
  }

  for (const doc of noteDocs) {
    for (const link of doc.links || []) {
      const target =
        titleLookup.get(link.toLowerCase()) ||
        titleLookup.get(stripExt(link).toLowerCase());

      if (!target) continue;

      addEdge({
        id: `wikilink:${doc.relativePath}:${target.relativePath}`,
        source: doc.relativePath,
        target: target.relativePath,
        weight: 1,
        kind: "wikilink",
        color: "#6b95ff",
        size: 1.55,
      });
    }
  }

  for (const doc of codeDocs) {
    const imports = extractImports(doc.raw || "");
    for (const specifier of imports) {
      const target = resolveImportTarget(doc, specifier, allDocs);
      if (!target) continue;

      addEdge({
        id: `import:${doc.relativePath}:${target.relativePath}`,
        source: doc.relativePath,
        target: target.relativePath,
        weight: 1,
        kind: "import",
        color: "#2fd3aa",
        size: 1.35,
      });
    }
  }

  for (let i = 0; i < allDocs.length; i += 1) {
    for (let j = i + 1; j < allDocs.length; j += 1) {
      const a = allDocs[i];
      const b = allDocs[j];

      const overlap = (a.tags || []).filter((tag) =>
        (b.tags || []).includes(tag)
      );

      if (overlap.length > 0) {
        addEdge({
          id: `tag:${a.relativePath}:${b.relativePath}`,
          source: a.relativePath,
          target: b.relativePath,
          weight: overlap.length,
          kind: "tag-bridge",
          color: "#b189ff",
          size: 1.0,
        });
      }

      const semanticScore = computeSemanticScore(a, b);
      if (semanticScore >= 4) {
        addEdge({
          id: `semantic:${a.relativePath}:${b.relativePath}`,
          source: a.relativePath,
          target: b.relativePath,
          weight: semanticScore,
          kind: "semantic",
          color: "#f1b35b",
          size: 0.95,
        });
      }
    }
  }

  const allEdges = Array.from(edgesMap.values());
  applySemanticGrouping(nodes, allEdges);

  const visibleNodeIds = new Set(
    nodes.filter((node) => matchesFilters(node, input.filters)).map((node) => node.id)
  );

  const filteredNodes = nodes.filter((node) => visibleNodeIds.has(node.id));
  const filteredEdges = allEdges.filter(
    (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
  );

  const tags = Array.from(
    new Set(filteredNodes.flatMap((node) => node.tags || []).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  return {
    nodes: filteredNodes,
    edges: filteredEdges,
    tags,
  };
}

export function buildUnifiedGraphFromPayload(
  payloadGraph: { nodes: GraphNode[]; edges: GraphEdge[] },
  persistedPositions: Record<string, PersistedGraphPosition> = {}
) {
  const nodes: UnifiedGraphNode[] = payloadGraph.nodes.map((node, index) => ({
    ...node,
    x: persistedPositions[node.id]?.x ?? Math.cos(index) * 24,
    y: persistedPositions[node.id]?.y ?? Math.sin(index) * 24,
    z: ((index % 5) - 2) * 10,
    size: 8 + ((node.score ?? 0) > 0 ? 1 : 0),
    color: colorForLayer(node.layer),
    groupKey: node.cluster || node.layer || "graph",
  }));

  const edges: UnifiedGraphEdge[] = payloadGraph.edges.map((edge, index) => ({
    ...edge,
    id: `payload:${edge.source}:${edge.target}:${index}`,
    color: "#87a0d4",
    size: 1.1,
    kind: "payload",
  }));

  applySemanticGrouping(nodes, edges);

  const tags = Array.from(
    new Set(nodes.flatMap((node) => node.tags || []).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  return {
    nodes,
    edges,
    tags,
  };
}

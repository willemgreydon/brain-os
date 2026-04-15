import type { GraphEdge, GraphNode } from "../types";

export type MergeableGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type GitNexusGraph = {
  nodes: Array<{
    id: string;
    title?: string;
    type?: string;
    layer?: string;
    cluster?: string;
    tags?: string[];
    score?: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    weight?: number;
  }>;
};

function makeEdgeKey(source: string, target: string) {
  return `${source}→${target}`;
}

export function mergeGraphSources(input: {
  markdownGraph: MergeableGraph;
  gitGraph?: GitNexusGraph | null;
}): MergeableGraph {
  const nodeMap = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();

  for (const node of input.markdownGraph.nodes) {
    nodeMap.set(node.id, { ...node });
  }

  for (const edge of input.markdownGraph.edges) {
    edgeMap.set(makeEdgeKey(edge.source, edge.target), { ...edge });
  }

  if (input.gitGraph) {
    for (const node of input.gitGraph.nodes) {
      if (!nodeMap.has(node.id)) {
        nodeMap.set(node.id, {
          id: node.id,
          title: node.title || node.id,
          type: node.type || "code",
          layer: node.layer || "code",
          cluster: node.cluster || "repository",
          tags: node.tags || ["#code"],
          score: node.score,
        });
      } else {
        const existing = nodeMap.get(node.id)!;
        nodeMap.set(node.id, {
          ...existing,
          title: existing.title || node.title,
          type: existing.type || node.type,
          layer: existing.layer || node.layer,
          cluster: existing.cluster || node.cluster,
          tags: Array.from(new Set([...(existing.tags || []), ...(node.tags || [])])),
          score: typeof existing.score === "number" ? existing.score : node.score,
        });
      }
    }

    for (const edge of input.gitGraph.edges) {
      const key = makeEdgeKey(edge.source, edge.target);
      if (!edgeMap.has(key)) {
        edgeMap.set(key, {
          source: edge.source,
          target: edge.target,
          weight: edge.weight ?? 1,
        });
      } else {
        const existing = edgeMap.get(key)!;
        edgeMap.set(key, {
          ...existing,
          weight: Math.max(existing.weight ?? 1, edge.weight ?? 1),
        });
      }
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
  };
}

/**
 * Contract for future GitNexus ingestion:
 *
 * markdownGraph:
 * - semantic note graph
 * - wikilinks
 * - inferred knowledge relationships
 *
 * gitGraph:
 * - files
 * - modules
 * - imports
 * - symbol references
 * - call relationships
 *
 * merged result:
 * - one graph model consumable by Sigma / WebGL renderer
 */

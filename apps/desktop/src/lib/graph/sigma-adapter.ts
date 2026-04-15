import type { GraphEdge, GraphNode } from "../types";
import type { SigmaEdgeInput, SigmaNodeInput } from "../../components/GraphCanvas";

type GraphPayloadLike = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function computeDegrees(nodes: GraphNode[], edges: GraphEdge[]) {
  const map = new Map<string, number>();
  for (const node of nodes) map.set(node.id, 0);
  for (const edge of edges) {
    map.set(edge.source, (map.get(edge.source) || 0) + 1);
    map.set(edge.target, (map.get(edge.target) || 0) + 1);
  }
  return map;
}

function colorForNode(node: GraphNode) {
  const cluster = (node.cluster || "").toLowerCase();
  const layer = (node.layer || "").toLowerCase();

  if (cluster.includes("identity")) return "#4979ff";
  if (cluster.includes("system")) return "#19c39c";
  if (cluster.includes("strategy")) return "#9a67ea";
  if (cluster.includes("output")) return "#f4a340";

  if (layer === "core") return "#4979ff";
  if (layer === "knowledge") return "#19c39c";
  if (layer === "meta") return "#9a67ea";
  if (layer === "output") return "#f4a340";

  return "#c9d5f0";
}

export function buildSigmaGraph(payload: GraphPayloadLike): {
  nodes: SigmaNodeInput[];
  edges: SigmaEdgeInput[];
} {
  const nodes = payload.nodes || [];
  const edges = payload.edges || [];
  const degrees = computeDegrees(nodes, edges);

  const total = Math.max(nodes.length, 1);
  const sigmaNodes: SigmaNodeInput[] = nodes.map((node, index) => {
    const degree = degrees.get(node.id) || 0;
    const angle = (index / total) * Math.PI * 2;

    const band = index % 5;
    const orbitalBase = 8 + band * 3.8;
    const orbitalBoost = clamp(degree * 0.85, 0, 7);
    const radius = clamp(orbitalBase + orbitalBoost, 8, 22);

    const x = Math.cos(angle) * radius + Math.cos(index * 1.7) * 1.4;
    const y = Math.sin(angle) * radius + Math.sin(index * 1.35) * 1.4;
    const size = clamp(4.8 + degree * 0.7, 5, 14);

    return {
      id: node.id,
      label: node.title || node.id,
      x,
      y,
      size,
      color: colorForNode(node),
      type: node.type,
      cluster: node.cluster,
      layer: node.layer,
      tags: node.tags || [],
      score: node.score,
    };
  });

  const sigmaEdges: SigmaEdgeInput[] = edges.map((edge, index) => ({
    id: `${edge.source}-${edge.target}-${index}`,
    source: edge.source,
    target: edge.target,
    size: clamp(1 + (edge.weight || 0) * 0.35, 1, 3),
    color: "rgba(120, 134, 160, 0.28)",
    weight: edge.weight ?? 1,
  }));

  return {
    nodes: sigmaNodes,
    edges: sigmaEdges,
  };
}

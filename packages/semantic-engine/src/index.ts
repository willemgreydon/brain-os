import type { GraphEdge, GraphNode } from "../../graph-core/src/index";

const STOPWORDS = new Set([
  "the", "and", "for", "with", "this", "that", "from", "into", "your", "you", "are", "was", "were", "used",
  "und", "der", "die", "das", "mit", "von", "ist", "ein", "eine", "im", "in", "zu", "auf", "als"
]);

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9äöüß\s-]/gi, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function setFrom(node: GraphNode) {
  return new Set([...normalize(node.title), ...normalize(node.content ?? ""), ...node.tags.map((tag) => tag.toLowerCase())]);
}

function jaccard(a: Set<string>, b: Set<string>) {
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

export function buildSemanticEdges(nodes: GraphNode[], existingEdges: GraphEdge[]): GraphEdge[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const existingPairs = new Set(
    existingEdges.map((edge) => [edge.source, edge.target].sort().join("::"))
  );

  const vectors = new Map(nodes.map((node) => [node.id, setFrom(node)]));
  const edges: GraphEdge[] = [];

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const pair = [a.id, b.id].sort().join("::");
      if (existingPairs.has(pair)) continue;

      const similarity = jaccard(vectors.get(a.id)!, vectors.get(b.id)!);
      const sharedTagBoost = a.tags.some((tag) => b.tags.includes(tag)) ? 0.1 : 0;
      const sameLayerBoost = a.layer === b.layer ? 0.08 : 0;
      const sameClusterBoost = a.cluster && a.cluster === b.cluster ? 0.08 : 0;
      const score = similarity + sharedTagBoost + sameLayerBoost + sameClusterBoost;

      if (score >= 0.22) {
        edges.push({
          source: a.id,
          target: b.id,
          weight: Number(Math.min(0.82, score).toFixed(2)),
          kind: "semantic",
          label: `semantic ${(score * 100).toFixed(0)}%`
        });
      }
    }
  }

  return edges;
}

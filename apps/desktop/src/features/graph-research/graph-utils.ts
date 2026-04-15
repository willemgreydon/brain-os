// apps/desktop/src/features/graph-research/graph-utils.ts
import type {
  ResearchGraph,
  ResearchLink,
  ResearchNeighborhoodDepth,
  ResearchNode,
  ResearchNodeGroupMode,
  StructuralInsightCard,
} from "./types";

type AdjacencyMap = Map<string, Set<string>>;

export type GraphMetrics = {
  degree: Record<string, number>;
  betweenness: Record<string, number>;
  closeness: Record<string, number>;
  connectedComponents: string[][];
  bridgeCandidates: string[];
  denseClusterIds: string[];
  underlinkedImportantIds: string[];
};

export type VisibleGraphResult = {
  graph: ResearchGraph;
  visibleNodeIds: Set<string>;
  visibleEdgeKeys: Set<string>;
};

function edgeKey(source: string, target: string) {
  return source < target ? `${source}__${target}` : `${target}__${source}`;
}

export function buildAdjacency(graph: ResearchGraph): AdjacencyMap {
  const adjacency: AdjacencyMap = new Map();

  for (const node of graph.nodes) {
    adjacency.set(node.id, new Set());
  }

  for (const link of graph.links) {
    const source = String(link.source);
    const target = String(link.target);

    if (!adjacency.has(source)) adjacency.set(source, new Set());
    if (!adjacency.has(target)) adjacency.set(target, new Set());

    adjacency.get(source)!.add(target);
    adjacency.get(target)!.add(source);
  }

  return adjacency;
}

export function computeVisibleGraph(
  graph: ResearchGraph,
  isolatedRootId: string | null,
  depth: ResearchNeighborhoodDepth,
): VisibleGraphResult {
  if (!isolatedRootId || depth === "full") {
    return {
      graph,
      visibleNodeIds: new Set(graph.nodes.map((node) => node.id)),
      visibleEdgeKeys: new Set(
        graph.links.map((link) => edgeKey(String(link.source), String(link.target))),
      ),
    };
  }

  const adjacency = buildAdjacency(graph);
  const visited = new Set<string>([isolatedRootId]);
  let frontier = new Set<string>([isolatedRootId]);

  for (let step = 0; step < depth; step += 1) {
    const next = new Set<string>();

    for (const nodeId of frontier) {
      const neighbors = adjacency.get(nodeId) ?? new Set<string>();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          next.add(neighbor);
        }
      }
    }

    frontier = next;
    if (!frontier.size) break;
  }

  const filteredNodes = graph.nodes.filter((node) => visited.has(node.id));
  const filteredLinks = graph.links.filter((link) => {
    const s = String(link.source);
    const t = String(link.target);
    return visited.has(s) && visited.has(t);
  });

  return {
    graph: {
      nodes: filteredNodes,
      links: filteredLinks,
    },
    visibleNodeIds: visited,
    visibleEdgeKeys: new Set(filteredLinks.map((link) => edgeKey(String(link.source), String(link.target)))),
  };
}

export function shortestPath(graph: ResearchGraph, fromId: string, toId: string): string[] {
  if (fromId === toId) return [fromId];

  const adjacency = buildAdjacency(graph);
  const queue: string[] = [fromId];
  const visited = new Set<string>([fromId]);
  const parent = new Map<string, string | null>([[fromId, null]]);

  while (queue.length) {
    const current = queue.shift()!;
    const neighbors = adjacency.get(current) ?? new Set<string>();

    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;

      visited.add(neighbor);
      parent.set(neighbor, current);

      if (neighbor === toId) {
        const path: string[] = [];
        let cursor: string | null = toId;

        while (cursor) {
          path.unshift(cursor);
          cursor = parent.get(cursor) ?? null;
        }

        return path;
      }

      queue.push(neighbor);
    }
  }

  return [];
}

export function pathToEdgeKeys(path: string[]): string[] {
  const keys: string[] = [];
  for (let i = 0; i < path.length - 1; i += 1) {
    keys.push(edgeKey(path[i], path[i + 1]));
  }
  return keys;
}

function connectedComponents(graph: ResearchGraph): string[][] {
  const adjacency = buildAdjacency(graph);
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const node of graph.nodes) {
    if (visited.has(node.id)) continue;

    const queue = [node.id];
    const component: string[] = [];
    visited.add(node.id);

    while (queue.length) {
      const current = queue.shift()!;
      component.push(current);

      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    components.push(component);
  }

  return components;
}

export function computeGraphMetrics(graph: ResearchGraph): GraphMetrics {
  const adjacency = buildAdjacency(graph);
  const degree: Record<string, number> = {};
  const betweenness: Record<string, number> = {};
  const closeness: Record<string, number> = {};

  for (const node of graph.nodes) {
    degree[node.id] = (adjacency.get(node.id) ?? new Set()).size;
    betweenness[node.id] = 0;
    closeness[node.id] = 0;
  }

  const nodeIds = graph.nodes.map((node) => node.id);

  for (const source of nodeIds) {
    const stack: string[] = [];
    const predecessors = new Map<string, string[]>();
    const sigma = new Map<string, number>();
    const distance = new Map<string, number>();
    const queue: string[] = [];

    for (const nodeId of nodeIds) {
      predecessors.set(nodeId, []);
      sigma.set(nodeId, 0);
      distance.set(nodeId, -1);
    }

    sigma.set(source, 1);
    distance.set(source, 0);
    queue.push(source);

    while (queue.length) {
      const v = queue.shift()!;
      stack.push(v);

      for (const w of adjacency.get(v) ?? []) {
        if ((distance.get(w) ?? -1) < 0) {
          queue.push(w);
          distance.set(w, (distance.get(v) ?? 0) + 1);
        }

        if ((distance.get(w) ?? -1) === (distance.get(v) ?? 0) + 1) {
          sigma.set(w, (sigma.get(w) ?? 0) + (sigma.get(v) ?? 0));
          predecessors.get(w)!.push(v);
        }
      }
    }

    const dependency = new Map<string, number>();
    for (const nodeId of nodeIds) dependency.set(nodeId, 0);

    let distanceSum = 0;
    let reachableCount = 0;

    for (const nodeId of nodeIds) {
      const distanceValue = distance.get(nodeId) ?? -1;
      if (distanceValue > 0) {
        distanceSum += distanceValue;
        reachableCount += 1;
      }
    }

    closeness[source] = distanceSum > 0 ? reachableCount / distanceSum : 0;

    while (stack.length) {
      const w = stack.pop()!;
      for (const v of predecessors.get(w) ?? []) {
        const contribution =
          ((sigma.get(v) ?? 0) / Math.max(sigma.get(w) ?? 1, 1)) * (1 + (dependency.get(w) ?? 0));
        dependency.set(v, (dependency.get(v) ?? 0) + contribution);
      }

      if (w !== source) {
        betweenness[w] += dependency.get(w) ?? 0;
      }
    }
  }

  const groupBuckets = new Map<string, string[]>();
  for (const node of graph.nodes) {
    const clusterId = node.cluster || node.folder || node.layer || "ungrouped";
    const bucket = groupBuckets.get(clusterId) ?? [];
    bucket.push(node.id);
    groupBuckets.set(clusterId, bucket);
  }

  const denseClusterIds = [...groupBuckets.entries()]
    .filter(([, ids]) => ids.length >= 4)
    .map(([id]) => id);

  const bridgeCandidates = Object.entries(betweenness)
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.max(3, Math.ceil(nodeIds.length * 0.08)))
    .map(([nodeId]) => nodeId);

  const underlinkedImportantIds = graph.nodes
    .filter((node) => (degree[node.id] ?? 0) <= 1 && (node.score ?? 0) >= 0.6)
    .map((node) => node.id);

  return {
    degree,
    betweenness,
    closeness,
    connectedComponents: connectedComponents(graph),
    bridgeCandidates,
    denseClusterIds,
    underlinkedImportantIds,
  };
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

function similarity(a: ResearchNode, b: ResearchNode) {
  const aTokens = new Set([...tokenize(a.title), ...a.tags.map((tag) => tag.toLowerCase())]);
  const bTokens = new Set([...tokenize(b.title), ...b.tags.map((tag) => tag.toLowerCase())]);

  const intersection = [...aTokens].filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;

  return union ? intersection / union : 0;
}

export function buildInsightCards(graph: ResearchGraph): StructuralInsightCard[] {
  const metrics = computeGraphMetrics(graph);
  const cards: StructuralInsightCard[] = [];

  if (metrics.denseClusterIds.length) {
    cards.push({
      id: "strong-cluster",
      type: "strong_cluster",
      title: "Strong cluster detected",
      body: `High local density suggests a stable area of thought. Review whether this cluster is productive or over-contained.`,
      nodeIds: graph.nodes
        .filter((node) => metrics.denseClusterIds.includes(node.cluster || node.folder || node.layer || "ungrouped"))
        .slice(0, 10)
        .map((node) => node.id),
      severity: "low",
    });
  }

  if (metrics.bridgeCandidates.length) {
    cards.push({
      id: "weak-bridge",
      type: "weak_bridge",
      title: "Bridging concepts are carrying disproportionate load",
      body: `These nodes appear to connect otherwise separate regions. Strengthen nearby supporting notes to reduce structural bottlenecks.`,
      nodeIds: metrics.bridgeCandidates.slice(0, 5),
      severity: "high",
    });
  }

  const isolated = metrics.connectedComponents
    .filter((component) => component.length === 1)
    .flat();

  if (isolated.length) {
    cards.push({
      id: "isolated-concepts",
      type: "isolated_concept",
      title: "Isolated concepts found",
      body: `These notes currently sit outside the network. Link them intentionally or archive them if they are noise.`,
      nodeIds: isolated.slice(0, 6),
      severity: "high",
    });
  }

  if (metrics.underlinkedImportantIds.length) {
    cards.push({
      id: "recommended-link",
      type: "recommended_link",
      title: "Underlinked but important notes",
      body: `These notes appear significant but weakly connected. They are prime candidates for new links.`,
      nodeIds: metrics.underlinkedImportantIds.slice(0, 5),
      severity: "medium",
    });
  }

  const duplicates: StructuralInsightCard[] = [];
  for (let i = 0; i < graph.nodes.length; i += 1) {
    for (let j = i + 1; j < graph.nodes.length; j += 1) {
      const score = similarity(graph.nodes[i], graph.nodes[j]);
      if (score >= 0.72) {
        duplicates.push({
          id: `duplicate-${graph.nodes[i].id}-${graph.nodes[j].id}`,
          type: "likely_duplicate",
          title: "Potential duplicate or overlapping concept",
          body: `These notes share a strong lexical/semantic overlap. Consider merging, cross-linking or clarifying scope.`,
          nodeIds: [graph.nodes[i].id, graph.nodes[j].id],
          severity: "medium",
        });
      }
    }
  }

  cards.push(...duplicates.slice(0, 3));

  const tensionPairs: StructuralInsightCard[] = [];
  const contradictionTerms = ["not", "anti", "versus", "vs", "contra", "opposed"];
  for (let i = 0; i < graph.nodes.length; i += 1) {
    for (let j = i + 1; j < graph.nodes.length; j += 1) {
      const a = graph.nodes[i];
      const b = graph.nodes[j];
      const text = `${a.title} ${b.title}`.toLowerCase();
      if (contradictionTerms.some((term) => text.includes(term)) && similarity(a, b) >= 0.2) {
        tensionPairs.push({
          id: `tension-${a.id}-${b.id}`,
          type: "tension_zone",
          title: "Tension zone in concept framing",
          body: `These notes may express competing framings around a related concept. Review for contradiction, nuance or synthesis.`,
          nodeIds: [a.id, b.id],
          severity: "medium",
        });
      }
    }
  }

  cards.push(...tensionPairs.slice(0, 2));

  return cards.slice(0, 8);
}

export function groupValueForNode(node: ResearchNode, mode: ResearchNodeGroupMode): string {
  switch (mode) {
    case "tag":
      return node.tags[0] || "untagged";
    case "folder":
      return node.folder || "root";
    case "layer":
      return node.layer || "unknown";
    case "semantic":
      return node.semanticGroup || node.cluster || "semantic";
    case "linkDensity":
      return `${Math.min(Math.floor((node.score ?? 0) * 3), 3)}`;
    case "none":
    default:
      return "all";
  }
}

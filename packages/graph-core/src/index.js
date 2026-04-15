"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dedupeEdges = dedupeEdges;
exports.annotateGraph = annotateGraph;
exports.buildTagEdges = buildTagEdges;
exports.getNeighborhood = getNeighborhood;
const DEFAULT_COLORS = {
    system: "#F7C873",
    domain: "#8FD2FF",
    concept: "#FF98AB",
    method: "#95E8C2",
    model: "#C8B1FF",
    project: "#B0BFD4",
    reference: "#F1D6AA",
    note: "#E5EDF8"
};
function dedupeEdges(edges) {
    const map = new Map();
    for (const edge of edges) {
        const pair = [edge.source, edge.target].sort().join("::");
        const key = `${pair}::${edge.kind}`;
        const existing = map.get(key);
        if (!existing || edge.weight > existing.weight)
            map.set(key, edge);
    }
    return [...map.values()];
}
function annotateGraph(data) {
    const degreeMap = new Map(data.nodes.map((node) => [node.id, 0]));
    for (const edge of data.edges) {
        degreeMap.set(edge.source, (degreeMap.get(edge.source) ?? 0) + 1);
        degreeMap.set(edge.target, (degreeMap.get(edge.target) ?? 0) + 1);
    }
    const maxDegree = Math.max(1, ...degreeMap.values());
    return {
        edges: dedupeEdges(data.edges),
        nodes: data.nodes.map((node) => {
            const degree = degreeMap.get(node.id) ?? 0;
            return {
                ...node,
                degree,
                score: Number((degree / maxDegree).toFixed(2)),
                size: 0.85 + degree * 0.14,
                color: DEFAULT_COLORS[node.type] ?? DEFAULT_COLORS.note,
                cluster: node.cluster ?? node.layer
            };
        })
    };
}
function buildTagEdges(nodes) {
    const tagIndex = new Map();
    for (const node of nodes) {
        for (const tag of node.tags) {
            const key = tag.toLowerCase();
            tagIndex.set(key, [...(tagIndex.get(key) ?? []), node.id]);
        }
    }
    const edges = [];
    for (const [tag, ids] of tagIndex.entries()) {
        for (let i = 0; i < ids.length; i += 1) {
            for (let j = i + 1; j < ids.length; j += 1) {
                edges.push({ source: ids[i], target: ids[j], weight: 0.22, kind: "tag", label: `shared tag: ${tag}` });
            }
        }
    }
    return edges;
}
function getNeighborhood(graph, nodeId) {
    const related = new Set([nodeId]);
    const edgeIndexes = new Set();
    graph.edges.forEach((edge, index) => {
        if (edge.source === nodeId || edge.target === nodeId) {
            related.add(edge.source);
            related.add(edge.target);
            edgeIndexes.add(index);
        }
    });
    return {
        nodes: graph.nodes.filter((node) => related.has(node.id)),
        edges: graph.edges.filter((_, index) => edgeIndexes.has(index))
    };
}

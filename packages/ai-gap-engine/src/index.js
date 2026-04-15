export function detectKnowledgeGaps(graph) {
    const degreeMap = new Map(graph.nodes.map((node) => [node.id, 0]));
    for (const edge of graph.edges) {
        degreeMap.set(edge.source, (degreeMap.get(edge.source) ?? 0) + 1);
        degreeMap.set(edge.target, (degreeMap.get(edge.target) ?? 0) + 1);
    }
    const gaps = [];
    const isolated = graph.nodes.filter((node) => (degreeMap.get(node.id) ?? 0) <= 1);
    for (const node of isolated) {
        const candidate = graph.nodes.find((other) => other.id !== node.id && other.layer === node.layer);
        gaps.push({
            id: `isolated-${node.id}`,
            title: `${node.title} is weakly connected`,
            severity: "high",
            reason: "This note barely participates in the graph and risks becoming an intellectual dead end.",
            recommendedBridge: candidate
                ? `Create a bridge note or direct link between ${node.title} and ${candidate.title}.`
                : `Create a new MOC that places ${node.title} inside a wider system.`,
            nodesInvolved: [node.id, ...(candidate ? [candidate.id] : [])]
        });
    }
    const semanticOnly = graph.edges.filter((edge) => edge.kind === "semantic" && edge.weight >= 0.38);
    for (const edge of semanticOnly.slice(0, 5)) {
        const source = graph.nodes.find((node) => node.id === edge.source);
        const target = graph.nodes.find((node) => node.id === edge.target);
        if (!source || !target)
            continue;
        const hasDirectLink = graph.edges.some((candidate) => {
            const samePair = [candidate.source, candidate.target].sort().join("::") === [edge.source, edge.target].sort().join("::");
            return samePair && candidate.kind === "wikilink";
        });
        if (hasDirectLink)
            continue;
        gaps.push({
            id: `semantic-bridge-${edge.source}-${edge.target}`,
            title: `Bridge likely missing: ${source.title} ↔ ${target.title}`,
            severity: "medium",
            reason: "The notes look semantically related, but there is no explicit navigational connection between them.",
            recommendedBridge: `Add a direct wikilink or create a short synthesis note that explains how ${source.title} connects to ${target.title}.`,
            nodesInvolved: [edge.source, edge.target]
        });
    }
    const clusterMap = new Map();
    for (const node of graph.nodes) {
        const key = node.cluster ?? "general";
        clusterMap.set(key, [...(clusterMap.get(key) ?? []), node.id]);
    }
    for (const [cluster, ids] of clusterMap.entries()) {
        if (ids.length < 2)
            continue;
        const internalEdges = graph.edges.filter((edge) => ids.includes(edge.source) && ids.includes(edge.target));
        if (internalEdges.length <= 1) {
            gaps.push({
                id: `cluster-${cluster}`,
                title: `Cluster ${cluster} lacks internal structure`,
                severity: "low",
                reason: "A named knowledge cluster exists, but the notes inside it are barely linked and may be conceptually fragmented.",
                recommendedBridge: `Create a cluster overview note for ${cluster} and add explicit links among the most central notes.`,
                nodesInvolved: ids.slice(0, 4)
            });
        }
    }
    return gaps.slice(0, 12);
}

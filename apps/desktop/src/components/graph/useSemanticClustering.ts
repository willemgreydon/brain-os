export function clusterByTags(nodes: any[]) {
  const map = new Map<string, any[]>();

  nodes.forEach((node) => {
    const key = node.tags?.[0] || "uncategorized";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(node);
  });

  return Array.from(map.entries()).map(([cluster, items]) => ({
    id: cluster,
    nodes: items,
  }));
}

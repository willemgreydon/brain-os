// apps/desktop/src/features/graph-research/useGraphResearch.ts
import { useMemo, useState } from "react";
import {
  buildInsightCards,
  computeGraphMetrics,
  computeVisibleGraph,
  groupValueForNode,
  pathToEdgeKeys,
  shortestPath,
} from "./graph-utils";
import type {
  ResearchGraph,
  ResearchNeighborhoodDepth,
  ResearchNodeGroupMode,
  Viewpoint,
} from "./types";

export function useGraphResearch(graph: ResearchGraph) {
  const [isolatedRootId, setIsolatedRootId] = useState<string | null>(null);
  const [neighborhoodDepth, setNeighborhoodDepth] =
    useState<ResearchNeighborhoodDepth>("full");
  const [pinnedNodeIds, setPinnedNodeIds] = useState<string[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [pathFromId, setPathFromId] = useState<string | null>(null);
  const [pathToId, setPathToId] = useState<string | null>(null);
  const [groupMode, setGroupMode] = useState<ResearchNodeGroupMode>("none");
  const [savedViewpoints, setSavedViewpoints] = useState<Viewpoint[]>([]);
  const [timelineIndex, setTimelineIndex] = useState(0);

  const visibleGraph = useMemo(
    () => computeVisibleGraph(graph, isolatedRootId, neighborhoodDepth),
    [graph, isolatedRootId, neighborhoodDepth],
  );

  const metrics = useMemo(
    () => computeGraphMetrics(visibleGraph.graph),
    [visibleGraph.graph],
  );

  const insightCards = useMemo(
    () => buildInsightCards(visibleGraph.graph),
    [visibleGraph.graph],
  );

  const highlightedPath = useMemo(() => {
    if (!pathFromId || !pathToId) return { nodeIds: [] as string[], edgeKeys: [] as string[] };

    const nodeIds = shortestPath(visibleGraph.graph, pathFromId, pathToId);
    return {
      nodeIds,
      edgeKeys: pathToEdgeKeys(nodeIds),
    };
  }, [pathFromId, pathToId, visibleGraph.graph]);

  const groupedClouds = useMemo(() => {
    const groups = new Map<string, string[]>();

    for (const node of visibleGraph.graph.nodes) {
      const key = groupValueForNode(node, groupMode);
      const existing = groups.get(key) ?? [];
      existing.push(node.id);
      groups.set(key, existing);
    }

    return [...groups.entries()]
      .filter(([, nodeIds]) => nodeIds.length >= 3)
      .map(([id, nodeIds]) => ({ id, nodeIds }));
  }, [groupMode, visibleGraph.graph.nodes]);

  function handleDoubleClickNode(nodeId: string) {
    setIsolatedRootId((current) => (current === nodeId ? null : nodeId));
    setNeighborhoodDepth(1);
    setSelectedNodeId(nodeId);
  }

  function togglePinNode(nodeId: string) {
    setPinnedNodeIds((current) =>
      current.includes(nodeId)
        ? current.filter((id) => id !== nodeId)
        : [...current, nodeId],
    );
  }

  function saveViewpoint(viewpoint: Viewpoint) {
    setSavedViewpoints((current) => {
      const withoutSameId = current.filter((item) => item.id !== viewpoint.id);
      return [...withoutSameId, viewpoint];
    });
  }

  return {
    isolatedRootId,
    setIsolatedRootId,
    neighborhoodDepth,
    setNeighborhoodDepth,
    pinnedNodeIds,
    togglePinNode,
    selectedNodeId,
    setSelectedNodeId,
    pathFromId,
    setPathFromId,
    pathToId,
    setPathToId,
    groupMode,
    setGroupMode,
    savedViewpoints,
    saveViewpoint,
    timelineIndex,
    setTimelineIndex,
    visibleGraph,
    metrics,
    insightCards,
    groupedClouds,
    highlightedPath,
    handleDoubleClickNode,
  };
}

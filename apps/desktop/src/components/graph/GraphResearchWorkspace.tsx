// apps/desktop/src/components/graph/GraphResearchWorkspace.tsx
import React, { useMemo, useRef } from "react";
import GraphCanvas3D from "../GraphCanvas3D";
import GraphResearchControls from "./GraphResearchControls";
import InsightCardsPanel from "./InsightCardsPanel";
import { useGraphResearch } from "../../features/graph-research/useGraphResearch";
import type { ResearchGraph, Viewpoint } from "../../features/graph-research/types";

type GraphResearchWorkspaceProps = {
  graph: ResearchGraph;
  initialSelectedNodeId?: string | null;
  onOpenNode?: (nodeId: string) => void;
};

export default function GraphResearchWorkspace({
  graph,
  initialSelectedNodeId = null,
  onOpenNode,
}: GraphResearchWorkspaceProps) {
  const viewpointCounterRef = useRef(1);

  const {
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
    highlightedPath,
    handleDoubleClickNode,
  } = useGraphResearch(graph);

  const effectiveSelectedNodeId = selectedNodeId ?? initialSelectedNodeId;
  const nodeOptions = useMemo(
    () =>
      graph.nodes.map((node) => ({
        id: node.id,
        label: node.title,
      })),
    [graph.nodes],
  );

  const highlightedNodeIds = new Set(highlightedPath.nodeIds);
  const pinnedNodeSet = new Set(pinnedNodeIds);

  const graphNodes = visibleGraph.graph.nodes.map((node) => ({
    id: node.id,
    title: node.title,
    type: node.type,
    layer: node.layer,
    cluster: node.cluster,
    tags: node.tags,
    score: node.score,
  }));

  const graphLinks = visibleGraph.graph.links.map((link) => ({
    source: link.source,
    target: link.target,
    weight: link.weight ?? 1,
  }));

  function handleSaveViewpoint() {
    const nextViewpoint: Viewpoint = {
      id: `view-${viewpointCounterRef.current}`,
      label: `View ${viewpointCounterRef.current}`,
      camera: { x: 0, y: 0, z: 180 },
      targetNodeId: effectiveSelectedNodeId,
      neighborhoodDepth,
      groupMode,
    };

    viewpointCounterRef.current += 1;
    saveViewpoint(nextViewpoint);
  }

  function handleLoadViewpoint(viewpoint: Viewpoint) {
    setNeighborhoodDepth(viewpoint.neighborhoodDepth);
    setGroupMode(viewpoint.groupMode);
    setSelectedNodeId(viewpoint.targetNodeId ?? null);
    setIsolatedRootId(viewpoint.targetNodeId ?? null);
  }

  return (
    <div className="graph-research-layout">
      <div className="graph-research-layout__canvas">
        <GraphCanvas3D
          className="graph-research-canvas"
          nodes={graphNodes}
          links={graphLinks}
          selectedNodeId={effectiveSelectedNodeId}
          pinnedNodeIds={pinnedNodeIds}
          highlightedNodeIds={[...highlightedNodeIds]}
          highlightedEdgeKeys={highlightedPath.edgeKeys}
          bridgeNodeIds={metrics.bridgeCandidates}
          isolatedNodeIds={metrics.connectedComponents.flatMap((component) =>
            component.length === 1 ? component : [],
          )}
          denseGroupNodeIds={metrics.denseClusterIds}
          groupMode={groupMode}
          onSelectNode={(node) => {
            const nodeId = node?.id ?? null;
            setSelectedNodeId(nodeId);
            if (nodeId) onOpenNode?.(nodeId);
          }}
          onDoubleClickNode={(node) => {
            if (!node) return;
            handleDoubleClickNode(node.id);
          }}
          isNodePinned={(nodeId) => pinnedNodeSet.has(nodeId)}
        />
      </div>

      <aside className="graph-research-layout__sidebar">
        <GraphResearchControls
          neighborhoodDepth={neighborhoodDepth}
          onNeighborhoodDepthChange={setNeighborhoodDepth}
          groupMode={groupMode}
          onGroupModeChange={setGroupMode}
          pathFromId={pathFromId}
          setPathFromId={setPathFromId}
          pathToId={pathToId}
          setPathToId={setPathToId}
          selectedNodeId={effectiveSelectedNodeId}
          pinnedNodeIds={pinnedNodeIds}
          onTogglePinNode={togglePinNode}
          onClearIsolation={() => {
            setIsolatedRootId(null);
            setNeighborhoodDepth("full");
          }}
          savedViewpoints={savedViewpoints}
          onSaveViewpoint={handleSaveViewpoint}
          onLoadViewpoint={handleLoadViewpoint}
          timelineIndex={timelineIndex}
          onTimelineIndexChange={setTimelineIndex}
          nodeOptions={nodeOptions}
        />

        <section className="research-panel">
          <div className="research-panel__header">
            <div>
              <p className="research-panel__eyebrow">Graph Metrics</p>
              <h3 className="research-panel__title">InfraNodus-style signals</h3>
            </div>
          </div>

          <div className="stats-grid stats-grid--two">
            <div className="stat-box">
              <span>Bridge nodes</span>
              <strong>{metrics.bridgeCandidates.length}</strong>
            </div>
            <div className="stat-box">
              <span>Components</span>
              <strong>{metrics.connectedComponents.length}</strong>
            </div>
            <div className="stat-box">
              <span>Dense clusters</span>
              <strong>{metrics.denseClusterIds.length}</strong>
            </div>
            <div className="stat-box">
              <span>Underlinked important</span>
              <strong>{metrics.underlinkedImportantIds.length}</strong>
            </div>
          </div>
        </section>

        <InsightCardsPanel
          cards={insightCards}
          onFocusNodes={(nodeIds) => {
            const first = nodeIds[0] ?? null;
            setSelectedNodeId(first);
            setIsolatedRootId(first);
            setNeighborhoodDepth(2);
          }}
        />
      </aside>
    </div>
  );
}

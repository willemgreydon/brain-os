// components/GraphModeSurface.tsx
import React, { useMemo } from "react";
import type { GraphData } from "@brain/graph-core";
import { useAppStore } from "@/lib/store";
import { deriveGraphModeData, type VaultGraphDocument } from "@/lib/graph/deriveGraphModeData";
import { GraphCanvas3D } from "@/components/GraphCanvas3D";

type GraphModeSurfaceProps = {
  baseGraph: GraphData | null;
  documents: VaultGraphDocument[];
};

function normalizeNodes(graph: GraphData) {
  return graph.nodes.map((node) => ({
    id: String(node.id),
    label: node.title || String(node.id),
    color:
      node.layer === "code"
        ? "#a78bfa"
        : node.layer === "filesystem"
          ? "#67e8f9"
          : node.layer === "temporal"
            ? "#f59e0b"
            : "#7dd3fc",
    size: typeof node.score === "number" ? Math.max(4, Math.min(14, node.score * 9)) : 6,
    cluster: node.cluster || "general",
    layer: node.layer || "knowledge",
    tags: node.tags || [],
    relativePath:
      String(node.id).startsWith("file:")
        ? String(node.id).replace(/^file:/u, "")
        : String(node.id),
    score: node.score,
  }));
}

function normalizeLinks(graph: GraphData) {
  return graph.edges.map((edge) => ({
    source: String(edge.source),
    target: String(edge.target),
    color:
      edge.kind === "imports"
        ? "#a78bfa"
        : edge.kind === "contains" || edge.kind === "hierarchy"
          ? "#67e8f9"
          : edge.kind === "session-activity"
            ? "#f59e0b"
            : "#cbd5e1",
    width: typeof edge.weight === "number" ? Math.max(1, Math.min(4, edge.weight * 2.2)) : 1.25,
    kind: edge.kind,
  }));
}

export function GraphModeSurface({ baseGraph, documents }: GraphModeSurfaceProps) {
  const graphLayerMode = useAppStore((state) => state.graphLayerMode);
  const selectedNodeId = useAppStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useAppStore((state) => state.setSelectedNodeId);
  const recordSessionNodeActivity = useAppStore((state) => state.recordSessionNodeActivity);
  const sessionActivityIds = useAppStore((state) => state.sessionActivityIds);

  const graphData = useMemo(
    () =>
      deriveGraphModeData({
        baseGraph,
        documents,
        mode: graphLayerMode,
        sessionActivityIds,
      }),
    [baseGraph, documents, graphLayerMode, sessionActivityIds],
  );

  const nodes = useMemo(() => normalizeNodes(graphData), [graphData]);
  const links = useMemo(() => normalizeLinks(graphData), [graphData]);

  return (
    <div className="absolute inset-0">
      <div className="pointer-events-none absolute left-6 top-[7.5rem] z-20 flex items-center gap-2">
        <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white/70 backdrop-blur-xl">
          {graphLayerMode}
        </span>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/50 backdrop-blur-xl">
          {nodes.length} nodes · {links.length} links
        </span>
      </div>

      <GraphCanvas3D
        nodes={nodes}
        links={links}
        selectedNodeId={selectedNodeId}
        onSelectNode={(id) => {
          setSelectedNodeId(id);
          if (id) recordSessionNodeActivity(id);
        }}
      />
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import Sigma from "sigma";
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import type { Attributes } from "graphology-types";
import type { UnifiedGraphEdge, UnifiedGraphNode } from "../lib/graph/unified-graph";

type GraphCanvasProps = {
  nodes: UnifiedGraphNode[];
  edges: UnifiedGraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onNodePositionChange?: (nodeId: string, x: number, y: number) => void;
  className?: string;
};

function withAlpha(hex: string, alpha: number) {
  if (!hex.startsWith("#")) return hex;
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function GraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onNodePositionChange,
  className,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const initializedRef = useRef(false);
  const draggedNodeRef = useRef<string | null>(null);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    nodes.forEach((n) => map.set(n.id, new Set()));
    edges.forEach((e) => {
      map.get(e.source)?.add(e.target);
      map.get(e.target)?.add(e.source);
    });
    return map;
  }, [nodes, edges]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 🔥 prevent React strict double init
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (!nodes.length) return;

    // ✅ MULTI GRAPH (CRITICAL FIX)
    const graph = new Graph({ multi: true });
    graphRef.current = graph;

    // --- NODES ---
    nodes.forEach((node) => {
      if (!graph.hasNode(node.id)) {
        graph.addNode(node.id, {
          x: node.x ?? Math.random(),
          y: node.y ?? Math.random(),
          size: node.size ?? 6,
          color: node.color ?? "#4979ff",
          baseColor: node.color ?? "#4979ff",
          baseSize: node.size ?? 6,
          label: node.title ?? node.id,
        } satisfies Attributes);
      }
    });

    // --- EDGES (SAFE) ---
    edges.forEach((edge) => {
      if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) return;

      // prevent duplicate key crash
      if (!graph.hasEdge(edge.id)) {
        graph.addEdgeWithKey(edge.id, edge.source, edge.target, {
          size: edge.size ?? 1,
          color: edge.color ?? "rgba(120,120,120,0.3)",
          baseColor: edge.color ?? "rgba(120,120,120,0.3)",
        });
      }
    });

    // 🔥 FORCE LAYOUT (IMPORTANT)
    forceAtlas2.assign(graph, {
      iterations: 80,
      settings: {
        gravity: 1,
        scalingRatio: 10,
        strongGravityMode: false,
      },
    });

    const sigma = new Sigma(graph, container, {
      renderLabels: true,
      labelDensity: 0.07,
      minCameraRatio: 0.1,
      maxCameraRatio: 10,
    });

    sigmaRef.current = sigma;

    // --- INTERACTIONS ---
    sigma.on("clickNode", ({ node }) => onSelectNode(node));
    sigma.on("clickStage", () => onSelectNode(null));

    sigma.on("enterNode", ({ node }) => setHoveredNodeId(node));
    sigma.on("leaveNode", () => setHoveredNodeId(null));

    sigma.on("downNode", ({ node }) => {
      draggedNodeRef.current = node;
      sigma.getCamera().disable();
    });

    window.addEventListener("pointermove", (e) => {
      if (!draggedNodeRef.current || !sigmaRef.current || !graphRef.current) return;

      const rect = container.getBoundingClientRect();
      const pos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      const graphPos = (sigmaRef.current as any).viewportToGraph(pos);

      graphRef.current.setNodeAttribute(draggedNodeRef.current, "x", graphPos.x);
      graphRef.current.setNodeAttribute(draggedNodeRef.current, "y", graphPos.y);

      sigmaRef.current.refresh();

      onNodePositionChange?.(draggedNodeRef.current, graphPos.x, graphPos.y);
    });

    window.addEventListener("pointerup", () => {
      draggedNodeRef.current = null;
      sigma.getCamera().enable();
    });

    sigma.refresh();

    return () => {
      sigma.kill();
      sigmaRef.current = null;
      graphRef.current = null;
      initializedRef.current = false;
    };
  }, [nodes, edges]);

  // --- VISUAL STATE ---
  useEffect(() => {
    const graph = graphRef.current;
    const sigma = sigmaRef.current;
    if (!graph || !sigma) return;

    const active = hoveredNodeId || selectedNodeId;

    graph.forEachNode((node) => {
      const attrs = graph.getNodeAttributes(node);
      const base = attrs.baseColor || "#4979ff";
      const size = attrs.baseSize || 6;

      if (node === selectedNodeId) {
        graph.setNodeAttribute(node, "size", size * 1.8);
      } else if (node === hoveredNodeId) {
        graph.setNodeAttribute(node, "size", size * 1.4);
      } else if (active) {
        graph.setNodeAttribute(node, "color", withAlpha(base, 0.2));
      } else {
        graph.setNodeAttribute(node, "color", base);
        graph.setNodeAttribute(node, "size", size);
      }
    });

    sigma.refresh();
  }, [hoveredNodeId, selectedNodeId]);

  // --- EMPTY STATE ---
  if (!nodes.length) {
    return (
      <div
        className="graph-canvas"
        style={{
          display: "grid",
          placeItems: "center",
          height: "100%",
          opacity: 0.6,
        }}
      >
        No graph data available
      </div>
    );
  }

  return <div ref={containerRef} className={className ?? "graph-canvas"} />;
}

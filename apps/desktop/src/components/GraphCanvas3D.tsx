// apps/desktop/src/components/GraphCanvas3D.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ForceGraph3D, {
  type ForceGraphMethods,
  type LinkObject,
  type NodeObject,
} from "react-force-graph-3d";
import SpriteText from "three-spritetext";
import * as THREE from "three";

export type Graph3DNode = {
  id: string;
  title?: string;
  type?: string;
  layer?: string;
  cluster?: string;
  tags?: string[];
  score?: number;
};

export type Graph3DLink = {
  source: string;
  target: string;
  weight?: number;
};

export type GraphCanvas3DProps = {
  nodes: Graph3DNode[];
  links: Graph3DLink[];
  className?: string;
  selectedNodeId?: string | null;
  onSelectNode?: (node: Graph3DNode | null) => void;
  onDoubleClickNode?: (node: Graph3DNode | null) => void;
  isFullscreen?: boolean;
  onEnterFullscreen?: () => void;
  onExitFullscreen?: () => void;
  pinnedNodeIds?: string[];
  highlightedNodeIds?: string[];
  highlightedEdgeKeys?: string[];
  bridgeNodeIds?: string[];
  isolatedNodeIds?: string[];
  denseGroupNodeIds?: string[];
  groupMode?: "none" | "tag" | "folder" | "layer" | "semantic" | "linkDensity";
  isNodePinned?: (nodeId: string) => boolean;
};

const NODE_BASE_COLOR = "#c9d5f0";
const NODE_SELECTED_COLOR = "#ffffff";
const NODE_HIGHLIGHT_COLOR = "#7dd3fc";
const NODE_BRIDGE_COLOR = "#f59e0b";
const NODE_ISOLATED_COLOR = "#fb7185";
const NODE_DENSE_COLOR = "#818cf8";
const NODE_PIN_COLOR = "#34d399";
const BG_TOP = "#0b1020";
const BG_BOTTOM = "#030712";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function edgeKey(source: string, target: string) {
  return source < target ? `${source}__${target}` : `${target}__${source}`;
}

function groupColor(mode: GraphCanvas3DProps["groupMode"], node: Graph3DNode) {
  if (!mode || mode === "none") return NODE_BASE_COLOR;

  switch (mode) {
    case "tag":
      return node.tags?.length ? "#60a5fa" : NODE_BASE_COLOR;
    case "folder":
      return node.cluster ? "#818cf8" : NODE_BASE_COLOR;
    case "layer":
      return node.layer === "code" ? "#34d399" : node.layer === "markdown" ? "#f59e0b" : NODE_BASE_COLOR;
    case "semantic":
      return "#c084fc";
    case "linkDensity":
      return (node.score ?? 0) > 0.7 ? "#22c55e" : (node.score ?? 0) > 0.35 ? "#f59e0b" : NODE_BASE_COLOR;
    default:
      return NODE_BASE_COLOR;
  }
}

function createCloudSprite(color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");

  if (!context) return null;

  const gradient = context.createRadialGradient(128, 128, 28, 128, 128, 128);
  gradient.addColorStop(0, `${color}44`);
  gradient.addColorStop(0.5, `${color}22`);
  gradient.addColorStop(1, `${color}00`);

  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(28, 28, 1);

  return sprite;
}

function createNodeObject(
  node: Graph3DNode,
  options: {
    isSelected: boolean;
    isPinned: boolean;
    isHighlighted: boolean;
    isBridge: boolean;
    isIsolated: boolean;
    isDense: boolean;
    groupMode?: GraphCanvas3DProps["groupMode"];
  },
) {
  const group = new THREE.Group();

  const color = options.isPinned
    ? NODE_PIN_COLOR
    : options.isSelected
      ? NODE_SELECTED_COLOR
      : options.isHighlighted
        ? NODE_HIGHLIGHT_COLOR
        : options.isBridge
          ? NODE_BRIDGE_COLOR
          : options.isIsolated
            ? NODE_ISOLATED_COLOR
            : options.isDense
              ? NODE_DENSE_COLOR
              : groupColor(options.groupMode, node);

  const size = options.isPinned ? 7.2 : options.isSelected ? 6.4 : options.isHighlighted ? 5.8 : 4.8;

  const sphereGeometry = new THREE.SphereGeometry(size, 22, 22);
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.96,
    roughness: 0.32,
    metalness: 0.08,
  });

  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  group.add(sphere);

  const glowGeometry = new THREE.SphereGeometry(size * 1.55, 20, 20);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: options.isSelected || options.isPinned ? 0.24 : 0.11,
    depthWrite: false,
  });

  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  group.add(glow);

  if (options.groupMode && options.groupMode !== "none") {
    const cloud = createCloudSprite(color);
    if (cloud) {
      cloud.position.set(0, 0, 0);
      group.add(cloud);
    }
  }

  const label = new SpriteText(node.title || node.id);
  label.color = "#e5eefc";
  label.textHeight = options.isSelected ? 7.2 : 5.4;
  label.padding = 2;
  label.backgroundColor = "rgba(3, 7, 18, 0.72)";
  label.borderRadius = 4;
  label.position.set(0, size + 7, 0);
  group.add(label);

  return group;
}

export default function GraphCanvas3D({
  nodes,
  links,
  className,
  selectedNodeId,
  onSelectNode,
  onDoubleClickNode,
  isFullscreen = false,
  onEnterFullscreen,
  onExitFullscreen,
  pinnedNodeIds = [],
  highlightedNodeIds = [],
  highlightedEdgeKeys = [],
  bridgeNodeIds = [],
  isolatedNodeIds = [],
  denseGroupNodeIds = [],
  groupMode = "none",
  isNodePinned,
}: GraphCanvas3DProps) {
  const graphRef = useRef<ForceGraphMethods<NodeObject<Graph3DNode>, LinkObject<Graph3DNode>> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastClickRef = useRef<{ nodeId: string; ts: number } | null>(null);

  const [dimensions, setDimensions] = useState({ width: 1200, height: 720 });
  const [isMounted, setIsMounted] = useState(false);

  const pinnedNodeSet = useMemo(() => new Set(pinnedNodeIds), [pinnedNodeIds]);
  const highlightedNodeSet = useMemo(() => new Set(highlightedNodeIds), [highlightedNodeIds]);
  const highlightedEdgeKeySet = useMemo(() => new Set(highlightedEdgeKeys), [highlightedEdgeKeys]);
  const bridgeNodeSet = useMemo(() => new Set(bridgeNodeIds), [bridgeNodeIds]);
  const isolatedNodeSet = useMemo(() => new Set(isolatedNodeIds), [isolatedNodeIds]);
  const denseNodeSet = useMemo(() => new Set(denseGroupNodeIds), [denseGroupNodeIds]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setDimensions({
        width: Math.max(320, Math.floor(rect.width)),
        height: Math.max(320, Math.floor(rect.height)),
      });
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onExitFullscreen?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen, onExitFullscreen]);

  const graphData = useMemo(
    () => ({
      nodes,
      links,
    }),
    [nodes, links],
  );

  const handleNodeClick = useCallback(
    (node: NodeObject<Graph3DNode>) => {
      const typedNode = node as Graph3DNode;
      const now = performance.now();
      const previous = lastClickRef.current;

      if (previous && previous.nodeId === typedNode.id && now - previous.ts < 320) {
        onDoubleClickNode?.(typedNode);
      } else {
        onSelectNode?.(typedNode);
      }

      lastClickRef.current = { nodeId: typedNode.id, ts: now };

      const distance = 132;
      const distRatio =
        1 + distance / Math.max(Math.hypot(node.x || 1, node.y || 1, node.z || 1), 1);

      graphRef.current?.cameraPosition(
        {
          x: (node.x || 0) * distRatio,
          y: (node.y || 0) * distRatio,
          z: (node.z || 0) * distRatio,
        },
        node,
        820,
      );
    },
    [onDoubleClickNode, onSelectNode],
  );

  const handleBackgroundClick = useCallback(() => {
    onSelectNode?.(null);
  }, [onSelectNode]);

  const nodeThreeObject = useCallback(
    (node: NodeObject<Graph3DNode>) => {
      const typedNode = node as Graph3DNode;
      const nodePinned = isNodePinned ? isNodePinned(typedNode.id) : pinnedNodeSet.has(typedNode.id);

      return createNodeObject(typedNode, {
        isSelected: typedNode.id === selectedNodeId,
        isPinned: nodePinned,
        isHighlighted: highlightedNodeSet.has(typedNode.id),
        isBridge: bridgeNodeSet.has(typedNode.id),
        isIsolated: isolatedNodeSet.has(typedNode.id),
        isDense: denseNodeSet.has(typedNode.id),
        groupMode,
      });
    },
    [
      bridgeNodeSet,
      denseNodeSet,
      groupMode,
      highlightedNodeSet,
      isolatedNodeSet,
      isNodePinned,
      pinnedNodeSet,
      selectedNodeId,
    ],
  );

  const linkColor = useCallback(
    (link: LinkObject<Graph3DNode>) => {
      const key = edgeKey(String(link.source), String(link.target));
      return highlightedEdgeKeySet.has(key) ? "#7dd3fc" : "rgba(148, 163, 184, 0.24)";
    },
    [highlightedEdgeKeySet],
  );

  const linkWidth = useCallback(
    (link: LinkObject<Graph3DNode>) => {
      const key = edgeKey(String(link.source), String(link.target));
      if (highlightedEdgeKeySet.has(key)) return 3.2;

      const typedLink = link as Graph3DLink;
      return typedLink.weight && typedLink.weight > 1 ? 1.5 : 0.75;
    },
    [highlightedEdgeKeySet],
  );

  const buttonBase =
    "inline-flex items-center justify-center rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full min-h-[420px] w-full overflow-hidden rounded-[22px] border border-white/10 bg-[#030712]",
        className,
      )}
      style={{
        background:
          `radial-gradient(circle at 20% 20%, rgba(59,130,246,0.10), transparent 28%),
           radial-gradient(circle at 80% 30%, rgba(125,211,252,0.08), transparent 24%),
           linear-gradient(180deg, ${BG_TOP} 0%, ${BG_BOTTOM} 100%)`,
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-3">
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            3D Research Graph
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {nodes.length} nodes · {links.length} links
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur text-[11px] uppercase tracking-[0.18em] text-slate-400">
          dbl-click isolate · path highlight · pin nodes
        </div>
      </div>

      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
        {!isFullscreen ? (
          <button
            type="button"
            onClick={onEnterFullscreen}
            className={buttonBase}
            aria-label="Open fullscreen graph"
          >
            Fullscreen
          </button>
        ) : null}

        {isFullscreen ? (
          <button
            type="button"
            onClick={onExitFullscreen}
            className={buttonBase}
            aria-label="Close fullscreen graph"
          >
            Close
          </button>
        ) : null}
      </div>

      {isMounted ? (
        <ForceGraph3D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor="#030712"
          nodeThreeObject={nodeThreeObject}
          nodeThreeObjectExtend={false}
          linkColor={linkColor}
          linkWidth={linkWidth}
          linkOpacity={0.34}
          linkDirectionalParticles={(link) => {
            const key = edgeKey(String(link.source), String(link.target));
            return highlightedEdgeKeySet.has(key) ? 4 : 0;
          }}
          linkDirectionalParticleWidth={(link) => {
            const key = edgeKey(String(link.source), String(link.target));
            return highlightedEdgeKeySet.has(key) ? 2.4 : 0;
          }}
          enableNodeDrag={false}
          enablePointerInteraction
          controlType="orbit"
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
          cooldownTicks={80}
          onEngineStop={() => {
            graphRef.current?.zoomToFit(450, 40);
          }}
          rendererConfig={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
        />
      ) : null}
    </div>
  );
}

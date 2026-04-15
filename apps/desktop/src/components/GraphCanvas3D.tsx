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

type NodeRenderRefs = {
  root: THREE.Group;
  sphere: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  glow: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  halo?: THREE.Sprite;
  ring?: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  pulse?: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  label: SpriteText;
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

const CAMERA_DISTANCE = 132;
const DOUBLE_CLICK_MS = 320;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function edgeKey(source: string, target: string) {
  return source < target ? `${source}__${target}` : `${target}__${source}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getNodeDisplayColor(
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
  if (options.isPinned) return NODE_PIN_COLOR;
  if (options.isSelected) return NODE_SELECTED_COLOR;
  if (options.isHighlighted) return NODE_HIGHLIGHT_COLOR;
  if (options.isBridge) return NODE_BRIDGE_COLOR;
  if (options.isIsolated) return NODE_ISOLATED_COLOR;
  if (options.isDense) return NODE_DENSE_COLOR;
  return groupColor(options.groupMode, node);
}

function getNodeSize(options: {
  isSelected: boolean;
  isPinned: boolean;
  isHighlighted: boolean;
  isBridge: boolean;
  isDense: boolean;
}) {
  if (options.isPinned) return 7.4;
  if (options.isSelected) return 6.6;
  if (options.isHighlighted) return 6.0;
  if (options.isBridge) return 5.7;
  if (options.isDense) return 5.5;
  return 4.9;
}

function groupColor(mode: GraphCanvas3DProps["groupMode"], node: Graph3DNode) {
  if (!mode || mode === "none") return NODE_BASE_COLOR;

  switch (mode) {
    case "tag":
      return node.tags?.length ? "#60a5fa" : NODE_BASE_COLOR;
    case "folder":
      return node.cluster ? "#818cf8" : NODE_BASE_COLOR;
    case "layer":
      return node.layer === "code"
        ? "#34d399"
        : node.layer === "markdown"
          ? "#f59e0b"
          : NODE_BASE_COLOR;
    case "semantic":
      return "#c084fc";
    case "linkDensity":
      return (node.score ?? 0) > 0.7
        ? "#22c55e"
        : (node.score ?? 0) > 0.35
          ? "#f59e0b"
          : NODE_BASE_COLOR;
    default:
      return NODE_BASE_COLOR;
  }
}

function createSoftSprite(color: string, size = 256, opacityScale = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (!context) return null;

  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.1,
    size / 2,
    size / 2,
    size / 2,
  );

  gradient.addColorStop(0, `${color}${Math.round(60 * opacityScale).toString(16).padStart(2, "0")}`);
  gradient.addColorStop(0.45, `${color}${Math.round(26 * opacityScale).toString(16).padStart(2, "0")}`);
  gradient.addColorStop(1, `${color}00`);

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  return new THREE.Sprite(material);
}

function createRing(color: string, radius: number) {
  const geometry = new THREE.TorusGeometry(radius, 0.17, 12, 48);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = Math.PI / 2.25;
  return ring;
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
    isHovered: boolean;
    groupMode?: GraphCanvas3DProps["groupMode"];
  },
): NodeRenderRefs {
  const root = new THREE.Group();
  const color = getNodeDisplayColor(node, options);
  const baseSize = getNodeSize(options);
  const interactiveBoost = options.isHovered ? 0.55 : 0;
  const size = baseSize + interactiveBoost;

  const sphereGeometry = new THREE.SphereGeometry(size, 24, 24);
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: options.isHovered ? 1 : 0.97,
    roughness: options.isSelected ? 0.18 : 0.3,
    metalness: options.isSelected || options.isPinned ? 0.16 : 0.08,
    emissive: new THREE.Color(color),
    emissiveIntensity: options.isSelected ? 0.18 : options.isHovered ? 0.14 : 0.08,
  });

  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  root.add(sphere);

  const glowGeometry = new THREE.SphereGeometry(size * (options.isHovered ? 1.82 : 1.62), 20, 20);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity:
      options.isSelected || options.isPinned
        ? 0.28
        : options.isHovered
          ? 0.2
          : 0.11,
    depthWrite: false,
  });

  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  root.add(glow);

  const pulseGeometry = new THREE.SphereGeometry(size * 1.16, 18, 18);
  const pulseMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: options.isHovered ? 0.12 : 0.06,
    depthWrite: false,
  });

  const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
  root.add(pulse);

  let halo: THREE.Sprite | undefined;
  if (options.groupMode !== "none" || options.isHovered || options.isSelected) {
    halo = createSoftSprite(color, 256, options.isHovered || options.isSelected ? 1.18 : 0.82) ?? undefined;
    if (halo) {
      halo.scale.set(size * 5.9, size * 5.9, 1);
      halo.material.opacity = options.isHovered || options.isSelected ? 0.34 : 0.18;
      root.add(halo);
    }
  }

  let ring: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> | undefined;
  if (options.isPinned || options.isSelected || options.isHovered) {
    ring = createRing(color, size * 1.7);
    root.add(ring);
  }

  const label = new SpriteText(node.title || node.id);
  label.color = options.isSelected ? "#ffffff" : "#e5eefc";
  label.textHeight = options.isSelected ? 7.5 : options.isHovered ? 6.5 : 5.5;
  label.padding = 2.2;
  label.backgroundColor = options.isHovered
    ? "rgba(3, 7, 18, 0.84)"
    : "rgba(3, 7, 18, 0.72)";
  label.borderRadius = 5;
  label.position.set(0, size + 7.8, 0);
  root.add(label);

  root.userData = {
    nodeId: node.id,
    baseSize,
    color,
    refs: {
      root,
      sphere,
      glow,
      halo,
      ring,
      pulse,
      label,
    } satisfies NodeRenderRefs,
  };

  return {
    root,
    sphere,
    glow,
    halo,
    ring,
    pulse,
    label,
  };
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
  const graphRef =
    useRef<ForceGraphMethods<NodeObject<Graph3DNode>, LinkObject<Graph3DNode>>>();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastClickRef = useRef<{ nodeId: string; ts: number } | null>(null);
  const animatedObjectsRef = useRef<Map<string, NodeRenderRefs>>(new Map());

  const [dimensions, setDimensions] = useState({ width: 1200, height: 720 });
  const [isMounted, setIsMounted] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredLinkKey, setHoveredLinkKey] = useState<string | null>(null);
  const [cameraAutoFitDone, setCameraAutoFitDone] = useState(false);

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

  useEffect(() => {
    animatedObjectsRef.current.clear();
    setCameraAutoFitDone(false);
  }, [nodes, links, groupMode]);

  const graphData = useMemo(
    () => ({
      nodes,
      links,
    }),
    [nodes, links],
  );

  const focusNode = useCallback((node: NodeObject<Graph3DNode>) => {
    const distance = CAMERA_DISTANCE;
    const distRatio =
      1 +
      distance /
        Math.max(
          Math.hypot(node.x || 1, node.y || 1, node.z || 1),
          1,
        );

    graphRef.current?.cameraPosition(
      {
        x: (node.x || 0) * distRatio,
        y: (node.y || 0) * distRatio,
        z: (node.z || 0) * distRatio,
      },
      node,
      820,
    );
  }, []);

  const handleNodeClick = useCallback(
    (node: NodeObject<Graph3DNode>) => {
      const typedNode = node as Graph3DNode;
      const now = performance.now();
      const previous = lastClickRef.current;

      if (
        previous &&
        previous.nodeId === typedNode.id &&
        now - previous.ts < DOUBLE_CLICK_MS
      ) {
        onDoubleClickNode?.(typedNode);
      } else {
        onSelectNode?.(typedNode);
      }

      lastClickRef.current = { nodeId: typedNode.id, ts: now };
      focusNode(node);
    },
    [focusNode, onDoubleClickNode, onSelectNode],
  );

  const handleBackgroundClick = useCallback(() => {
    onSelectNode?.(null);
  }, [onSelectNode]);

  const handleNodeHover = useCallback((node?: NodeObject<Graph3DNode> | null) => {
    setHoveredNodeId(node ? (node as Graph3DNode).id : null);
  }, []);

  const handleLinkHover = useCallback((link?: LinkObject<Graph3DNode> | null) => {
    if (!link) {
      setHoveredLinkKey(null);
      return;
    }

    const source =
      typeof link.source === "object"
        ? String((link.source as Graph3DNode).id)
        : String(link.source);

    const target =
      typeof link.target === "object"
        ? String((link.target as Graph3DNode).id)
        : String(link.target);

    setHoveredLinkKey(edgeKey(source, target));
  }, []);

  const registerNodeObject = useCallback((nodeId: string, refs: NodeRenderRefs) => {
    animatedObjectsRef.current.set(nodeId, refs);
  }, []);

  const nodeThreeObject = useCallback(
    (node: NodeObject<Graph3DNode>) => {
      const typedNode = node as Graph3DNode;
      const nodePinned = isNodePinned
        ? isNodePinned(typedNode.id)
        : pinnedNodeSet.has(typedNode.id);

      const refs = createNodeObject(typedNode, {
        isSelected: typedNode.id === selectedNodeId,
        isPinned: nodePinned,
        isHighlighted: highlightedNodeSet.has(typedNode.id),
        isBridge: bridgeNodeSet.has(typedNode.id),
        isIsolated: isolatedNodeSet.has(typedNode.id),
        isDense: denseNodeSet.has(typedNode.id),
        isHovered: typedNode.id === hoveredNodeId,
        groupMode,
      });

      registerNodeObject(typedNode.id, refs);
      return refs.root;
    },
    [
      bridgeNodeSet,
      denseNodeSet,
      groupMode,
      highlightedNodeSet,
      hoveredNodeId,
      isolatedNodeSet,
      isNodePinned,
      pinnedNodeSet,
      registerNodeObject,
      selectedNodeId,
    ],
  );

  const linkColor = useCallback(
    (link: LinkObject<Graph3DNode>) => {
      const source =
        typeof link.source === "object"
          ? String((link.source as Graph3DNode).id)
          : String(link.source);
      const target =
        typeof link.target === "object"
          ? String((link.target as Graph3DNode).id)
          : String(link.target);

      const key = edgeKey(source, target);

      if (hoveredLinkKey === key) return "#ffffff";
      if (highlightedEdgeKeySet.has(key)) return "#7dd3fc";
      if (hoveredNodeId && (source === hoveredNodeId || target === hoveredNodeId)) {
        return "rgba(255,255,255,0.45)";
      }

      return "rgba(148, 163, 184, 0.22)";
    },
    [highlightedEdgeKeySet, hoveredLinkKey, hoveredNodeId],
  );

  const linkWidth = useCallback(
    (link: LinkObject<Graph3DNode>) => {
      const source =
        typeof link.source === "object"
          ? String((link.source as Graph3DNode).id)
          : String(link.source);
      const target =
        typeof link.target === "object"
          ? String((link.target as Graph3DNode).id)
          : String(link.target);

      const key = edgeKey(source, target);

      if (hoveredLinkKey === key) return 4.2;
      if (highlightedEdgeKeySet.has(key)) return 3.2;
      if (hoveredNodeId && (source === hoveredNodeId || target === hoveredNodeId)) {
        return 2.2;
      }

      const typedLink = link as Graph3DLink;
      return typedLink.weight && typedLink.weight > 1 ? 1.5 : 0.8;
    },
    [highlightedEdgeKeySet, hoveredLinkKey, hoveredNodeId],
  );

  const linkDirectionalParticles = useCallback(
    (link: LinkObject<Graph3DNode>) => {
      const source =
        typeof link.source === "object"
          ? String((link.source as Graph3DNode).id)
          : String(link.source);
      const target =
        typeof link.target === "object"
          ? String((link.target as Graph3DNode).id)
          : String(link.target);

      const key = edgeKey(source, target);

      if (hoveredLinkKey === key) return 6;
      if (highlightedEdgeKeySet.has(key)) return 4;
      if (hoveredNodeId && (source === hoveredNodeId || target === hoveredNodeId)) {
        return 2;
      }

      return 0;
    },
    [highlightedEdgeKeySet, hoveredLinkKey, hoveredNodeId],
  );

  const linkDirectionalParticleWidth = useCallback(
    (link: LinkObject<Graph3DNode>) => {
      const source =
        typeof link.source === "object"
          ? String((link.source as Graph3DNode).id)
          : String(link.source);
      const target =
        typeof link.target === "object"
          ? String((link.target as Graph3DNode).id)
          : String(link.target);

      const key = edgeKey(source, target);

      if (hoveredLinkKey === key) return 3.4;
      if (highlightedEdgeKeySet.has(key)) return 2.4;
      if (hoveredNodeId && (source === hoveredNodeId || target === hoveredNodeId)) {
        return 1.6;
      }

      return 0;
    },
    [highlightedEdgeKeySet, hoveredLinkKey, hoveredNodeId],
  );

  useEffect(() => {
    if (!graphRef.current) return;

    const controls = graphRef.current.controls?.();
    if (!controls) return;

    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.72;
    controls.zoomSpeed = 0.9;
    controls.panSpeed = 0.72;
    controls.minDistance = 42;
    controls.maxDistance = 1500;
    controls.autoRotate = !selectedNodeId && !hoveredNodeId;
    controls.autoRotateSpeed = 0.32;
  }, [hoveredNodeId, selectedNodeId]);

  useEffect(() => {
    if (!graphRef.current) return;

    const scene = graphRef.current.scene();
    if (!scene) return;

    const ambient = new THREE.AmbientLight(0xbfd7ff, 1.08);
    ambient.name = "graph-ambient-light";

    const topLight = new THREE.PointLight(0x7dd3fc, 1.24, 1200, 2);
    topLight.position.set(180, 220, 180);
    topLight.name = "graph-top-light";

    const rimLight = new THREE.PointLight(0x818cf8, 0.82, 1400, 2);
    rimLight.position.set(-220, -140, -240);
    rimLight.name = "graph-rim-light";

    const warmLight = new THREE.PointLight(0xf59e0b, 0.32, 900, 2);
    warmLight.position.set(0, 80, 260);
    warmLight.name = "graph-warm-light";

    const existingAmbient = scene.getObjectByName("graph-ambient-light");
    const existingTop = scene.getObjectByName("graph-top-light");
    const existingRim = scene.getObjectByName("graph-rim-light");
    const existingWarm = scene.getObjectByName("graph-warm-light");

    if (!existingAmbient) scene.add(ambient);
    if (!existingTop) scene.add(topLight);
    if (!existingRim) scene.add(rimLight);
    if (!existingWarm) scene.add(warmLight);

    return () => {
      const names = [
        "graph-ambient-light",
        "graph-top-light",
        "graph-rim-light",
        "graph-warm-light",
      ];

      for (const name of names) {
        const object = scene.getObjectByName(name);
        if (object) scene.remove(object);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMounted || !graphRef.current) return;

    let raf = 0;

    const animate = () => {
      const time = performance.now() * 0.001;

      animatedObjectsRef.current.forEach((refs, nodeId) => {
        const hovered = nodeId === hoveredNodeId;
        const selected = nodeId === selectedNodeId;
        const emphasis = selected ? 1 : hovered ? 0.72 : 0.34;

        refs.root.rotation.y += hovered ? 0.008 : 0.0035;

        refs.glow.scale.setScalar(1 + Math.sin(time * (hovered ? 3.2 : 1.6)) * 0.045 * (1 + emphasis));
        refs.glow.material.opacity = clamp(
          (selected ? 0.28 : hovered ? 0.2 : 0.11) +
            Math.sin(time * (hovered ? 3.8 : 2.2)) * 0.025,
          0.06,
          0.36,
        );

        if (refs.pulse) {
          const pulseScale = 1 + (Math.sin(time * (hovered ? 4.6 : 2.6)) + 1) * 0.07 * (hovered ? 1.35 : 0.7);
          refs.pulse.scale.setScalar(pulseScale);
          refs.pulse.material.opacity = clamp(
            hovered ? 0.12 + Math.sin(time * 4.2) * 0.025 : 0.045,
            0.02,
            0.18,
          );
        }

        if (refs.halo) {
          refs.halo.material.opacity = clamp(
            (hovered ? 0.34 : selected ? 0.28 : 0.18) + Math.sin(time * 1.8) * 0.02,
            0.08,
            0.42,
          );
        }

        if (refs.ring) {
          refs.ring.rotation.z += hovered ? 0.012 : 0.0045;
          refs.ring.material.opacity = clamp(
            hovered ? 0.42 : selected ? 0.34 : 0.26,
            0.18,
            0.5,
          );
        }

        refs.label.color = selected ? "#ffffff" : hovered ? "#f8fbff" : "#e5eefc";
      });

      raf = window.requestAnimationFrame(animate);
    };

    raf = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [hoveredNodeId, isMounted, selectedNodeId]);

  const buttonBase =
    "inline-flex items-center justify-center rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-medium text-white backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-[0_18px_36px_rgba(0,0,0,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

  const interactionHint = hoveredNodeId
    ? `focused: ${hoveredNodeId}`
    : hoveredLinkKey
      ? "link focus"
      : "orbit · hover · dbl-click";

  return (
    <div
      ref={containerRef}
      className={cn(
        "graph-canvas-3d relative h-full min-h-[420px] w-full overflow-hidden rounded-[22px] border border-white/10 bg-[#030712]",
        isFullscreen && "graph-canvas-3d--fullscreen",
        className,
      )}
      style={{
        background: `radial-gradient(circle at 20% 20%, rgba(59,130,246,0.10), transparent 28%),
          radial-gradient(circle at 80% 30%, rgba(125,211,252,0.08), transparent 24%),
          radial-gradient(circle at 50% 100%, rgba(129,140,248,0.06), transparent 28%),
          linear-gradient(180deg, ${BG_TOP} 0%, ${BG_BOTTOM} 100%)`,
      }}
      data-hovering-node={hoveredNodeId ? "true" : "false"}
      data-fullscreen={isFullscreen ? "true" : "false"}
    >
      <div className="graph-canvas-3d__ambient-lines" aria-hidden="true" />
      <div className="graph-canvas-3d__scanline" aria-hidden="true" />
      <div className="graph-canvas-3d__vignette" aria-hidden="true" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3">
        <div className="graph-canvas-3d__meta-card rounded-xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            3D Research Graph
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {nodes.length} nodes · {links.length} links
          </p>
        </div>

        <div className="graph-canvas-3d__meta-card rounded-xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur text-[11px] uppercase tracking-[0.18em] text-slate-400">
          {interactionHint}
        </div>
      </div>

      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
        {groupMode !== "none" ? (
          <div className="pointer-events-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-slate-300 backdrop-blur">
            Group mode · {groupMode}
          </div>
        ) : null}

        {selectedNodeId ? (
          <div className="pointer-events-none rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-cyan-100 backdrop-blur">
            Selected · {selectedNodeId}
          </div>
        ) : null}
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
          linkDirectionalParticles={linkDirectionalParticles}
          linkDirectionalParticleWidth={linkDirectionalParticleWidth}
          linkDirectionalParticleColor={(link) => {
            const source =
              typeof link.source === "object"
                ? String((link.source as Graph3DNode).id)
                : String(link.source);
            const target =
              typeof link.target === "object"
                ? String((link.target as Graph3DNode).id)
                : String(link.target);

            const key = edgeKey(source, target);

            if (hoveredLinkKey === key) return "#ffffff";
            if (highlightedEdgeKeySet.has(key)) return "#7dd3fc";
            return "#93c5fd";
          }}
          linkCurvature={(link) => {
            const source =
              typeof link.source === "object"
                ? String((link.source as Graph3DNode).id)
                : String(link.source);
            const target =
              typeof link.target === "object"
                ? String((link.target as Graph3DNode).id)
                : String(link.target);

            const key = edgeKey(source, target);

            if (hoveredLinkKey === key) return 0.12;
            if (highlightedEdgeKeySet.has(key)) return 0.07;
            return 0.02;
          }}
          linkResolution={10}
          enableNodeDrag={false}
          enablePointerInteraction
          controlType="orbit"
          showNavInfo={false}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onLinkHover={handleLinkHover}
          onBackgroundClick={handleBackgroundClick}
          cooldownTicks={92}
          d3AlphaDecay={0.028}
          d3VelocityDecay={0.24}
          onEngineStop={() => {
            if (!cameraAutoFitDone) {
              graphRef.current?.zoomToFit(520, 42);
              setCameraAutoFitDone(true);
            }
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

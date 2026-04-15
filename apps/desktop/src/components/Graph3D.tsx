import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line, Stars } from "@react-three/drei";
import * as THREE from "three";
import { forceSimulation, forceLink, forceManyBody, forceCenter } from "d3-force-3d";

type GraphNode = {
  id: string;
  title?: string;
  type?: string;
  layer?: string;
  cluster?: string;
  tags?: string[];
  score?: number;
};

type GraphEdge = {
  source: string;
  target: string;
  weight?: number;
};

type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type LayoutNode = GraphNode & {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
};

function colorForNode(node: GraphNode): string {
  const cluster = (node.cluster || "").toLowerCase();
  const layer = (node.layer || "").toLowerCase();

  if (cluster.includes("identity")) return "#8ab4ff";
  if (cluster.includes("system")) return "#66e3c4";
  if (cluster.includes("strategy")) return "#c6a0ff";
  if (cluster.includes("output")) return "#ffb86b";

  if (layer === "core") return "#8ab4ff";
  if (layer === "knowledge") return "#66e3c4";
  if (layer === "meta") return "#c6a0ff";
  if (layer === "output") return "#ffb86b";

  return "#d7e3ff";
}

function runLayout(graph: GraphData) {
  const nodes = graph.nodes.map((node) => ({ ...node })) as Array<GraphNode & { x?: number; y?: number; z?: number }>;
  const links = graph.edges.map((edge) => ({ ...edge }));

  const simulation = forceSimulation(nodes as never)
    .numDimensions(3)
    .force("charge", forceManyBody().strength(-38))
    .force("center", forceCenter(0, 0, 0))
    .force(
      "link",
      forceLink(links)
        .id((d: { id: string }) => d.id)
        .distance((edge: { weight?: number }) => (edge.weight && edge.weight > 0.5 ? 8 : 11))
        .strength(0.18)
    );

  for (let i = 0; i < 220; i += 1) {
    simulation.tick();
  }

  simulation.stop();

  const laidOutNodes: LayoutNode[] = nodes.map((node) => ({
    ...node,
    x: node.x ?? 0,
    y: node.y ?? 0,
    z: node.z ?? 0,
    size: 0.9 + ((node.score || 0) > 0 ? Math.min((node.score || 0) * 0.08, 1.4) : 0),
    color: colorForNode(node),
  }));

  return {
    nodes: laidOutNodes,
    edges: graph.edges,
  };
}

function NodeMesh({
  node,
  active,
  onSelect,
}: {
  node: LayoutNode;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.position.y = node.y + Math.sin(t * 1.1 + node.x * 0.2) * 0.08;
    }

    if (haloRef.current) {
      const pulse = active ? 1 + Math.sin(t * 2.4) * 0.12 : 0.92 + Math.sin(t * 1.35) * 0.04;
      haloRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef} position={[node.x, node.y, node.z]} onClick={() => onSelect(node.id)}>
      <mesh ref={haloRef}>
        <sphereGeometry args={[node.size + 0.75, 24, 24]} />
        <meshBasicMaterial color={active ? "#b4f0ff" : node.color} transparent opacity={active ? 0.18 : 0.08} />
      </mesh>

      <mesh>
        <sphereGeometry args={[active ? node.size + 0.22 : node.size, 24, 24]} />
        <meshStandardMaterial
          color={active ? "#ffffff" : node.color}
          emissive={node.color}
          emissiveIntensity={active ? 0.72 : 0.24}
          roughness={0.26}
          metalness={0.34}
        />
      </mesh>

      <Text
        position={[0, node.size + 1.1, 0]}
        fontSize={0.62}
        color="#e9f1ff"
        anchorX="center"
        anchorY="middle"
        maxWidth={11}
      >
        {node.title || node.id}
      </Text>
    </group>
  );
}

function EdgeLines({
  nodes,
  edges,
}: {
  nodes: LayoutNode[];
  edges: GraphEdge[];
}) {
  const map = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  return (
    <>
      {edges.map((edge, index) => {
        const source = map.get(edge.source);
        const target = map.get(edge.target);
        if (!source || !target) return null;

        return (
          <Line
            key={`${edge.source}-${edge.target}-${index}`}
            points={[
              [source.x, source.y, source.z],
              [target.x, target.y, target.z],
            ]}
            color="#8ab4ff"
            lineWidth={edge.weight && edge.weight > 0.5 ? 1.1 : 0.55}
            transparent
            opacity={0.3}
          />
        );
      })}
    </>
  );
}

export function Graph3D({
  graph,
  selectedNodeId,
  setSelectedNodeId,
}: {
  graph: GraphData;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string) => void;
}) {
  const layout = useMemo(() => runLayout(graph), [graph]);

  useEffect(() => {
    if (!selectedNodeId && layout.nodes[0]) {
      setSelectedNodeId(layout.nodes[0].id);
    }
  }, [layout.nodes, selectedNodeId, setSelectedNodeId]);

  return (
    <div className="graph-panel graph-panel--3d">
      <Canvas camera={{ position: [0, 0, 36], fov: 52 }}>
        <color attach="background" args={["#08111f"]} />
        <fog attach="fog" args={["#08111f", 34, 88]} />
        <ambientLight intensity={1.08} />
        <directionalLight position={[12, 8, 10]} intensity={1.2} />
        <pointLight position={[-12, -8, 14]} intensity={1.1} color="#7dd3fc" />
        <Stars radius={120} depth={60} count={1400} factor={3.2} saturation={0} fade speed={0.22} />

        <EdgeLines nodes={layout.nodes} edges={layout.edges} />

        {layout.nodes.map((node) => (
          <NodeMesh
            key={node.id}
            node={node}
            active={selectedNodeId === node.id}
            onSelect={setSelectedNodeId}
          />
        ))}

        <OrbitControls enableDamping dampingFactor={0.08} autoRotate autoRotateSpeed={0.35} />
      </Canvas>
    </div>
  );
}

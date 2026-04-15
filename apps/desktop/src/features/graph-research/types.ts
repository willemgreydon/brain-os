// apps/desktop/src/features/graph-research/types.ts
export type ResearchNodeGroupMode =
  | "none"
  | "tag"
  | "folder"
  | "layer"
  | "semantic"
  | "linkDensity";

export type ResearchNeighborhoodDepth = 1 | 2 | "full";

export type ResearchNode = {
  id: string;
  title: string;
  folder?: string;
  layer?: string;
  tags: string[];
  score?: number;
  cluster?: string;
  semanticGroup?: string;
};

export type ResearchLink = {
  source: string;
  target: string;
  weight?: number;
};

export type ResearchGraph = {
  nodes: ResearchNode[];
  links: ResearchLink[];
};

export type StructuralInsightCard =
  | {
      id: string;
      type: "strong_cluster";
      title: string;
      body: string;
      nodeIds: string[];
      severity: "low" | "medium" | "high";
    }
  | {
      id: string;
      type: "weak_bridge";
      title: string;
      body: string;
      nodeIds: string[];
      severity: "medium" | "high";
    }
  | {
      id: string;
      type: "isolated_concept";
      title: string;
      body: string;
      nodeIds: string[];
      severity: "medium" | "high";
    }
  | {
      id: string;
      type: "recommended_link";
      title: string;
      body: string;
      nodeIds: string[];
      severity: "medium";
    }
  | {
      id: string;
      type: "likely_duplicate";
      title: string;
      body: string;
      nodeIds: string[];
      severity: "low" | "medium";
    }
  | {
      id: string;
      type: "tension_zone";
      title: string;
      body: string;
      nodeIds: string[];
      severity: "medium" | "high";
    };

export type Viewpoint = {
  id: string;
  label: string;
  camera: {
    x: number;
    y: number;
    z: number;
  };
  targetNodeId?: string | null;
  neighborhoodDepth: ResearchNeighborhoodDepth;
  groupMode: ResearchNodeGroupMode;
};

export type OrientationState = {
  azimuth: number;
  polar: number;
};

export type ResearchPanelState = {
  isolatedRootId: string | null;
  neighborhoodDepth: ResearchNeighborhoodDepth;
  pinnedNodeIds: string[];
  pathSelection: {
    fromId: string | null;
    toId: string | null;
    highlightedNodeIds: string[];
    highlightedEdgeKeys: string[];
  };
  groupMode: ResearchNodeGroupMode;
  selectedNodeId: string | null;
  savedViewpoints: Viewpoint[];
  orientation: OrientationState;
  timelineIndex: number;
};

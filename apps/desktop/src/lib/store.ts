// lib/store.ts
import { create } from "zustand";
import type { GraphData } from "@brain/graph-core";
import type { KnowledgeGap } from "@brain/ai-gap-engine";

export type GraphMode = "3d" | "focus" | "cluster";
export type ViewMode = "graph" | "content" | "split";
export type GraphLayerMode =
  | "semantic"
  | "filesystem"
  | "code"
  | "hybrid"
  | "temporal";

type VaultState = {
  vaultPath: string | null;
  source: "sample" | "vault";
  noteCount: number;
  lastUpdatedAt: string | null;
};

type AppState = {
  selectedNodeId: string | null;
  graphMode: GraphMode;
  viewMode: ViewMode;
  graphLayerMode: GraphLayerMode;
  accessibilityMode: boolean;
  graph: GraphData | null;
  gaps: KnowledgeGap[];
  vault: VaultState;
  sessionActivityIds: string[];

  setSelectedNodeId: (id: string | null) => void;
  setGraphMode: (mode: GraphMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setGraphLayerMode: (mode: GraphLayerMode) => void;
  toggleAccessibilityMode: () => void;
  recordSessionNodeActivity: (id: string) => void;

  setGraphPayload: (payload: {
    graph: GraphData;
    gaps: KnowledgeGap[];
    vaultPath: string | null;
    source: "sample" | "vault";
    noteCount: number;
    lastUpdatedAt: string;
  }) => void;
};

function dedupeRecent(ids: string[], nextId: string) {
  return [nextId, ...ids.filter((id) => id !== nextId)].slice(0, 40);
}

export const useAppStore = create<AppState>((set) => ({
  selectedNodeId: null,
  graphMode: "3d",
  viewMode: "graph",
  graphLayerMode: "semantic",
  accessibilityMode: false,
  graph: null,
  gaps: [],
  sessionActivityIds: [],
  vault: {
    vaultPath: null,
    source: "sample",
    noteCount: 0,
    lastUpdatedAt: null,
  },

  setSelectedNodeId: (selectedNodeId) =>
    set((state) => ({
      selectedNodeId,
      sessionActivityIds: selectedNodeId
        ? dedupeRecent(state.sessionActivityIds, selectedNodeId)
        : state.sessionActivityIds,
    })),

  setGraphMode: (graphMode) => set({ graphMode }),
  setViewMode: (viewMode) => set({ viewMode }),
  setGraphLayerMode: (graphLayerMode) => set({ graphLayerMode }),

  toggleAccessibilityMode: () =>
    set((state) => ({
      accessibilityMode: !state.accessibilityMode,
    })),

  recordSessionNodeActivity: (id) =>
    set((state) => ({
      sessionActivityIds: dedupeRecent(state.sessionActivityIds, id),
    })),

  setGraphPayload: (payload) =>
    set({
      graph: payload.graph,
      gaps: payload.gaps,
      vault: {
        vaultPath: payload.vaultPath,
        source: payload.source,
        noteCount: payload.noteCount,
        lastUpdatedAt: payload.lastUpdatedAt,
      },
      selectedNodeId: payload.graph.nodes[0]?.id ?? null,
      sessionActivityIds: payload.graph.nodes[0]?.id
        ? [payload.graph.nodes[0].id]
        : [],
    }),
}));

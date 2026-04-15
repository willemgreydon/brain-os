import { create } from "zustand";
import type { GraphData } from "@brain/graph-core";
import type { KnowledgeGap } from "@brain/ai-gap-engine";

type GraphMode = "3d" | "focus" | "cluster";

type VaultState = {
  vaultPath: string | null;
  source: "sample" | "vault";
  noteCount: number;
  lastUpdatedAt: string | null;
};

type AppState = {
  selectedNodeId: string | null;
  graphMode: GraphMode;
  accessibilityMode: boolean;
  graph: GraphData | null;
  gaps: KnowledgeGap[];
  vault: VaultState;
  setSelectedNodeId: (id: string | null) => void;
  setGraphMode: (mode: GraphMode) => void;
  toggleAccessibilityMode: () => void;
  setGraphPayload: (payload: { graph: GraphData; gaps: KnowledgeGap[]; vaultPath: string | null; source: "sample" | "vault"; noteCount: number; lastUpdatedAt: string }) => void;
};

export const useAppStore = create<AppState>((set) => ({
  selectedNodeId: null,
  graphMode: "3d",
  accessibilityMode: false,
  graph: null,
  gaps: [],
  vault: {
    vaultPath: null,
    source: "sample",
    noteCount: 0,
    lastUpdatedAt: null
  },
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setGraphMode: (graphMode) => set({ graphMode }),
  toggleAccessibilityMode: () => set((state) => ({ accessibilityMode: !state.accessibilityMode })),
  setGraphPayload: (payload) => set({
    graph: payload.graph,
    gaps: payload.gaps,
    vault: {
      vaultPath: payload.vaultPath,
      source: payload.source,
      noteCount: payload.noteCount,
      lastUpdatedAt: payload.lastUpdatedAt
    },
    selectedNodeId: payload.graph.nodes[0]?.id ?? null
  })
}));

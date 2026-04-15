import { create } from "zustand";
import type { WorkspaceMode } from "../../lib/app-shell";
import type {
  CameraPosition,
  GraphFilters,
  PersistedGraphPosition,
  PersistedWorkspaceState,
  WorkspaceStore,
} from "./types";

const DEFAULT_CAMERA_POSITION: CameraPosition = {
  x: 0,
  y: 0,
  zoom: 1,
};

const DEFAULT_GRAPH_FILTERS: GraphFilters = {
  query: "",
  activeTag: null,
  activeLayer: "all",
  kinds: [],
  tags: [],
  showArchived: false,
};

export const DEFAULT_PERSISTED_WORKSPACE_STATE: PersistedWorkspaceState = {
  mode: "split",
  leftRailOpen: true,
  rightRailOpen: true,
  graphFullscreen: false,
  selectedPath: null,
  expandedFolders: [],
  graphFilters: DEFAULT_GRAPH_FILTERS,
  cameraPosition: DEFAULT_CAMERA_POSITION,
  positions: {},
};

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function sanitizeMode(value: unknown): WorkspaceMode {
  return value === "graph" || value === "content" || value === "split"
    ? value
    : DEFAULT_PERSISTED_WORKSPACE_STATE.mode;
}

function sanitizeCameraPosition(value?: Partial<CameraPosition> | null): CameraPosition {
  return {
    x: typeof value?.x === "number" ? value.x : DEFAULT_CAMERA_POSITION.x,
    y: typeof value?.y === "number" ? value.y : DEFAULT_CAMERA_POSITION.y,
    zoom:
      typeof value?.zoom === "number" && Number.isFinite(value.zoom)
        ? value.zoom
        : DEFAULT_CAMERA_POSITION.zoom,
  };
}

function sanitizeGraphFilters(value?: Partial<GraphFilters> | null): GraphFilters {
  return {
    query: typeof value?.query === "string" ? value.query : DEFAULT_GRAPH_FILTERS.query,
    activeTag:
      typeof value?.activeTag === "string" || value?.activeTag === null
        ? value.activeTag ?? null
        : DEFAULT_GRAPH_FILTERS.activeTag,
    activeLayer:
      value?.activeLayer === "all" ||
      value?.activeLayer === "markdown" ||
      value?.activeLayer === "code"
        ? value.activeLayer
        : DEFAULT_GRAPH_FILTERS.activeLayer,
    kinds: Array.isArray(value?.kinds) ? uniqueStrings(value.kinds) : [],
    tags: Array.isArray(value?.tags) ? uniqueStrings(value.tags) : [],
    showArchived:
      typeof value?.showArchived === "boolean"
        ? value.showArchived
        : DEFAULT_GRAPH_FILTERS.showArchived,
  };
}

function sanitizePositions(
  value?: Record<string, PersistedGraphPosition> | null,
): Record<string, PersistedGraphPosition> {
  if (!value || typeof value !== "object") return {};

  const entries = Object.entries(value).filter(([key, position]) => {
    return (
      Boolean(key) &&
      position &&
      typeof position.x === "number" &&
      typeof position.y === "number"
    );
  });

  return Object.fromEntries(entries);
}

function sanitizePersistenceState(
  value?: Partial<PersistedWorkspaceState> | null,
): PersistedWorkspaceState {
  return {
    mode: sanitizeMode(value?.mode),
    leftRailOpen:
      typeof value?.leftRailOpen === "boolean"
        ? value.leftRailOpen
        : DEFAULT_PERSISTED_WORKSPACE_STATE.leftRailOpen,
    rightRailOpen:
      typeof value?.rightRailOpen === "boolean"
        ? value.rightRailOpen
        : DEFAULT_PERSISTED_WORKSPACE_STATE.rightRailOpen,
    graphFullscreen:
      typeof value?.graphFullscreen === "boolean"
        ? value.graphFullscreen
        : DEFAULT_PERSISTED_WORKSPACE_STATE.graphFullscreen,
    selectedPath:
      typeof value?.selectedPath === "string" || value?.selectedPath === null
        ? value.selectedPath ?? null
        : DEFAULT_PERSISTED_WORKSPACE_STATE.selectedPath,
    expandedFolders: Array.isArray(value?.expandedFolders)
      ? uniqueStrings(value.expandedFolders)
      : [],
    graphFilters: sanitizeGraphFilters(value?.graphFilters),
    cameraPosition: sanitizeCameraPosition(value?.cameraPosition),
    positions: sanitizePositions(value?.positions),
  };
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  mode: DEFAULT_PERSISTED_WORKSPACE_STATE.mode,
  leftRailOpen: DEFAULT_PERSISTED_WORKSPACE_STATE.leftRailOpen,
  rightRailOpen: DEFAULT_PERSISTED_WORKSPACE_STATE.rightRailOpen,
  graphFullscreen: DEFAULT_PERSISTED_WORKSPACE_STATE.graphFullscreen,
  selection: {
    selectedPath: DEFAULT_PERSISTED_WORKSPACE_STATE.selectedPath,
    selectedDocument: null,
  },
  treeState: {
    tree: [],
    expandedFolders: DEFAULT_PERSISTED_WORKSPACE_STATE.expandedFolders,
  },
  filters: DEFAULT_PERSISTED_WORKSPACE_STATE.graphFilters,
  cameraPosition: DEFAULT_PERSISTED_WORKSPACE_STATE.cameraPosition,
  positions: DEFAULT_PERSISTED_WORKSPACE_STATE.positions,

  setMode: (mode) => {
    set({ mode });
  },

  toggleLeftRail: () => {
    set((state) => ({ leftRailOpen: !state.leftRailOpen }));
  },

  toggleRightRail: () => {
    set((state) => ({ rightRailOpen: !state.rightRailOpen }));
  },

  setGraphFullscreen: (value) => {
    set({ graphFullscreen: value });
  },

  selectPath: (path) => {
    set((state) => ({
      selection: {
        ...state.selection,
        selectedPath: path,
        selectedDocument:
          state.selection.selectedDocument?.relativePath === path
            ? state.selection.selectedDocument
            : null,
      },
    }));
  },

  toggleFolder: (folderPath) => {
    set((state) => {
      const expanded = new Set(state.treeState.expandedFolders);

      if (expanded.has(folderPath)) {
        expanded.delete(folderPath);
      } else {
        expanded.add(folderPath);
      }

      return {
        treeState: {
          ...state.treeState,
          expandedFolders: Array.from(expanded),
        },
      };
    });
  },

  setExpandedFolders: (folderPaths) => {
    set((state) => ({
      treeState: {
        ...state.treeState,
        expandedFolders: uniqueStrings(folderPaths),
      },
    }));
  },

  setGraphFilters: (filters) => {
    set((state) => ({
      filters: sanitizeGraphFilters({
        ...state.filters,
        ...filters,
      }),
    }));
  },

  setCameraPosition: (position) => {
    set((state) => ({
      cameraPosition: sanitizeCameraPosition({
        ...state.cameraPosition,
        ...position,
      }),
    }));
  },

  setNodePosition: (nodeId, position) => {
    set((state) => ({
      positions: {
        ...state.positions,
        [nodeId]: position,
      },
    }));
  },

  resetWorkspaceState: () => {
    set({
      mode: DEFAULT_PERSISTED_WORKSPACE_STATE.mode,
      leftRailOpen: DEFAULT_PERSISTED_WORKSPACE_STATE.leftRailOpen,
      rightRailOpen: DEFAULT_PERSISTED_WORKSPACE_STATE.rightRailOpen,
      graphFullscreen: DEFAULT_PERSISTED_WORKSPACE_STATE.graphFullscreen,
      selection: {
        selectedPath: DEFAULT_PERSISTED_WORKSPACE_STATE.selectedPath,
        selectedDocument: null,
      },
      treeState: {
        tree: [],
        expandedFolders: DEFAULT_PERSISTED_WORKSPACE_STATE.expandedFolders,
      },
      filters: DEFAULT_PERSISTED_WORKSPACE_STATE.graphFilters,
      cameraPosition: DEFAULT_PERSISTED_WORKSPACE_STATE.cameraPosition,
      positions: DEFAULT_PERSISTED_WORKSPACE_STATE.positions,
    });
  },

  hydrateFromPersistence: (state) => {
    const safe = sanitizePersistenceState(state);

    set((current) => ({
      mode: safe.mode,
      leftRailOpen: safe.leftRailOpen,
      rightRailOpen: safe.rightRailOpen,
      graphFullscreen: safe.graphFullscreen,
      selection: {
        ...current.selection,
        selectedPath: safe.selectedPath,
        selectedDocument:
          current.selection.selectedDocument?.relativePath === safe.selectedPath
            ? current.selection.selectedDocument
            : null,
      },
      treeState: {
        ...current.treeState,
        expandedFolders: safe.expandedFolders,
      },
      filters: safe.graphFilters,
      cameraPosition: safe.cameraPosition,
      positions: safe.positions,
    }));
  },

  exportPersistenceState: () => {
    const state = get();

    return {
      mode: state.mode,
      leftRailOpen: state.leftRailOpen,
      rightRailOpen: state.rightRailOpen,
      graphFullscreen: state.graphFullscreen,
      selectedPath: state.selection.selectedPath,
      expandedFolders: state.treeState.expandedFolders,
      graphFilters: state.filters,
      cameraPosition: state.cameraPosition,
      positions: state.positions,
    };
  },
}));

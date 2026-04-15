import type { ReactNode } from "react";
import type { VaultDocument, VaultTreeNode } from "../../lib/types";
import type { WorkspaceMode } from "../../lib/app-shell";

export type WorkspaceSurfaceId = "tree" | "graph" | "editor" | "preview";

export type SurfaceStatus = "loading" | "ready" | "empty" | "error";

export type WorkspaceGraphLayerFilter = "all" | "markdown" | "code";

export type CameraPosition = {
  x: number;
  y: number;
  zoom: number;
};

export type PersistedGraphPosition = {
  x: number;
  y: number;
};

export type GraphFilters = {
  query: string;
  activeTag: string | null;
  activeLayer: WorkspaceGraphLayerFilter;
  kinds: string[];
  tags: string[];
  showArchived: boolean;
};

export type PersistedWorkspaceState = {
  mode: WorkspaceMode;
  leftRailOpen: boolean;
  rightRailOpen: boolean;
  graphFullscreen: boolean;
  selectedPath: string | null;
  expandedFolders: string[];
  graphFilters: GraphFilters;
  cameraPosition: CameraPosition;
  positions: Record<string, PersistedGraphPosition>;
};

export type WorkspaceDocumentSelection = {
  selectedPath: string | null;
  selectedDocument: VaultDocument | null;
};

export type WorkspaceTreeState = {
  tree: VaultTreeNode[];
  expandedFolders: string[];
};

export type WorkspaceDataState = {
  vaultPath: string | null;
  documents: VaultDocument[];
  tree: VaultTreeNode[];
  lastUpdatedAt: string | null;
};

export type WorkspaceSurfaceDefinition = {
  id: WorkspaceSurfaceId;
  title: string;
  status: SurfaceStatus;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
  className?: string;
};

export type WorkspaceViewState = {
  mode: WorkspaceMode;
  leftRailOpen: boolean;
  rightRailOpen: boolean;
  graphFullscreen: boolean;
  selection: WorkspaceDocumentSelection;
  treeState: WorkspaceTreeState;
  filters: GraphFilters;
  cameraPosition: CameraPosition;
  positions: Record<string, PersistedGraphPosition>;
};

export type WorkspaceActions = {
  setMode: (mode: WorkspaceMode) => void;
  toggleLeftRail: () => void;
  toggleRightRail: () => void;
  setGraphFullscreen: (value: boolean) => void;
  selectPath: (path: string | null) => void;
  toggleFolder: (folderPath: string) => void;
  setExpandedFolders: (folderPaths: string[]) => void;
  setGraphFilters: (filters: Partial<GraphFilters>) => void;
  setCameraPosition: (position: Partial<CameraPosition>) => void;
  setNodePosition: (nodeId: string, position: PersistedGraphPosition) => void;
  resetWorkspaceState: () => void;
};

export type WorkspaceStore = WorkspaceViewState & {
  hydrateFromPersistence: (state?: Partial<PersistedWorkspaceState> | null) => void;
  exportPersistenceState: () => PersistedWorkspaceState;
};

export type WorkspaceProviderValue = {
  state: WorkspaceViewState;
  actions: WorkspaceActions;
  hydrated: boolean;
};

export type WorkspaceRenderableSurface = WorkspaceSurfaceDefinition & {
  render?: (context: WorkspaceProviderValue) => ReactNode;
};

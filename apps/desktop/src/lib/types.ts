export type BrainAssetType =
  | "markdown"
  | "code"
  | "script"
  | "pdf"
  | "image"
  | "json"
  | "csv"
  | "text"
  | "unknown";

export type GraphNode = {
  id: string;
  title?: string;
  type?: string;
  layer?: string;
  cluster?: string;
  tags?: string[];
  score?: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  weight?: number;
};

export type GapItem = {
  id?: string;
  title?: string;
  description?: string;
  summary?: string;
  severity?: "low" | "medium" | "high";
  sourceCluster?: string;
  targetCluster?: string;
};

export type GraphPayload = {
  vaultPath: string | null;
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  gaps: GapItem[];
  source: "sample" | "vault";
  noteCount: number;
  lastUpdatedAt: string;
};

export type VaultDocument = {
  id: string;
  name: string;
  relativePath: string;
  folder: string;
  extension: string;
  type: BrainAssetType;
  sizeBytes: number;
  raw: string;
  tags: string[];
  links: string[];
  wordCount: number;
  updatedAt: string;
  metadata?: Record<string, unknown>;
};

export type VaultTreeNode = {
  id: string;
  name: string;
  path: string;
  type: "folder" | "file";
  children?: VaultTreeNode[];
};

export type VaultIndexPayload = {
  vaultPath: string | null;
  documents: VaultDocument[];
  tree: VaultTreeNode[];
  updatedAt: string;
};

export type DesktopBridge = {
  platform: string;
  appName: string;
  ping?: () => Promise<string>;
  selectVault: () => Promise<GraphPayload | null>;
  refreshVault: () => Promise<GraphPayload | null>;
  useSampleVault: () => Promise<GraphPayload>;
  onVaultUpdated: (callback: (payload: GraphPayload) => void) => () => void;
  getVaultIndex: () => Promise<VaultIndexPayload | null>;
  readDocument: (relativePath: string) => Promise<VaultDocument | null>;
  saveDocument: (input: {
    relativePath: string;
    raw: string;
  }) => Promise<VaultDocument | null>;
  createDocument: (input: {
    relativePath: string;
    raw: string;
  }) => Promise<VaultDocument | null>;
  createFolder: (input: {
    relativePath: string;
  }) => Promise<VaultIndexPayload | null>;
  moveEntry: (input: {
    sourceRelativePath: string;
    targetRelativePath: string;
  }) => Promise<{
    sourceRelativePath: string;
    targetRelativePath: string;
    type: "file" | "folder";
  } | null>;
};

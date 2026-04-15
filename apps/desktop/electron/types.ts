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

export type VaultAsset = {
  id: string;
  name: string;
  relativePath: string;
  folder: string;
  extension: string;
  type: BrainAssetType;
  sizeBytes: number;
  updatedAt: string;
  tags: string[];
  links: string[];
  wordCount?: number;
  raw?: string;
  metadata?: Record<string, unknown>;
  deletedAt?: string | null;
  isDeleted?: boolean;
};

export type VaultDocument = VaultAsset & {
  raw: string;
  wordCount: number;
};

export type VaultDocumentInput = {
  relativePath: string;
  raw: string;
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
  assets: VaultAsset[];
  documents: VaultDocument[];
  tree: VaultTreeNode[];
  trash: VaultAsset[];
  updatedAt: string;
};

export type VaultFolderInput = {
  relativePath: string;
};

export type VaultMoveEntryInput = {
  sourceRelativePath: string;
  targetRelativePath: string;
};

export type VaultMoveEntryResult = {
  sourceRelativePath: string;
  targetRelativePath: string;
  type: "file" | "folder";
};

export type VaultRenameEntryInput = {
  sourceRelativePath: string;
  nextName: string;
};

export type VaultDeleteEntryInput = {
  relativePath: string;
};

export type VaultRestoreEntryInput = {
  relativePath: string;
};

export type VaultDeleteEntryResult = {
  relativePath: string;
  deletedAt: string;
};

export type VaultRestoreEntryResult = {
  sourceRelativePath: string;
  restoredToRelativePath: string;
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
  saveDocument: (input: VaultDocumentInput) => Promise<VaultDocument | null>;
  createDocument: (input: VaultDocumentInput) => Promise<VaultDocument | null>;
  createFolder: (input: VaultFolderInput) => Promise<VaultIndexPayload | null>;
  moveEntry: (input: VaultMoveEntryInput) => Promise<VaultMoveEntryResult | null>;
};

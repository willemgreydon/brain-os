import fs from "node:fs/promises";
import path from "node:path";
import chokidar from "chokidar";
import matter from "gray-matter";
import { buildGraphFromNotes, parseMarkdownNote } from "../../../packages/knowledge-engine/src/index";
import { detectKnowledgeGaps } from "../../../packages/ai-gap-engine/src/index";
import type {
  BrainAssetType,
  GraphPayload,
  VaultAsset,
  VaultDeleteEntryInput,
  VaultDeleteEntryResult,
  VaultDocument,
  VaultDocumentInput,
  VaultFolderInput,
  VaultIndexPayload,
  VaultMoveEntryInput,
  VaultMoveEntryResult,
  VaultRenameEntryInput,
  VaultRestoreEntryInput,
  VaultRestoreEntryResult,
  VaultTreeNode,
} from "./types.js";

const TRASH_DIR = ".brain-trash";

const CODE_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "css", "scss", "html", "sql", "py", "rb", "java", "go", "rs", "php", "c", "cpp", "h",
  "hpp", "swift", "kt", "sh", "zsh", "bash", "yml", "yaml",
]);

const SCRIPT_EXTENSIONS = new Set(["sh", "zsh", "bash", "ps1"]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg"]);
const TEXT_EXTENSIONS = new Set(["txt", "log", "mdx", "rtf"]);

function normalizeSlashes(value: string) {
  return value.replace(/\\/g, "/");
}

function getExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) return "";
  return fileName.slice(lastDot + 1).toLowerCase();
}

function getAssetType(fileName: string): BrainAssetType {
  const ext = getExtension(fileName);

  if (ext === "md") return "markdown";
  if (ext === "pdf") return "pdf";
  if (ext === "json") return "json";
  if (ext === "csv") return "csv";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (SCRIPT_EXTENSIONS.has(ext)) return "script";
  if (CODE_EXTENSIONS.has(ext)) return "code";
  if (TEXT_EXTENSIONS.has(ext)) return "text";

  return "unknown";
}

function isHiddenSegment(segment: string) {
  return segment.startsWith(".") && segment !== TRASH_DIR;
}

function shouldSkipEntry(relativePath: string) {
  const normalized = normalizeSlashes(relativePath);
  const parts = normalized.split("/").filter(Boolean);
  return parts.some(isHiddenSegment);
}

function wordCount(raw: string) {
  return raw.trim() ? raw.trim().split(/\s+/).length : 0;
}

function extractTags(raw: string): string[] {
  const fromInline = raw.match(/#[\p{L}\p{N}_/-]+/gu) || [];
  return [...new Set(fromInline)];
}

function extractLinks(raw: string): string[] {
  return [...raw.matchAll(/\[\[(.*?)\]\]/g)]
    .map((match) => match[1]?.trim())
    .filter(Boolean) as string[];
}

async function ensureDirectory(value: string) {
  await fs.mkdir(value, { recursive: true });
}

async function exists(value: string) {
  try {
    await fs.access(value);
    return true;
  } catch {
    return false;
  }
}

async function walkDirectory(baseDir: string, currentDir = baseDir): Promise<string[]> {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentDir, entry.name);
    const relativePath = normalizeSlashes(path.relative(baseDir, absolutePath));

    if (relativePath.startsWith(`${TRASH_DIR}/`) || relativePath === TRASH_DIR) {
      continue;
    }

    if (shouldSkipEntry(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...(await walkDirectory(baseDir, absolutePath)));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

async function walkTrash(baseDir: string): Promise<string[]> {
  const trashRoot = path.join(baseDir, TRASH_DIR);
  if (!(await exists(trashRoot))) return [];

  async function walk(currentDir: string): Promise<string[]> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        files.push(...(await walk(absolutePath)));
      } else {
        files.push(absolutePath);
      }
    }

    return files;
  }

  return walk(trashRoot);
}

async function readAsset(vaultPath: string, relativePath: string): Promise<VaultAsset | null> {
  const absolutePath = path.join(vaultPath, relativePath);
  const stats = await fs.stat(absolutePath);
  const name = path.basename(relativePath);
  const folder = normalizeSlashes(path.dirname(relativePath) === "." ? "" : path.dirname(relativePath));
  const extension = getExtension(name);
  const type = getAssetType(name);

  let raw: string | undefined;
  let tags: string[] = [];
  let links: string[] = [];
  let wordCountValue: number | undefined;
  let metadata: Record<string, unknown> | undefined;

  if (type === "markdown" || type === "code" || type === "script" || type === "json" || type === "csv" || type === "text") {
    raw = await fs.readFile(absolutePath, "utf8");
    tags = extractTags(raw);
    links = extractLinks(raw);
    wordCountValue = wordCount(raw);

    if (type === "markdown") {
      try {
        const parsed = matter(raw);
        metadata = parsed.data || {};
      } catch {
        metadata = undefined;
      }
    }
  }

  return {
    id: relativePath,
    name,
    relativePath: normalizeSlashes(relativePath),
    folder,
    extension,
    type,
    sizeBytes: stats.size,
    updatedAt: stats.mtime.toISOString(),
    tags,
    links,
    wordCount: wordCountValue,
    raw,
    metadata,
    isDeleted: false,
    deletedAt: null,
  };
}

async function readTrashAsset(vaultPath: string, absolutePath: string): Promise<VaultAsset | null> {
  const stats = await fs.stat(absolutePath);
  const fileName = path.basename(absolutePath);

  if (!fileName.endsWith(".json")) return null;

  const raw = await fs.readFile(absolutePath, "utf8");
  const parsed = JSON.parse(raw) as {
    relativePath: string;
    deletedAt: string;
    asset: VaultAsset;
  };

  return {
    ...parsed.asset,
    isDeleted: true,
    deletedAt: parsed.deletedAt,
  };
}

function sortTreeNodes(nodes: VaultTreeNode[]): VaultTreeNode[] {
  return nodes
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    })
    .map((node) => ({
      ...node,
      children: node.children ? sortTreeNodes(node.children) : undefined,
    }));
}

function buildTreeFromAssets(assets: VaultAsset[]): VaultTreeNode[] {
  const root: VaultTreeNode[] = [];

  function ensureFolder(parts: string[]): VaultTreeNode[] {
    let currentLevel = root;
    let currentPath = "";

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      let existing = currentLevel.find((node) => node.type === "folder" && node.path === currentPath);
      if (!existing) {
        existing = {
          id: currentPath,
          name: part,
          path: currentPath,
          type: "folder",
          children: [],
        };
        currentLevel.push(existing);
      }

      if (!existing.children) existing.children = [];
      currentLevel = existing.children;
    }

    return currentLevel;
  }

  for (const asset of assets.filter((item) => !item.isDeleted)) {
    const normalized = normalizeSlashes(asset.relativePath);
    const parts = normalized.split("/").filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) continue;

    const folderLevel = ensureFolder(parts);

    folderLevel.push({
      id: normalized,
      name: fileName,
      path: normalized,
      type: "file",
    });
  }

  return sortTreeNodes(root);
}

function toDocument(asset: VaultAsset): VaultDocument | null {
  if (!asset.raw) return null;
  if (asset.type !== "markdown" && asset.type !== "code" && asset.type !== "script" && asset.type !== "json" && asset.type !== "csv" && asset.type !== "text") {
    return null;
  }

  return {
    ...asset,
    raw: asset.raw,
    wordCount: asset.wordCount || 0,
  };
}

export async function buildVaultIndex(vaultPath: string): Promise<VaultIndexPayload> {
  const filePaths = await walkDirectory(vaultPath);
  const assets = (await Promise.all(filePaths.map((relativePath) => readAsset(vaultPath, relativePath))))
    .filter(Boolean) as VaultAsset[];

  const trashFiles = await walkTrash(vaultPath);
  const trashAssets = (await Promise.all(trashFiles.map((absolutePath) => readTrashAsset(vaultPath, absolutePath))))
    .filter(Boolean) as VaultAsset[];

  const tree = buildTreeFromAssets(assets);
  const documents = assets.map(toDocument).filter(Boolean) as VaultDocument[];

  return {
    vaultPath,
    assets,
    documents,
    tree,
    trash: trashAssets.sort((a, b) => (b.deletedAt || "").localeCompare(a.deletedAt || "")),
    updatedAt: new Date().toISOString(),
  };
}

export async function buildVaultPayload(vaultPath: string): Promise<GraphPayload> {
  const index = await buildVaultIndex(vaultPath);

  const markdownNotes = index.assets
    .filter((asset) => asset.type === "markdown" && asset.raw)
    .map((asset) =>
      parseMarkdownNote({
        id: asset.relativePath,
        filePath: asset.relativePath,
        raw: asset.raw || "",
      })
    );

  const graph = buildGraphFromNotes(markdownNotes);
  const gaps = detectKnowledgeGaps(graph);

  return {
    vaultPath,
    graph,
    gaps,
    source: "vault",
    noteCount: markdownNotes.length,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function readVaultDocument(vaultPath: string, relativePath: string): Promise<VaultDocument | null> {
  const asset = await readAsset(vaultPath, relativePath);
  if (!asset) return null;
  return toDocument(asset);
}

export async function saveVaultDocument(vaultPath: string, input: VaultDocumentInput): Promise<VaultDocument | null> {
  const normalized = normalizeSlashes(input.relativePath);
  const absolutePath = path.join(vaultPath, normalized);

  await ensureDirectory(path.dirname(absolutePath));
  await fs.writeFile(absolutePath, input.raw, "utf8");

  return readVaultDocument(vaultPath, normalized);
}

export async function createVaultDocument(vaultPath: string, input: VaultDocumentInput): Promise<VaultDocument | null> {
  const normalized = normalizeSlashes(input.relativePath);
  const absolutePath = path.join(vaultPath, normalized);

  if (await exists(absolutePath)) {
    throw new Error("File already exists.");
  }

  await ensureDirectory(path.dirname(absolutePath));
  await fs.writeFile(absolutePath, input.raw, "utf8");

  return readVaultDocument(vaultPath, normalized);
}

export async function createVaultFolder(vaultPath: string, input: VaultFolderInput): Promise<VaultIndexPayload | null> {
  const normalized = normalizeSlashes(input.relativePath).replace(/\/+$/, "");
  if (!normalized) throw new Error("Folder path cannot be empty.");

  const absolutePath = path.join(vaultPath, normalized);
  await ensureDirectory(absolutePath);

  return buildVaultIndex(vaultPath);
}

export async function moveVaultEntry(vaultPath: string, input: VaultMoveEntryInput): Promise<VaultMoveEntryResult | null> {
  const source = normalizeSlashes(input.sourceRelativePath);
  const target = normalizeSlashes(input.targetRelativePath);

  if (!source || !target) {
    throw new Error("Source and target paths are required.");
  }

  if (target.startsWith(`${source}/`)) {
    throw new Error("Cannot move a folder into itself.");
  }

  const sourceAbsolute = path.join(vaultPath, source);
  const targetAbsolute = path.join(vaultPath, target);

  if (!(await exists(sourceAbsolute))) {
    throw new Error("Source entry does not exist.");
  }

  if (await exists(targetAbsolute)) {
    throw new Error("Target entry already exists.");
  }

  await ensureDirectory(path.dirname(targetAbsolute));
  const stats = await fs.stat(sourceAbsolute);
  await fs.rename(sourceAbsolute, targetAbsolute);

  return {
    sourceRelativePath: source,
    targetRelativePath: target,
    type: stats.isDirectory() ? "folder" : "file",
  };
}

export async function renameVaultEntry(vaultPath: string, input: VaultRenameEntryInput): Promise<VaultMoveEntryResult | null> {
  const source = normalizeSlashes(input.sourceRelativePath);
  const nextName = input.nextName.trim();

  if (!source || !nextName) {
    throw new Error("Source path and next name are required.");
  }

  const sourceAbsolute = path.join(vaultPath, source);
  const parent = normalizeSlashes(path.dirname(source) === "." ? "" : path.dirname(source));
  const targetRelativePath = parent ? `${parent}/${nextName}` : nextName;

  return moveVaultEntry(vaultPath, {
    sourceRelativePath: source,
    targetRelativePath,
  });
}

export async function deleteVaultEntry(vaultPath: string, input: VaultDeleteEntryInput): Promise<VaultDeleteEntryResult | null> {
  const relativePath = normalizeSlashes(input.relativePath);
  const absolutePath = path.join(vaultPath, relativePath);

  if (!(await exists(absolutePath))) {
    throw new Error("Entry does not exist.");
  }

  const stats = await fs.stat(absolutePath);
  if (stats.isDirectory()) {
    throw new Error("Folder delete-to-trash is not yet supported in this phase.");
  }

  const asset = await readAsset(vaultPath, relativePath);
  if (!asset) {
    throw new Error("Could not read asset.");
  }

  const deletedAt = new Date().toISOString();
  const trashRoot = path.join(vaultPath, TRASH_DIR);
  await ensureDirectory(trashRoot);

  const safeName = relativePath.replace(/[\\/]/g, "__");
  const trashFile = path.join(trashRoot, `${safeName}__${Date.now()}.json`);

  await fs.writeFile(
    trashFile,
    JSON.stringify(
      {
        relativePath,
        deletedAt,
        asset,
      },
      null,
      2
    ),
    "utf8"
  );

  await fs.unlink(absolutePath);

  return {
    relativePath,
    deletedAt,
  };
}

export async function restoreVaultEntry(vaultPath: string, input: VaultRestoreEntryInput): Promise<VaultRestoreEntryResult | null> {
  const relativePath = normalizeSlashes(input.relativePath);
  const trashRoot = path.join(vaultPath, TRASH_DIR);

  if (!(await exists(trashRoot))) {
    throw new Error("Trash is empty.");
  }

  const trashFiles = await walkTrash(vaultPath);

  for (const absolutePath of trashFiles) {
    const raw = await fs.readFile(absolutePath, "utf8");
    const parsed = JSON.parse(raw) as {
      relativePath: string;
      deletedAt: string;
      asset: VaultAsset;
    };

    if (parsed.relativePath !== relativePath) continue;

    const restorePath = path.join(vaultPath, parsed.relativePath);
    await ensureDirectory(path.dirname(restorePath));

    if (parsed.asset.raw !== undefined) {
      await fs.writeFile(restorePath, parsed.asset.raw, "utf8");
    } else {
      await fs.writeFile(restorePath, "", "utf8");
    }

    await fs.unlink(absolutePath);

    return {
      sourceRelativePath: relativePath,
      restoredToRelativePath: relativePath,
    };
  }

  throw new Error("Trash entry not found.");
}

export async function createVaultWatcher(
  vaultPath: string,
  onUpdate: (payload: GraphPayload) => void,
  onError: (error: unknown) => void
) {
  const watcher = chokidar.watch(vaultPath, {
    ignoreInitial: true,
    ignored: (targetPath) => {
      const relative = normalizeSlashes(path.relative(vaultPath, targetPath));
      if (!relative || relative === ".") return false;
      if (relative.startsWith(`${TRASH_DIR}/`) || relative === TRASH_DIR) return false;
      return shouldSkipEntry(relative);
    },
  });

  const refresh = async () => {
    try {
      const payload = await buildVaultPayload(vaultPath);
      onUpdate(payload);
    } catch (error) {
      onError(error);
    }
  };

  const debounced = debounce(refresh, 180);

  watcher.on("add", debounced);
  watcher.on("change", debounced);
  watcher.on("unlink", debounced);
  watcher.on("addDir", debounced);
  watcher.on("unlinkDir", debounced);

  return {
    close: async () => watcher.close(),
  };
}

function debounce(fn: () => void | Promise<void>, wait: number) {
  let timeout: NodeJS.Timeout | null = null;

  return () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      void fn();
    }, wait);
  };
}

import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "node:path";
import { buildGraphFromNotes, parseMarkdownNote } from "../../../packages/knowledge-engine/src/index";
import { detectKnowledgeGaps } from "../../../packages/ai-gap-engine/src/index";
import { sampleNotes } from "./sample-data.js";
import {
  buildVaultIndex,
  buildVaultPayload,
  createVaultDocument,
  createVaultFolder,
  createVaultWatcher,
  deleteVaultEntry,
  moveVaultEntry,
  readVaultDocument,
  renameVaultEntry,
  restoreVaultEntry,
  saveVaultDocument,
} from "./vault-service.js";
import type {
  GraphPayload,
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
} from "./types.js";

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let currentVaultPath: string | null = null;
let currentWatcher: Awaited<ReturnType<typeof createVaultWatcher>> | null = null;

function samplePayload(): GraphPayload {
  const notes = Object.entries(sampleNotes).map(([id, raw]: [string, string]) =>
    parseMarkdownNote({ id, filePath: `${id}.md`, raw })
  );

  const graph = buildGraphFromNotes(notes);
  const gaps = detectKnowledgeGaps(graph);

  return {
    vaultPath: null,
    graph,
    gaps,
    source: "sample",
    noteCount: notes.length,
    lastUpdatedAt: new Date().toISOString(),
  };
}

function createWindow() {
  const preloadPath = path.resolve(__dirname, "preload.js");

  const win = new BrowserWindow({
    width: 1680,
    height: 1040,
    minWidth: 1380,
    minHeight: 900,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 18, y: 18 },
    backgroundColor: "#eef3f8",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    void win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    void win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow = win;
}

async function replaceWatcher(vaultPath: string) {
  if (currentWatcher) {
    await currentWatcher.close();
  }

  currentWatcher = await createVaultWatcher(
    vaultPath,
    (payload: GraphPayload) => mainWindow?.webContents.send("vault:updated", payload),
    (error: unknown) => console.error("Vault watcher error", error)
  );
}

ipcMain.handle("desktop:ping", async () => "pong");

ipcMain.handle("vault:sample", async (): Promise<GraphPayload> => samplePayload());

ipcMain.handle("vault:select", async (): Promise<GraphPayload | null> => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const [vaultPath] = result.filePaths;
  if (!vaultPath) return null;

  currentVaultPath = vaultPath;
  const payload = await buildVaultPayload(vaultPath);
  await replaceWatcher(vaultPath);

  return payload;
});

ipcMain.handle("vault:refresh", async (): Promise<GraphPayload> => {
  if (!currentVaultPath) {
    return samplePayload();
  }

  return buildVaultPayload(currentVaultPath);
});

ipcMain.handle("vault:index", async (): Promise<VaultIndexPayload | null> => {
  if (!currentVaultPath) return null;
  return buildVaultIndex(currentVaultPath);
});

ipcMain.handle("vault:read-document", async (_event, relativePath: string): Promise<VaultDocument | null> => {
  if (!currentVaultPath) return null;
  return readVaultDocument(currentVaultPath, relativePath);
});

ipcMain.handle("vault:save-document", async (_event, input: VaultDocumentInput): Promise<VaultDocument | null> => {
  if (!currentVaultPath) return null;
  return saveVaultDocument(currentVaultPath, input);
});

ipcMain.handle("vault:create-document", async (_event, input: VaultDocumentInput): Promise<VaultDocument | null> => {
  if (!currentVaultPath) return null;
  return createVaultDocument(currentVaultPath, input);
});

ipcMain.handle("vault:create-folder", async (_event, input: VaultFolderInput): Promise<VaultIndexPayload | null> => {
  if (!currentVaultPath) return null;
  return createVaultFolder(currentVaultPath, input);
});

ipcMain.handle("vault:move-entry", async (_event, input: VaultMoveEntryInput): Promise<VaultMoveEntryResult | null> => {
  if (!currentVaultPath) return null;
  return moveVaultEntry(currentVaultPath, input);
});

ipcMain.handle("vault:rename-entry", async (_event, input: VaultRenameEntryInput): Promise<VaultMoveEntryResult | null> => {
  if (!currentVaultPath) return null;
  return renameVaultEntry(currentVaultPath, input);
});

ipcMain.handle("vault:delete-entry", async (_event, input: VaultDeleteEntryInput): Promise<VaultDeleteEntryResult | null> => {
  if (!currentVaultPath) return null;
  return deleteVaultEntry(currentVaultPath, input);
});

ipcMain.handle("vault:restore-entry", async (_event, input: VaultRestoreEntryInput): Promise<VaultRestoreEntryResult | null> => {
  if (!currentVaultPath) return null;
  return restoreVaultEntry(currentVaultPath, input);
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", async () => {
  if (currentWatcher) {
    await currentWatcher.close();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

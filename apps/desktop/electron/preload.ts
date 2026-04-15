import { contextBridge, ipcRenderer } from "electron";
import type {
  DesktopBridge,
  GraphPayload,
  VaultDocument,
  VaultDocumentInput,
  VaultFolderInput,
  VaultIndexPayload,
  VaultMoveEntryInput,
  VaultMoveEntryResult,
} from "./types.js";

const api: DesktopBridge & { ping: () => Promise<string> } = {
  platform: process.platform,
  appName: "Brain OS",

  ping: () => ipcRenderer.invoke("desktop:ping") as Promise<string>,

  selectVault: () => ipcRenderer.invoke("vault:select") as Promise<GraphPayload | null>,
  refreshVault: () => ipcRenderer.invoke("vault:refresh") as Promise<GraphPayload | null>,
  useSampleVault: () => ipcRenderer.invoke("vault:sample") as Promise<GraphPayload>,

  onVaultUpdated: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: GraphPayload) => {
      callback(payload);
    };

    ipcRenderer.on("vault:updated", listener);

    return () => {
      ipcRenderer.removeListener("vault:updated", listener);
    };
  },

  getVaultIndex: () => ipcRenderer.invoke("vault:index") as Promise<VaultIndexPayload | null>,

  readDocument: (relativePath: string) =>
    ipcRenderer.invoke("vault:read-document", relativePath) as Promise<VaultDocument | null>,

  saveDocument: (input: VaultDocumentInput) =>
    ipcRenderer.invoke("vault:save-document", input) as Promise<VaultDocument | null>,

  createDocument: (input: VaultDocumentInput) =>
    ipcRenderer.invoke("vault:create-document", input) as Promise<VaultDocument | null>,

  createFolder: (input: VaultFolderInput) =>
    ipcRenderer.invoke("vault:create-folder", input) as Promise<VaultIndexPayload | null>,

  moveEntry: (input: VaultMoveEntryInput) =>
    ipcRenderer.invoke("vault:move-entry", input) as Promise<VaultMoveEntryResult | null>,
};

contextBridge.exposeInMainWorld("brainDesktop", api);

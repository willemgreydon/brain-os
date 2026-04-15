// apps/desktop/src/App.tsx
import React, { useEffect, useMemo, useState } from "react";
import { getBrainAssetType } from "./lib/asset-registry";
import {
  DEFAULT_SETTINGS,
  applySettingsToDocument,
  loadSettings,
  saveSettings,
  type BrainSettings,
} from "./lib/settings";
import type { Surface, WorkspaceMode } from "./lib/app-shell";
import type {
  DesktopBridge,
  GraphPayload,
  VaultDocument,
  VaultIndexPayload,
} from "./lib/types";
import {
  buildUnifiedGraphFromDocuments,
  buildUnifiedGraphFromPayload,
} from "./lib/graph/unified-graph";
import WorkspaceCommandBar, {
  type WorkspaceCommand,
} from "./components/workspace/WorkspaceCommandBar";
import SpatialWorkspace from "./components/workspace/SpatialWorkspace";

type BrainAssetType =
  | "markdown"
  | "code"
  | "script"
  | "pdf"
  | "image"
  | "json"
  | "csv"
  | "text"
  | "unknown";

type AppStatus = "idle" | "loading" | "ready" | "error";

type BrainAsset = {
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
};

declare global {
  interface Window {
    brainDesktop?: DesktopBridge;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function titleFromPath(relativePath: string) {
  const file = relativePath.split("/").pop() || relativePath;
  return file.replace(/\.[^/.]+$/u, "");
}

function normalizeFolderPath(input: string) {
  return input.trim().replace(/^\/+|\/+$/g, "");
}

function normalizeDocumentPath(input: string) {
  let value = input.trim().replace(/^\/+/g, "");
  if (!value) return "";
  if (!value.endsWith(".md")) value += ".md";
  return value;
}

function countWords(raw: string) {
  return raw.trim() ? raw.trim().split(/\s+/).length : 0;
}

function countLines(raw: string) {
  return raw.split(/\r?\n/).length;
}

function countHeadings(raw: string) {
  return (raw.match(/^#{1,6}\s+/gm) || []).length;
}

function extractTags(raw: string): string[] {
  const matches = raw.match(/#[\p{L}\p{N}_/-]+/gu) || [];
  return [...new Set(matches)];
}

function extractLinks(raw: string): string[] {
  return [...raw.matchAll(/\[\[(.*?)\]\]/g)]
    .map((match) => match[1]?.trim())
    .filter(Boolean) as string[];
}

function toBrainAssets(documents: VaultDocument[]): BrainAsset[] {
  return documents.map((doc) => ({
    id: doc.id,
    name: doc.name,
    relativePath: doc.relativePath,
    folder: doc.folder,
    extension: doc.extension || doc.name.split(".").pop() || "",
    type: doc.type || getBrainAssetType(doc.name),
    sizeBytes: doc.raw?.length || 0,
    updatedAt: doc.updatedAt,
    tags: doc.tags,
    links: doc.links,
    wordCount: doc.wordCount,
    raw: doc.raw,
    metadata: doc.metadata,
  }));
}

function EmptyState({
  onLoadSample,
  onChooseVault,
}: {
  onLoadSample: () => void;
  onChooseVault: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__card">
        <div className="empty-state__badge">Brain OS</div>
        <h1 className="empty-state__title">Local-first cognitive workspace</h1>
        <p className="empty-state__text">
          Open a real vault to unlock filesystem-backed notes, folder structure,
          3D semantic graph exploration, split editing and backlinks.
        </p>
        <div className="empty-state__actions">
          <button className="btn btn--primary" onClick={onChooseVault}>
            Open vault
          </button>
          <button className="btn" onClick={onLoadSample}>
            Load sample graph
          </button>
        </div>
      </div>
    </div>
  );
}

function SurfacePlaceholder({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <section className="panel">
      <div className="panel__head">
        <p className="panel__kicker">{title}</p>
      </div>
      <div className="muted">{text}</div>
    </section>
  );
}

function AppChrome({
  surface,
  setSurface,
  status,
  payload,
}: {
  surface: Surface;
  setSurface: (surface: Surface) => void;
  status: AppStatus;
  payload: GraphPayload | null;
}) {
  const sections: Array<{ id: Surface; label: string; icon: string }> = [
    { id: "workspace", label: "Workspace", icon: "◫" },
    { id: "library", label: "Library", icon: "⌘" },
    { id: "insights", label: "Insights", icon: "◌" },
    { id: "settings", label: "Settings", icon: "⚙" },
    { id: "legal", label: "Legal + Trust", icon: "✓" },
    { id: "account", label: "Auth + Billing", icon: "◎" },
  ];

  return (
    <aside className="shell-nav shell-nav--spatial">
      <div className="shell-brand">
        <div className="shell-brand__orb" />
        <div>
          <p className="shell-brand__kicker">Cognitive Platform</p>
          <h1 className="shell-brand__title">Brain OS</h1>
        </div>
      </div>

      <div className="shell-nav__group">
        {sections.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${surface === item.id ? "nav-item--active" : ""}`}
            onClick={() => setSurface(item.id)}
          >
            <span className="nav-item__icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="shell-nav__footer">
        <div className="status-card">
          <div className="status-card__top">
            <span className={`status-dot status-dot--${status}`} />
            <span>{status}</span>
          </div>
          <div className="status-card__meta">
            {payload?.vaultPath
              ? payload.vaultPath
              : payload?.source === "sample"
                ? "Sample vault"
                : "No vault selected"}
          </div>
        </div>
      </div>
    </aside>
  );
}

function WorkspaceTopbar({
  surface,
  workspaceMode,
  setWorkspaceMode,
  settings,
  onChooseVault,
  onRefresh,
  onLoadSample,
  onOpenCommandBar,
  platform,
  leftRailOpen,
  setLeftRailOpen,
  rightRailOpen,
  setRightRailOpen,
  graphFullscreen,
  setGraphFullscreen,
}: {
  surface: Surface;
  workspaceMode: WorkspaceMode;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  settings: BrainSettings;
  onChooseVault: () => void;
  onRefresh: () => void;
  onLoadSample: () => void;
  onOpenCommandBar: () => void;
  platform: string;
  leftRailOpen: boolean;
  setLeftRailOpen: React.Dispatch<React.SetStateAction<boolean>>;
  rightRailOpen: boolean;
  setRightRailOpen: React.Dispatch<React.SetStateAction<boolean>>;
  graphFullscreen: boolean;
  setGraphFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <header className={`topbar topbar--spatial ${platform === "darwin" ? "topbar--mac" : ""}`}>
      <div className="topbar__left">
        <div>
          <p className="eyebrow">Current surface</p>
          <h2 className="topbar__headline">
            {surface === "workspace" && "Workspace"}
            {surface === "library" && "Library"}
            {surface === "insights" && "Insights"}
            {surface === "settings" && "Settings"}
            {surface === "legal" && "Legal + Trust"}
            {surface === "account" && "Auth + Billing"}
          </h2>
        </div>
      </div>

      <div className="topbar__center">
        {surface === "workspace" ? (
          <div className="segmented">
            <button
              className={workspaceMode === "graph" ? "segmented__item segmented__item--active" : "segmented__item"}
              onClick={() => setWorkspaceMode("graph")}
            >
              Graph
            </button>
            <button
              className={workspaceMode === "content" ? "segmented__item segmented__item--active" : "segmented__item"}
              onClick={() => setWorkspaceMode("content")}
            >
              Content
            </button>
            <button
              className={workspaceMode === "split" ? "segmented__item segmented__item--active" : "segmented__item"}
              onClick={() => setWorkspaceMode("split")}
            >
              Split
            </button>
          </div>
        ) : (
          <div className="topbar__meta">
            Theme: {settings.themeMode} · Density: {settings.densityMode}
          </div>
        )}
      </div>

      <div className="topbar__right">
        <button className="btn btn--ghost" onClick={() => setLeftRailOpen((value) => !value)}>
          {leftRailOpen ? "Hide library" : "Show library"}
        </button>
        <button className="btn btn--ghost" onClick={() => setRightRailOpen((value) => !value)}>
          {rightRailOpen ? "Hide insights" : "Show insights"}
        </button>
        <button className="btn btn--ghost" onClick={() => setGraphFullscreen((value) => !value)}>
          {graphFullscreen ? "Exit graph" : "Fullscreen graph"}
        </button>
        <button className="btn btn--ghost" onClick={onOpenCommandBar}>
          ⌘K
        </button>
        <button className="btn btn--ghost" onClick={onLoadSample}>
          Sample
        </button>
        <button className="btn btn--ghost" onClick={onRefresh}>
          Refresh
        </button>
        <button className="btn btn--primary" onClick={onChooseVault}>
          Open vault
        </button>
      </div>
    </header>
  );
}

export default function App() {
  const [status, setStatus] = useState<AppStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [graphPayload, setGraphPayload] = useState<GraphPayload | null>(null);
  const [vaultIndex, setVaultIndex] = useState<VaultIndexPayload | null>(null);

  const [settings, setSettings] = useState<BrainSettings>(() => loadSettings());
  const [surface, setSurface] = useState<Surface>(DEFAULT_SETTINGS.defaultSurface);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(DEFAULT_SETTINGS.defaultWorkspaceMode);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<VaultDocument | null>(null);
  const [draft, setDraft] = useState("");

  const [newDocPath, setNewDocPath] = useState("notes/new-note.md");
  const [newFolderPath, setNewFolderPath] = useState("notes/new-folder");
  const [docsSearch, setDocsSearch] = useState("");

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [graphSearch, setGraphSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<"all" | "markdown" | "code">("all");

  const [leftRailOpen, setLeftRailOpen] = useState(true);
  const [rightRailOpen, setRightRailOpen] = useState(true);
  const [graphFullscreen, setGraphFullscreen] = useState(false);

  const [commandBarOpen, setCommandBarOpen] = useState(false);
  const platform =
    typeof window !== "undefined" ? window.brainDesktop?.platform || "unknown" : "unknown";

  useEffect(() => {
    const stored = loadSettings();
    setSettings(stored);
    setSurface(stored.defaultSurface);
    setWorkspaceMode(stored.defaultWorkspaceMode);
    applySettingsToDocument(stored);
  }, []);

  useEffect(() => {
    applySettingsToDocument(settings);
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isModifier = event.metaKey || event.ctrlKey;

      if (event.key === "Escape") {
        setCommandBarOpen(false);
        setGraphFullscreen(false);
        return;
      }

      if (!isModifier) return;

      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandBarOpen(true);
        return;
      }

      if (event.key === "=" || event.key === "+") {
        event.preventDefault();
        setSettings((current) => ({
          ...current,
          uiScale: clamp(Number((current.uiScale + 0.05).toFixed(2)), 0.9, 1.25),
        }));
      }

      if (event.key === "-") {
        event.preventDefault();
        setSettings((current) => ({
          ...current,
          uiScale: clamp(Number((current.uiScale - 0.05).toFixed(2)), 0.9, 1.25),
        }));
      }

      if (event.key === "0") {
        event.preventDefault();
        setSettings((current) => ({
          ...current,
          uiScale: 1,
          appFontSize: 13,
          editorFontSize: 13,
        }));
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSaveDocument();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  async function loadVaultIndex() {
    try {
      const next = await window.brainDesktop?.getVaultIndex?.();
      setVaultIndex(next || null);
      return next || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vault index.");
      return null;
    }
  }

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        setStatus("loading");

        if (!window.brainDesktop) {
          throw new Error("Desktop bridge missing in renderer.");
        }

        if (window.brainDesktop.ping) {
          const pong = await window.brainDesktop.ping();
          if (pong !== "pong") throw new Error("Desktop bridge ping failed.");
        }

        const payload = await window.brainDesktop.useSampleVault();
        if (!mounted) return;

        setGraphPayload(payload);
        setSelectedNodeId(payload.graph.nodes[0]?.id || null);
        setStatus("ready");
        setError(null);
        setVaultIndex(null);
      } catch (err) {
        if (!mounted) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to boot Brain OS.");
      }
    }

    void boot();

    const unsubscribe = window.brainDesktop?.onVaultUpdated?.((payload) => {
      setGraphPayload(payload);
      setStatus("ready");
      setError(null);
      void loadVaultIndex();
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const assets = useMemo(() => toBrainAssets(vaultIndex?.documents || []), [vaultIndex?.documents]);
  const hasWritableVault = Boolean(vaultIndex?.vaultPath);
  const canEditSelectedDocument = Boolean(
    hasWritableVault &&
      selectedDocument &&
      ["markdown", "code", "script", "json", "csv", "text"].includes(selectedDocument.type),
  );

  const filteredDocuments = useMemo(() => {
    const docs = vaultIndex?.documents || [];
    const q = docsSearch.trim().toLowerCase();
    if (!q) return docs;

    return docs.filter((doc) => {
      return (
        doc.relativePath.toLowerCase().includes(q) ||
        doc.name.toLowerCase().includes(q) ||
        doc.tags.join(" ").toLowerCase().includes(q)
      );
    });
  }, [docsSearch, vaultIndex?.documents]);

  const graphData = useMemo(() => {
    if (vaultIndex?.documents?.length) {
      return buildUnifiedGraphFromDocuments({
        documents: vaultIndex.documents,
        filters: {
          search: graphSearch,
          activeTag,
          activeLayer,
        },
      });
    }

    return buildUnifiedGraphFromPayload(graphPayload?.graph || { nodes: [], edges: [] });
  }, [activeLayer, activeTag, graphPayload?.graph, graphSearch, vaultIndex?.documents]);

  const selectedGraphNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return graphData.nodes.find((node) => node.id === selectedNodeId) || null;
  }, [graphData.nodes, selectedNodeId]);

  const analysis = useMemo(() => {
    return {
      words: countWords(draft),
      lines: countLines(draft),
      headings: countHeadings(draft),
      tags: extractTags(draft),
      links: extractLinks(draft),
    };
  }, [draft]);

  async function handleChooseVault() {
    try {
      setStatus("loading");
      setError(null);

      const nextPayload = await window.brainDesktop?.selectVault?.();
      if (!nextPayload) {
        setStatus(graphPayload ? "ready" : "idle");
        return;
      }

      setGraphPayload(nextPayload);
      const nextIndex = await loadVaultIndex();

      setSurface("workspace");
      setWorkspaceMode("content");
      setStatus("ready");

      if (nextIndex?.documents?.length) {
        await handleOpenDocument(nextIndex.documents[0].relativePath);
      } else {
        setSelectedDocument(null);
        setSelectedPath(null);
        setDraft("");
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to open vault.");
    }
  }

  async function handleRefresh() {
    try {
      setStatus("loading");
      setError(null);

      const nextPayload = await window.brainDesktop?.refreshVault?.();
      if (nextPayload) setGraphPayload(nextPayload);

      const nextIndex = await loadVaultIndex();

      if (selectedPath && nextIndex?.documents.some((doc) => doc.relativePath === selectedPath)) {
        await handleOpenDocument(selectedPath);
      } else if (selectedPath) {
        setSelectedPath(null);
        setSelectedDocument(null);
        setDraft("");
      }

      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to refresh vault.");
    }
  }

  async function handleLoadSample() {
    try {
      setStatus("loading");
      setError(null);

      if (!window.brainDesktop) throw new Error("Desktop bridge missing in renderer.");

      const payload = await window.brainDesktop.useSampleVault();
      setGraphPayload(payload);
      setVaultIndex(null);
      setSelectedNodeId(payload.graph.nodes[0]?.id || null);
      setSelectedPath(null);
      setSelectedDocument(null);
      setDraft("");
      setGraphFullscreen(false);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to load sample.");
    }
  }

  async function handleOpenDocument(relativePath: string) {
    try {
      const doc = await window.brainDesktop?.readDocument?.(relativePath);
      if (!doc) return;

      setSelectedDocument({
        ...doc,
        extension: doc.extension || doc.name.split(".").pop() || "",
        type: doc.type || getBrainAssetType(doc.name),
        sizeBytes: doc.sizeBytes ?? doc.raw.length,
      });
      setSelectedPath(doc.relativePath);
      setDraft(doc.raw);
      setSurface("workspace");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read document.");
    }
  }

  async function handleSaveDocument() {
    if (!selectedPath || !canEditSelectedDocument) return;

    try {
      const saved = await window.brainDesktop?.saveDocument?.({
        relativePath: selectedPath,
        raw: draft,
      });

      if (!saved) return;

      setSelectedDocument(saved);
      setDraft(saved.raw);
      await loadVaultIndex();
      const refreshed = await window.brainDesktop?.refreshVault?.();
      if (refreshed) setGraphPayload(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save document.");
    }
  }

  async function handleCreateDocument() {
    if (!hasWritableVault) {
      setError("Open a real writable vault before creating documents.");
      return;
    }

    try {
      const relativePath = normalizeDocumentPath(newDocPath);
      if (!relativePath) throw new Error("Document path cannot be empty.");

      const fileTitle = titleFromPath(relativePath);
      const created = await window.brainDesktop?.createDocument?.({
        relativePath,
        raw: `# ${fileTitle}\n\n#brain-os\n`,
      });

      if (!created) return;

      await loadVaultIndex();
      const refreshed = await window.brainDesktop?.refreshVault?.();
      if (refreshed) setGraphPayload(refreshed);

      const folderParts = relativePath.split("/");
      if (folderParts.length > 1) {
        const folderPath = folderParts.slice(0, -1).join("/");
        setExpandedFolders((prev) => new Set([...prev, folderPath]));
      }

      await handleOpenDocument(created.relativePath);
      setSurface("workspace");
      setWorkspaceMode("content");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create document.");
    }
  }

  async function handleQuickCreateDocument(input: { relativePath: string; raw: string }) {
    if (!hasWritableVault) {
      setError("Open a real writable vault before creating documents.");
      return;
    }

    try {
      const relativePath = normalizeDocumentPath(input.relativePath);
      if (!relativePath) throw new Error("Document path cannot be empty.");

      const created = await window.brainDesktop?.createDocument?.({
        relativePath,
        raw: input.raw,
      });

      if (!created) return;

      await loadVaultIndex();
      const refreshed = await window.brainDesktop?.refreshVault?.();
      if (refreshed) setGraphPayload(refreshed);

      await handleOpenDocument(created.relativePath);
      setSurface("workspace");
      setWorkspaceMode("content");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quick note.");
    }
  }

  async function handleCreateFolder() {
    if (!hasWritableVault) {
      setError("Open a real writable vault before creating folders.");
      return;
    }

    try {
      const relativePath = normalizeFolderPath(newFolderPath);
      if (!relativePath) throw new Error("Folder path cannot be empty.");

      await window.brainDesktop?.createFolder?.({ relativePath });
      await loadVaultIndex();
      const refreshed = await window.brainDesktop?.refreshVault?.();
      if (refreshed) setGraphPayload(refreshed);

      setExpandedFolders((prev) => new Set([...prev, relativePath]));
      setSurface("workspace");
      setWorkspaceMode("content");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder.");
    }
  }

  function toggleExpanded(path: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  const commandActions = useMemo<WorkspaceCommand[]>(
    () => [
      { id: "open-vault", label: "Open vault", keywords: ["folder", "filesystem"], run: () => void handleChooseVault() },
      { id: "refresh", label: "Refresh vault", keywords: ["reload"], run: () => void handleRefresh() },
      { id: "sample", label: "Load sample graph", keywords: ["demo"], run: () => void handleLoadSample() },
      { id: "new-note", label: "Create new note", keywords: ["markdown"], run: () => void handleCreateDocument() },
      { id: "new-folder", label: "Create new folder", keywords: ["tree"], run: () => void handleCreateFolder() },
      { id: "graph-mode", label: "Switch to Graph mode", run: () => setWorkspaceMode("graph") },
      { id: "content-mode", label: "Switch to Content mode", run: () => setWorkspaceMode("content") },
      { id: "split-mode", label: "Switch to Split mode", run: () => setWorkspaceMode("split") },
      { id: "toggle-left", label: "Toggle library dock", run: () => setLeftRailOpen((value) => !value) },
      { id: "toggle-right", label: "Toggle insights dock", run: () => setRightRailOpen((value) => !value) },
      { id: "toggle-graph-fullscreen", label: "Toggle fullscreen graph", run: () => setGraphFullscreen((value) => !value) },
      { id: "surface-library", label: "Go to Library surface", run: () => setSurface("library") },
      { id: "surface-insights", label: "Go to Insights surface", run: () => setSurface("insights") },
      { id: "surface-settings", label: "Go to Settings surface", run: () => setSurface("settings") },
    ],
    [],
  );

  if (!graphPayload && status !== "error") {
    return <EmptyState onLoadSample={handleLoadSample} onChooseVault={handleChooseVault} />;
  }

  return (
    <div className={`app-shell app-shell--spatial ${platform === "darwin" ? "app-shell--mac" : ""}`}>
      <AppChrome
        surface={surface}
        setSurface={setSurface}
        status={status}
        payload={graphPayload}
      />

      <div className="shell-main shell-main--spatial">
        <WorkspaceTopbar
          surface={surface}
          workspaceMode={workspaceMode}
          setWorkspaceMode={setWorkspaceMode}
          settings={settings}
          onChooseVault={handleChooseVault}
          onRefresh={handleRefresh}
          onLoadSample={handleLoadSample}
          onOpenCommandBar={() => setCommandBarOpen(true)}
          platform={platform}
          leftRailOpen={leftRailOpen}
          setLeftRailOpen={setLeftRailOpen}
          rightRailOpen={rightRailOpen}
          setRightRailOpen={setRightRailOpen}
          graphFullscreen={graphFullscreen}
          setGraphFullscreen={setGraphFullscreen}
        />

        {error ? <div className="global-error">{error}</div> : null}

        <main className="shell-content shell-content--spatial">
          {surface === "workspace" ? (
            <SpatialWorkspace
              workspaceMode={workspaceMode}
              setWorkspaceMode={setWorkspaceMode}
              graphFullscreen={graphFullscreen}
              setGraphFullscreen={setGraphFullscreen}
              leftRailOpen={leftRailOpen}
              setLeftRailOpen={setLeftRailOpen}
              rightRailOpen={rightRailOpen}
              setRightRailOpen={setRightRailOpen}
              graphData={graphData}
              selectedNodeId={selectedNodeId}
              setSelectedNodeId={setSelectedNodeId}
              selectedGraphNode={selectedGraphNode}
              vaultIndex={vaultIndex}
              assets={assets}
              selectedPath={selectedPath}
              selectedDocument={selectedDocument}
              draft={draft}
              setDraft={setDraft}
              filteredDocuments={filteredDocuments}
              expandedFolders={expandedFolders}
              toggleExpanded={toggleExpanded}
              hasWritableVault={hasWritableVault}
              canEditSelectedDocument={canEditSelectedDocument}
              graphSearch={graphSearch}
              setGraphSearch={setGraphSearch}
              activeTag={activeTag}
              setActiveTag={setActiveTag}
              activeLayer={activeLayer}
              setActiveLayer={setActiveLayer}
              analysis={analysis}
              newFolderPath={newFolderPath}
              setNewFolderPath={setNewFolderPath}
              newDocPath={newDocPath}
              setNewDocPath={setNewDocPath}
              docsSearch={docsSearch}
              setDocsSearch={setDocsSearch}
              onOpenDocument={handleOpenDocument}
              onSaveDocument={handleSaveDocument}
              onCreateDocument={handleCreateDocument}
              onQuickCreateDocument={handleQuickCreateDocument}
              onCreateFolder={handleCreateFolder}
              onChooseVault={handleChooseVault}
            />
          ) : null}

          {surface === "library" ? (
            <SurfacePlaceholder
              title="Library"
              text="Library surface can expand into a card-based asset browser with previews, media intelligence and type filters."
            />
          ) : null}

          {surface === "insights" ? (
            <SurfacePlaceholder
              title="Insights"
              text="Use the graph as the spatial substrate and dock analytical tools as adaptive overlays."
            />
          ) : null}

          {surface === "settings" ? (
            <SurfacePlaceholder
              title="Settings"
              text={`Theme: ${settings.themeMode}. Density: ${settings.densityMode}.`}
            />
          ) : null}

          {surface === "legal" ? (
            <SurfacePlaceholder
              title="Legal + Trust"
              text="Legal, export, privacy and AI disclosure routes can be layered in without touching the workspace core."
            />
          ) : null}

          {surface === "account" ? (
            <SurfacePlaceholder
              title="Auth + Billing"
              text="The current build stays local-first. Auth and billing can remain optional."
            />
          ) : null}
        </main>
      </div>

      <WorkspaceCommandBar
        open={commandBarOpen}
        onClose={() => setCommandBarOpen(false)}
        commands={commandActions}
      />
    </div>
  );
}

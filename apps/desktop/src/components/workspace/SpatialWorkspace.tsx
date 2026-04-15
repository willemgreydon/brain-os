// apps/desktop/src/components/workspace/SpatialWorkspace.tsx
import React, { useMemo, useState } from "react";
import type { VaultDocument, VaultIndexPayload, VaultTreeNode } from "../../lib/types";
import type { WorkspaceMode } from "../../lib/app-shell";
import GraphCanvas3D from "../GraphCanvas3D";
import FloatingPanel from "./FloatingPanel";
import QuickNoteComposer from "./QuickNoteComposer";
import BacklinksTray from "./BacklinksTray";
import SmartNoteEditor from "./SmartNoteEditor";
import NoteIntelligencePanel from "./NoteIntelligencePanel";
import { buildNoteIntelligence } from "../../features/note-intelligence/note-intelligence";

type BrainAsset = {
  id: string;
  name: string;
  relativePath: string;
  folder: string;
  extension: string;
  type: string;
  sizeBytes: number;
  updatedAt: string;
  tags: string[];
  links: string[];
  wordCount?: number;
  raw?: string;
  metadata?: Record<string, unknown>;
};

type GraphNodeShape = {
  id: string;
  title?: string;
  type?: string;
  layer?: string;
  cluster?: string;
  tags?: string[];
  score?: number;
};

type GraphLinkShape = {
  source: string;
  target: string;
  weight?: number;
};

type GraphDataShape = {
  nodes: Array<
    GraphNodeShape & {
      color?: string;
      size?: number;
      relativePath?: string;
      groupKey?: string;
    }
  >;
  edges: Array<{
    source: string;
    target: string;
    size?: number;
    color?: string;
    kind?: string;
  }>;
  tags: string[];
};

type SpatialWorkspaceProps = {
  workspaceMode: WorkspaceMode;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  graphFullscreen: boolean;
  setGraphFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
  leftRailOpen: boolean;
  setLeftRailOpen: React.Dispatch<React.SetStateAction<boolean>>;
  rightRailOpen: boolean;
  setRightRailOpen: React.Dispatch<React.SetStateAction<boolean>>;

  graphData: GraphDataShape;
  selectedNodeId: string | null;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedGraphNode:
    | (GraphNodeShape & {
        id: string;
      })
    | null;

  vaultIndex: VaultIndexPayload | null;
  assets: BrainAsset[];
  selectedPath: string | null;
  selectedDocument: VaultDocument | null;
  draft: string;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
  liveDocuments: VaultDocument[];

  filteredDocuments: VaultDocument[];
  expandedFolders: Set<string>;
  toggleExpanded: (path: string) => void;

  hasWritableVault: boolean;
  canEditSelectedDocument: boolean;

  graphSearch: string;
  setGraphSearch: (value: string) => void;
  activeTag: string | null;
  setActiveTag: (value: string | null) => void;
  activeLayer: "all" | "markdown" | "code";
  setActiveLayer: (value: "all" | "markdown" | "code") => void;

  analysis: {
    words: number;
    lines: number;
    headings: number;
    tags: string[];
    links: string[];
  };

  newFolderPath: string;
  setNewFolderPath: React.Dispatch<React.SetStateAction<string>>;
  newDocPath: string;
  setNewDocPath: React.Dispatch<React.SetStateAction<string>>;
  docsSearch: string;
  setDocsSearch: React.Dispatch<React.SetStateAction<string>>;

  onOpenDocument: (relativePath: string) => Promise<void>;
  onSaveDocument: () => Promise<void>;
  onCreateDocument: () => Promise<void>;
  onCreateFolder: () => Promise<void>;
  onQuickCreateDocument: (input: { relativePath: string; raw: string }) => Promise<void>;
  onChooseVault: () => Promise<void> | void;
};

function renderMarkdownPreview(raw: string): string {
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .replace(/^###### (.*)$/gm, "<h6>$1</h6>")
    .replace(/^##### (.*)$/gm, "<h5>$1</h5>")
    .replace(/^#### (.*)$/gm, "<h4>$1</h4>")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[\[(.*?)\]\]/g, `<span class="preview-wikilink">[[$1]]</span>`)
    .replace(/\n\n+/g, "</p><p>")
    .replace(/\n/g, "<br />");
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

function titleFromPath(relativePath: string) {
  const file = relativePath.split("/").pop() || relativePath;
  return file.replace(/\.[^/.]+$/u, "");
}

function TreeNodeItem({
  node,
  selectedPath,
  expanded,
  toggleExpanded,
  onSelectFile,
}: {
  node: VaultTreeNode;
  selectedPath: string | null;
  expanded: Set<string>;
  toggleExpanded: (path: string) => void;
  onSelectFile: (path: string) => void;
}) {
  const isFolder = node.type === "folder";
  const isOpen = expanded.has(node.path);
  const isSelected = selectedPath === node.path;

  return (
    <div className="tree-node">
      <button
        className={`tree-node__row ${isSelected ? "tree-node__row--active" : ""}`}
        onClick={() => {
          if (isFolder) toggleExpanded(node.path);
          else onSelectFile(node.path);
        }}
      >
        <span className="tree-node__icon">{isFolder ? (isOpen ? "▾" : "▸") : "•"}</span>
        <span className="tree-node__label">{node.name}</span>
      </button>

      {isFolder && isOpen && node.children?.length ? (
        <div className="tree-node__children">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              selectedPath={selectedPath}
              expanded={expanded}
              toggleExpanded={toggleExpanded}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function GraphFiltersPanel({
  search,
  setSearch,
  activeLayer,
  setActiveLayer,
  activeTag,
  setActiveTag,
  tags,
}: {
  search: string;
  setSearch: (value: string) => void;
  activeLayer: "all" | "markdown" | "code";
  setActiveLayer: (value: "all" | "markdown" | "code") => void;
  activeTag: string | null;
  setActiveTag: (value: string | null) => void;
  tags: string[];
}) {
  return (
    <FloatingPanel
      title="Graph Filters"
      subtitle="Spatial clustering and semantic narrowing"
      className="workspace-overlay workspace-overlay--filters"
      compact
    >
      <div className="stack-sm">
        <input
          className="input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search nodes, tags, layers…"
        />

        <div className="filter-row">
          {(["all", "markdown", "code"] as const).map((layer) => (
            <button
              key={layer}
              className={activeLayer === layer ? "chip chip--active" : "chip"}
              onClick={() => setActiveLayer(layer)}
            >
              {layer}
            </button>
          ))}
        </div>

        <div className="subhead">Tag clustering</div>
        <div className="filter-row">
          <button
            className={activeTag === null ? "chip chip--active" : "chip"}
            onClick={() => setActiveTag(null)}
          >
            all tags
          </button>
          {tags.slice(0, 18).map((tag) => (
            <button
              key={tag}
              className={activeTag === tag ? "chip chip--active" : "chip"}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </FloatingPanel>
  );
}

function NodeInspector({
  selectedGraphNode,
  onOpenDocument,
}: {
  selectedGraphNode:
    | (GraphNodeShape & {
        id: string;
      })
    | null;
  onOpenDocument: (relativePath: string) => Promise<void>;
}) {
  return (
    <FloatingPanel
      title="Node Inspector"
      subtitle={selectedGraphNode ? "Live graph context" : "No selection"}
      className="workspace-overlay workspace-overlay--inspector"
    >
      {selectedGraphNode ? (
        <div className="stack-md">
          <div>
            <h3 className="node-details__title">
              {selectedGraphNode.title || selectedGraphNode.id}
            </h3>
            <p className="section-subline">
              {selectedGraphNode.layer || "unknown"} · {selectedGraphNode.cluster || "unclustered"}
            </p>
          </div>

          <div className="stats-grid stats-grid--two">
            <div className="stat-box">
              <span>ID</span>
              <strong>{selectedGraphNode.id}</strong>
            </div>
            <div className="stat-box">
              <span>Layer</span>
              <strong>{selectedGraphNode.layer || "—"}</strong>
            </div>
            <div className="stat-box">
              <span>Type</span>
              <strong>{selectedGraphNode.type || "—"}</strong>
            </div>
            <div className="stat-box">
              <span>Score</span>
              <strong>
                {typeof selectedGraphNode.score === "number" ? selectedGraphNode.score : "—"}
              </strong>
            </div>
          </div>

          {selectedGraphNode.id.includes("/") ? (
            <button
              className="btn btn--primary"
              onClick={() => void onOpenDocument(selectedGraphNode.id)}
            >
              Open in editor
            </button>
          ) : null}

          <div>
            <div className="subhead">Tags</div>
            <div className="pill-row">
              {(selectedGraphNode.tags || []).length ? (
                (selectedGraphNode.tags || []).map((tag) => (
                  <span key={tag} className="pill">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="muted">No tags</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="muted">Select a graph node to inspect it.</div>
      )}
    </FloatingPanel>
  );
}

function DockedEditor({
  selectedDocument,
  selectedPath,
  draft,
  setDraft,
  canEditSelectedDocument,
  onReload,
  onSave,
  rightRailOpen,
  liveDocuments,
}: {
  selectedDocument: VaultDocument | null;
  selectedPath: string | null;
  draft: string;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
  canEditSelectedDocument: boolean;
  onReload: () => void;
  onSave: () => void;
  rightRailOpen: boolean;
  liveDocuments: VaultDocument[];
}) {
  return (
    <div
      className={`workspace-dock workspace-dock--editor ${
        rightRailOpen ? "workspace-dock--editor-narrow" : ""
      }`}
    >
      <FloatingPanel
        title="Editor"
        subtitle={selectedDocument?.relativePath || "No document selected"}
        className="workspace-dock__panel"
        toolbar={
          <div className="inline-actions inline-actions--tight">
            <button className="btn btn--ghost btn--xs" onClick={onReload} disabled={!selectedPath}>
              Reload
            </button>
            <button
              className="btn btn--primary btn--xs"
              onClick={onSave}
              disabled={!canEditSelectedDocument}
            >
              Save
            </button>
          </div>
        }
      >
        {selectedDocument ? (
          <SmartNoteEditor
            selectedDocument={selectedDocument}
            draft={draft}
            setDraft={setDraft}
            canEditSelectedDocument={canEditSelectedDocument}
            allDocuments={liveDocuments}
          />
        ) : (
          <div className="workspace-empty-note">
            <div className="workspace-empty-note__title">No document selected</div>
            <div className="workspace-empty-note__text">
              Open a node or choose a file from the tree to start writing.
            </div>
          </div>
        )}
      </FloatingPanel>
    </div>
  );
}

function PreviewOverlay({
  selectedDocument,
  previewRaw,
}: {
  selectedDocument: VaultDocument | null;
  previewRaw: string;
}) {
  if (!selectedDocument) return null;

  const isMarkdown = selectedDocument.type === "markdown";

  return (
    <div className="workspace-dock workspace-dock--preview">
      <FloatingPanel
        title="Preview"
        subtitle={isMarkdown ? "Rendered markdown" : selectedDocument.type}
        className="workspace-dock__panel"
        subdued
      >
        {isMarkdown ? (
          <div
            className="preview-pane prose-reset"
            dangerouslySetInnerHTML={{
              __html: `<p>${renderMarkdownPreview(previewRaw)}</p>`,
            }}
          />
        ) : (
          <pre className="preview-code">
            <code>{previewRaw}</code>
          </pre>
        )}
      </FloatingPanel>
    </div>
  );
}

function LeftDock({
  hasWritableVault,
  onChooseVault,
  newFolderPath,
  setNewFolderPath,
  onCreateFolder,
  newDocPath,
  setNewDocPath,
  onCreateDocument,
  docsSearch,
  setDocsSearch,
  vaultIndex,
  expandedFolders,
  selectedPath,
  toggleExpanded,
  onOpenDocument,
  filteredDocuments,
}: {
  hasWritableVault: boolean;
  onChooseVault: () => Promise<void> | void;
  newFolderPath: string;
  setNewFolderPath: React.Dispatch<React.SetStateAction<string>>;
  onCreateFolder: () => Promise<void>;
  newDocPath: string;
  setNewDocPath: React.Dispatch<React.SetStateAction<string>>;
  onCreateDocument: () => Promise<void>;
  docsSearch: string;
  setDocsSearch: React.Dispatch<React.SetStateAction<string>>;
  vaultIndex: VaultIndexPayload | null;
  expandedFolders: Set<string>;
  selectedPath: string | null;
  toggleExpanded: (path: string) => void;
  onOpenDocument: (relativePath: string) => Promise<void>;
  filteredDocuments: VaultDocument[];
}) {
  return (
    <div className="workspace-dock workspace-dock--left">
      <FloatingPanel title="Library" subtitle="Vault structure, folders, files" className="workspace-dock__panel">
        {!hasWritableVault ? (
          <div className="workspace-empty-note workspace-empty-note--warning">
            <div className="workspace-empty-note__title">Open a real vault to create notes</div>
            <div className="workspace-empty-note__text">
              In sample mode the graph is visible, but filesystem note creation and saving are disabled.
            </div>
            <div className="workspace-empty-note__actions">
              <button className="btn btn--primary" onClick={() => void onChooseVault()}>
                Open real vault
              </button>
            </div>
          </div>
        ) : null}

        <div className="stack-sm">
          <div className="inline-actions">
            <input
              className="input"
              value={newFolderPath}
              onChange={(event) => setNewFolderPath(event.target.value)}
              placeholder="notes/research"
            />
            <button
              className="btn"
              onClick={() => void onCreateFolder()}
              disabled={!hasWritableVault || !normalizeFolderPath(newFolderPath)}
            >
              New folder
            </button>
          </div>

          <div className="inline-actions">
            <input
              className="input"
              value={newDocPath}
              onChange={(event) => setNewDocPath(event.target.value)}
              placeholder="notes/new-note.md"
            />
            <button
              className="btn btn--primary"
              onClick={() => void onCreateDocument()}
              disabled={!hasWritableVault || !normalizeDocumentPath(newDocPath)}
            >
              New note
            </button>
          </div>

          <input
            className="input"
            value={docsSearch}
            onChange={(event) => setDocsSearch(event.target.value)}
            placeholder="Filter files, paths, tags…"
          />
        </div>

        <div className="tree-wrap">
          {vaultIndex?.tree?.length ? (
            vaultIndex.tree.map((node) => (
              <TreeNodeItem
                key={node.id}
                node={node}
                selectedPath={selectedPath}
                expanded={expandedFolders}
                toggleExpanded={toggleExpanded}
                onSelectFile={(path) => void onOpenDocument(path)}
              />
            ))
          ) : (
            <div className="muted">No tree available. Open a vault or create your first folder.</div>
          )}
        </div>

        <div className="list-stack">
          {filteredDocuments.length ? (
            filteredDocuments.map((doc) => (
              <button
                key={doc.relativePath}
                className={`list-item ${selectedPath === doc.relativePath ? "list-item--active" : ""}`}
                onClick={() => void onOpenDocument(doc.relativePath)}
              >
                <span className="list-item__content">
                  <strong>{doc.name}</strong>
                  <span>{doc.relativePath}</span>
                </span>
                <span className="list-item__meta">{doc.wordCount}w</span>
              </button>
            ))
          ) : (
            <div className="muted">No documents match the current filter.</div>
          )}
        </div>
      </FloatingPanel>
    </div>
  );
}

function RightRailStack({
  rightRailOpen,
  selectedGraphNode,
  onOpenDocument,
  analysis,
  selectedDocument,
  hasWritableVault,
  onQuickCreateDocument,
  intelligence,
}: {
  rightRailOpen: boolean;
  selectedGraphNode:
    | (GraphNodeShape & {
        id: string;
      })
    | null;
  onOpenDocument: (relativePath: string) => Promise<void>;
  analysis: {
    words: number;
    lines: number;
    headings: number;
    tags: string[];
    links: string[];
  };
  selectedDocument: VaultDocument | null;
  hasWritableVault: boolean;
  onQuickCreateDocument: (input: { relativePath: string; raw: string }) => Promise<void>;
  intelligence: ReturnType<typeof buildNoteIntelligence>;
}) {
  if (!rightRailOpen) return null;

  return (
    <div className="workspace-rail-stack workspace-rail-stack--right">
      <NodeInspector
        selectedGraphNode={selectedGraphNode}
        onOpenDocument={onOpenDocument}
      />

      <div className="workspace-rail-stack__analysis">
        <FloatingPanel
          title="Analysis"
          subtitle="Live document metrics"
          className="workspace-dock__panel"
          subdued
        >
          <div className="stats-grid stats-grid--two">
            <div className="stat-box">
              <span>Words</span>
              <strong>{analysis.words}</strong>
            </div>
            <div className="stat-box">
              <span>Lines</span>
              <strong>{analysis.lines}</strong>
            </div>
            <div className="stat-box">
              <span>Headings</span>
              <strong>{analysis.headings}</strong>
            </div>
            <div className="stat-box">
              <span>Links</span>
              <strong>{analysis.links.length}</strong>
            </div>
          </div>

          <div className="stack-md">
            <div>
              <div className="subhead">Detected Tags</div>
              <div className="pill-row">
                {analysis.tags.length ? (
                  analysis.tags.map((tag) => (
                    <span key={tag} className="pill">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="muted">No tags detected.</span>
                )}
              </div>
            </div>
          </div>
        </FloatingPanel>
      </div>

      <div className="workspace-rail-stack__intelligence">
        <NoteIntelligencePanel
          intelligence={intelligence}
          onOpenDocument={onOpenDocument}
        />
      </div>

      <div className="workspace-rail-stack__composer">
        <QuickNoteComposer
          enabled={hasWritableVault}
          onCreate={async ({ relativePath, raw }) => {
            await onQuickCreateDocument({ relativePath, raw });
          }}
        />
      </div>
    </div>
  );
}

export default function SpatialWorkspace({
  workspaceMode,
  graphFullscreen,
  setGraphFullscreen,
  leftRailOpen,
  rightRailOpen,
  graphData,
  selectedNodeId,
  setSelectedNodeId,
  selectedGraphNode,
  vaultIndex,
  assets,
  selectedPath,
  selectedDocument,
  draft,
  setDraft,
  liveDocuments,
  filteredDocuments,
  expandedFolders,
  toggleExpanded,
  hasWritableVault,
  canEditSelectedDocument,
  graphSearch,
  setGraphSearch,
  activeTag,
  setActiveTag,
  activeLayer,
  setActiveLayer,
  analysis,
  newFolderPath,
  setNewFolderPath,
  newDocPath,
  setNewDocPath,
  docsSearch,
  setDocsSearch,
  onOpenDocument,
  onSaveDocument,
  onCreateDocument,
  onCreateFolder,
  onQuickCreateDocument,
  onChooseVault,
}: SpatialWorkspaceProps) {
  const [focusMode, setFocusMode] = useState(true);
  const [backlinksMinimized, setBacklinksMinimized] = useState(false);

  const backlinks = useMemo(() => {
    if (!selectedDocument) return [];
    const currentBase = titleFromPath(selectedDocument.relativePath).toLowerCase();

    return assets.filter((asset) => {
      if (asset.relativePath === selectedDocument.relativePath) return false;
      return asset.links.some((link) => titleFromPath(link).toLowerCase() === currentBase);
    });
  }, [assets, selectedDocument]);

  const intelligence = useMemo(
    () => buildNoteIntelligence(selectedDocument, liveDocuments),
    [liveDocuments, selectedDocument],
  );

  const graphNodes3D = useMemo(
    () =>
      graphData.nodes.map((node) => ({
        id: node.id,
        title: node.title || node.id,
        type: node.type,
        layer: typeof node.layer === "string" ? node.layer : undefined,
        cluster: node.cluster || "unknown",
        tags: node.tags || [],
        score: node.score,
      })),
    [graphData.nodes],
  );

  const graphLinks3D = useMemo<GraphLinkShape[]>(
    () =>
      graphData.edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        weight: typeof edge.size === "number" ? edge.size : 1,
      })),
    [graphData.edges],
  );

  return (
    <div
      className={`workspace-canvas ${
        focusMode ? "workspace-canvas--focus" : ""
      } ${graphFullscreen ? "workspace-canvas--graph-fullscreen" : ""}`}
    >
      <div className="workspace-canvas__atmosphere" aria-hidden="true" />
      <div className="workspace-canvas__noise" aria-hidden="true" />

      <div className="workspace-canvas__graph">
        <GraphCanvas3D
          className="workspace-canvas__graph-surface"
          nodes={graphNodes3D}
          links={graphLinks3D}
          selectedNodeId={selectedNodeId}
          onSelectNode={(node) => {
            const nextId = node?.id ?? null;
            setSelectedNodeId(nextId);
            if (nextId && nextId.includes("/")) {
              void onOpenDocument(nextId);
            }
          }}
          isFullscreen={graphFullscreen}
          onEnterFullscreen={() => setGraphFullscreen(true)}
          onExitFullscreen={() => setGraphFullscreen(false)}
        />
      </div>

      <div className="workspace-canvas__hud">
        <div className="workspace-canvas__hud-left">
          <button
            className="workspace-canvas__mode-toggle"
            onClick={() => setFocusMode((value) => !value)}
          >
            {focusMode ? "Disable focus mode" : "Enable focus mode"}
          </button>
        </div>

        <div className="workspace-canvas__hud-right">
          <div className="workspace-canvas__badge">
            <span>{graphData.nodes.length} nodes</span>
            <span>{graphData.edges.length} links</span>
            <span>{workspaceMode}</span>
          </div>
        </div>
      </div>

      {leftRailOpen ? (
        <LeftDock
          hasWritableVault={hasWritableVault}
          onChooseVault={onChooseVault}
          newFolderPath={newFolderPath}
          setNewFolderPath={setNewFolderPath}
          onCreateFolder={onCreateFolder}
          newDocPath={newDocPath}
          setNewDocPath={setNewDocPath}
          onCreateDocument={onCreateDocument}
          docsSearch={docsSearch}
          setDocsSearch={setDocsSearch}
          vaultIndex={vaultIndex}
          expandedFolders={expandedFolders}
          selectedPath={selectedPath}
          toggleExpanded={toggleExpanded}
          onOpenDocument={onOpenDocument}
          filteredDocuments={filteredDocuments}
        />
      ) : null}

      <GraphFiltersPanel
        search={graphSearch}
        setSearch={setGraphSearch}
        activeLayer={activeLayer}
        setActiveLayer={setActiveLayer}
        activeTag={activeTag}
        setActiveTag={setActiveTag}
        tags={graphData.tags}
      />

      <RightRailStack
        rightRailOpen={rightRailOpen}
        selectedGraphNode={selectedGraphNode}
        onOpenDocument={onOpenDocument}
        analysis={analysis}
        selectedDocument={selectedDocument}
        hasWritableVault={hasWritableVault}
        onQuickCreateDocument={onQuickCreateDocument}
        intelligence={intelligence}
      />

      {selectedDocument ? (
        <>
          <DockedEditor
            selectedDocument={selectedDocument}
            selectedPath={selectedPath}
            draft={draft}
            setDraft={setDraft}
            canEditSelectedDocument={canEditSelectedDocument}
            onReload={() => {
              if (selectedPath) void onOpenDocument(selectedPath);
            }}
            onSave={() => void onSaveDocument()}
            rightRailOpen={rightRailOpen}
            liveDocuments={liveDocuments}
          />

          {workspaceMode === "split" ? (
            <PreviewOverlay selectedDocument={selectedDocument} previewRaw={draft} />
          ) : null}
        </>
      ) : null}

      <BacklinksTray
        items={backlinks}
        minimized={backlinksMinimized}
        onToggleMinimized={() => setBacklinksMinimized((value) => !value)}
        onOpenItem={onOpenDocument}
      />
    </div>
  );
}

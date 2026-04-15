// apps/desktop/src/components/graph/GraphResearchControls.tsx
import React from "react";
import type {
  ResearchNeighborhoodDepth,
  ResearchNodeGroupMode,
  Viewpoint,
} from "../../features/graph-research/types";

type GraphResearchControlsProps = {
  neighborhoodDepth: ResearchNeighborhoodDepth;
  onNeighborhoodDepthChange: (depth: ResearchNeighborhoodDepth) => void;
  groupMode: ResearchNodeGroupMode;
  onGroupModeChange: (mode: ResearchNodeGroupMode) => void;
  pathFromId: string | null;
  setPathFromId: (id: string | null) => void;
  pathToId: string | null;
  setPathToId: (id: string | null) => void;
  selectedNodeId: string | null;
  pinnedNodeIds: string[];
  onTogglePinNode: (nodeId: string) => void;
  onClearIsolation: () => void;
  savedViewpoints: Viewpoint[];
  onSaveViewpoint: () => void;
  onLoadViewpoint: (viewpoint: Viewpoint) => void;
  timelineIndex: number;
  onTimelineIndexChange: (value: number) => void;
  nodeOptions: Array<{ id: string; label: string }>;
};

export default function GraphResearchControls({
  neighborhoodDepth,
  onNeighborhoodDepthChange,
  groupMode,
  onGroupModeChange,
  pathFromId,
  setPathFromId,
  pathToId,
  setPathToId,
  selectedNodeId,
  pinnedNodeIds,
  onTogglePinNode,
  onClearIsolation,
  savedViewpoints,
  onSaveViewpoint,
  onLoadViewpoint,
  timelineIndex,
  onTimelineIndexChange,
  nodeOptions,
}: GraphResearchControlsProps) {
  return (
    <section className="research-panel">
      <div className="research-panel__header">
        <div>
          <p className="research-panel__eyebrow">Research Controls</p>
          <h3 className="research-panel__title">Analytical graph tools</h3>
        </div>
      </div>

      <div className="research-stack">
        <div className="research-group">
          <label className="research-label">Neighborhood depth</label>
          <div className="filter-row">
            {[1, 2, "full"].map((depth) => (
              <button
                key={String(depth)}
                className={neighborhoodDepth === depth ? "chip chip--active" : "chip"}
                onClick={() => onNeighborhoodDepthChange(depth as ResearchNeighborhoodDepth)}
              >
                {String(depth)}
              </button>
            ))}
            <button className="chip" onClick={onClearIsolation}>
              Clear isolate
            </button>
          </div>
        </div>

        <div className="research-group">
          <label className="research-label">Grouping</label>
          <div className="filter-row">
            {(["none", "tag", "folder", "layer", "semantic", "linkDensity"] as const).map((mode) => (
              <button
                key={mode}
                className={groupMode === mode ? "chip chip--active" : "chip"}
                onClick={() => onGroupModeChange(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="research-group">
          <label className="research-label">Semantic path</label>
          <div className="research-grid">
            <select
              className="input"
              value={pathFromId ?? ""}
              onChange={(event) => setPathFromId(event.target.value || null)}
            >
              <option value="">From node</option>
              {nodeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className="input"
              value={pathToId ?? ""}
              onChange={(event) => setPathToId(event.target.value || null)}
            >
              <option value="">To node</option>
              {nodeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="research-group">
          <label className="research-label">Pinned nodes</label>
          <div className="inline-actions">
            <button
              className="btn btn--ghost btn--xs"
              disabled={!selectedNodeId}
              onClick={() => selectedNodeId && onTogglePinNode(selectedNodeId)}
            >
              {selectedNodeId && pinnedNodeIds.includes(selectedNodeId) ? "Unpin selected" : "Pin selected"}
            </button>
            <span className="muted">{pinnedNodeIds.length} pinned</span>
          </div>
        </div>

        <div className="research-group">
          <label className="research-label">Saved viewpoints</label>
          <div className="inline-actions">
            <button className="btn btn--ghost btn--xs" onClick={onSaveViewpoint}>
              Save current view
            </button>
          </div>
          <div className="list-stack list-stack--compact">
            {savedViewpoints.length ? (
              savedViewpoints.map((viewpoint) => (
                <button
                  key={viewpoint.id}
                  className="list-item list-item--soft"
                  onClick={() => onLoadViewpoint(viewpoint)}
                >
                  <span className="list-item__content">
                    <strong>{viewpoint.label}</strong>
                    <span>{String(viewpoint.neighborhoodDepth)} · {viewpoint.groupMode}</span>
                  </span>
                </button>
              ))
            ) : (
              <div className="muted">No saved viewpoints.</div>
            )}
          </div>
        </div>

        <div className="research-group">
          <label className="research-label">Timeline / replay</label>
          <input
            type="range"
            min={0}
            max={100}
            value={timelineIndex}
            onChange={(event) => onTimelineIndexChange(Number(event.target.value))}
          />
        </div>
      </div>
    </section>
  );
}

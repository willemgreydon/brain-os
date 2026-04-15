// apps/desktop/src/components/workspace/BacklinksTray.tsx
import React from "react";
import FloatingPanel from "./FloatingPanel";

type BacklinksTrayItem = {
  id: string;
  name: string;
  relativePath: string;
};

type BacklinksTrayProps = {
  items: BacklinksTrayItem[];
  minimized: boolean;
  onToggleMinimized: () => void;
  onOpenItem: (relativePath: string) => Promise<void> | void;
};

export default function BacklinksTray({
  items,
  minimized,
  onToggleMinimized,
  onOpenItem,
}: BacklinksTrayProps) {
  return (
    <FloatingPanel
      title="Backlinks"
      subtitle={minimized ? `${items.length} hidden` : `${items.length} related notes`}
      className="workspace-overlay workspace-overlay--tray"
      toolbar={
        <button className="btn btn--ghost btn--xs" onClick={onToggleMinimized}>
          {minimized ? "Expand" : "Minimize"}
        </button>
      }
      compact
    >
      {!minimized ? (
        <div className="list-stack list-stack--compact">
          {items.length ? (
            items.map((item) => (
              <button
                key={item.id}
                className="list-item list-item--soft"
                onClick={() => void onOpenItem(item.relativePath)}
              >
                <span className="list-item__content">
                  <strong>{item.name}</strong>
                  <span>{item.relativePath}</span>
                </span>
              </button>
            ))
          ) : (
            <div className="muted">No backlinks detected.</div>
          )}
        </div>
      ) : null}
    </FloatingPanel>
  );
}

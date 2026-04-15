// apps/desktop/src/components/workspace/WorkspaceCommandBar.tsx
import React, { useMemo, useState } from "react";

export type WorkspaceCommand = {
  id: string;
  label: string;
  keywords?: string[];
  run: () => void;
};

type WorkspaceCommandBarProps = {
  open: boolean;
  onClose: () => void;
  commands: WorkspaceCommand[];
};

export default function WorkspaceCommandBar({
  open,
  onClose,
  commands,
}: WorkspaceCommandBarProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;

    return commands.filter((command) =>
      [command.label, ...(command.keywords || [])]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [commands, query]);

  if (!open) return null;

  return (
    <div className="workspace-commandbar__backdrop" onClick={onClose}>
      <div
        className="workspace-commandbar"
        role="dialog"
        aria-modal="true"
        aria-label="Command bar"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="workspace-commandbar__input-wrap">
          <input
            autoFocus
            className="workspace-commandbar__input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Jump to surfaces, documents, graph modes, actions…"
          />
        </div>

        <div className="workspace-commandbar__results">
          {filtered.length ? (
            filtered.map((command) => (
              <button
                key={command.id}
                className="workspace-commandbar__item"
                onClick={() => {
                  command.run();
                  onClose();
                }}
              >
                <span className="workspace-commandbar__item-label">{command.label}</span>
              </button>
            ))
          ) : (
            <div className="workspace-commandbar__empty">No matching actions.</div>
          )}
        </div>
      </div>
    </div>
  );
}

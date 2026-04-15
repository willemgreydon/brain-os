import React, { useMemo, useState } from "react";

export type CommandPaletteAction = {
  id: string;
  label: string;
  keywords?: string[];
  onRun: () => void;
};

export function CommandPalette({
  open,
  onClose,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  actions: CommandPaletteAction[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;

    return actions.filter((action) => {
      const haystack = [action.label, ...(action.keywords || [])].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [actions, query]);

  if (!open) return null;

  return (
    <div className="command-palette__backdrop" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="input"
          placeholder="Search commands…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="command-palette__list">
          {filtered.length ? (
            filtered.map((action) => (
              <button
                key={action.id}
                className="command-palette__item"
                onClick={() => {
                  action.onRun();
                  onClose();
                }}
              >
                {action.label}
              </button>
            ))
          ) : (
            <div className="muted">No matching commands.</div>
          )}
        </div>
      </div>
    </div>
  );
}

import React from "react";

type TagFilterBarProps = {
  allTags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
};

export function TagFilterBar({
  allTags,
  selectedTags,
  onToggle,
  onClear,
}: TagFilterBarProps) {
  return (
    <div className="panel studio-panel">
      <div className="panel__head">
        <p className="section-kicker">Tag Filter</p>
        {selectedTags.length ? (
          <button className="btn" onClick={onClear}>
            Clear
          </button>
        ) : null}
      </div>

      <div className="pill-row">
        {allTags.length ? (
          allTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                className={`pill ${active ? "pill--active" : ""}`}
                onClick={() => onToggle(tag)}
              >
                {tag}
              </button>
            );
          })
        ) : (
          <span className="empty-inline">No tags indexed.</span>
        )}
      </div>
    </div>
  );
}

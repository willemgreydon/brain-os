import React from "react";

export type SplitViewMode = "editor" | "preview" | "split";

type SplitViewToggleProps = {
  mode: SplitViewMode;
  onChange: (mode: SplitViewMode) => void;
};

export function SplitViewToggle({ mode, onChange }: SplitViewToggleProps) {
  return (
    <div className="view-switch" aria-label="Split view mode">
      <button
        className={`view-switch__btn ${mode === "editor" ? "view-switch__btn--active" : ""}`}
        onClick={() => onChange("editor")}
      >
        Editor
      </button>
      <button
        className={`view-switch__btn ${mode === "split" ? "view-switch__btn--active" : ""}`}
        onClick={() => onChange("split")}
      >
        Split
      </button>
      <button
        className={`view-switch__btn ${mode === "preview" ? "view-switch__btn--active" : ""}`}
        onClick={() => onChange("preview")}
      >
        Preview
      </button>
    </div>
  );
}

// apps/desktop/src/components/workspace/QuickNoteComposer.tsx
import React, { useState } from "react";
import FloatingPanel from "./FloatingPanel";

type QuickNoteComposerProps = {
  enabled: boolean;
  onCreate: (input: { relativePath: string; raw: string }) => Promise<void> | void;
};

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function QuickNoteComposer({
  enabled,
  onCreate,
}: QuickNoteComposerProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  async function handleCreate() {
    const safeTitle = title.trim();
    if (!safeTitle) return;

    const relativePath = `notes/${slugify(safeTitle) || "quick-note"}.md`;
    const raw = `# ${safeTitle}\n\n${body.trim()}\n`;

    await onCreate({ relativePath, raw });
    setTitle("");
    setBody("");
  }

  return (
    <FloatingPanel
      title="Quick Note"
      subtitle="Capture without leaving the workspace"
      className="workspace-overlay workspace-overlay--composer"
      compact
    >
      <div className="stack-sm">
        <input
          className="input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Untitled thought"
          disabled={!enabled}
        />

        <textarea
          className="editor editor--composer"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a quick note, thought, or insight…"
          disabled={!enabled}
        />

        <div className="inline-actions inline-actions--tight">
          <button
            className="btn btn--primary"
            onClick={() => void handleCreate()}
            disabled={!enabled || !title.trim()}
          >
            Save note
          </button>
        </div>
      </div>
    </FloatingPanel>
  );
}

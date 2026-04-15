// apps/desktop/src/components/workspace/SmartNoteEditor.tsx
import React, { useMemo, useRef, useState } from "react";
import type { VaultDocument } from "../../lib/types";
import {
  extractActiveWikilinkQuery,
  suggestWikilinks,
} from "../../features/note-intelligence/note-intelligence";

type SmartNoteEditorProps = {
  selectedDocument: VaultDocument | null;
  draft: string;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
  canEditSelectedDocument: boolean;
  allDocuments: VaultDocument[];
};

function titleFromPath(relativePath: string) {
  const file = relativePath.split("/").pop() || relativePath;
  return file.replace(/\.[^/.]+$/u, "");
}

export default function SmartNoteEditor({
  selectedDocument,
  draft,
  setDraft,
  canEditSelectedDocument,
  allDocuments,
}: SmartNoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activeQuery = useMemo(
    () => extractActiveWikilinkQuery(draft, cursorPosition),
    [draft, cursorPosition],
  );

  const wikilinkSuggestions = useMemo(() => {
    if (!activeQuery) return [];
    const rawSuggestions = suggestWikilinks(
      draft,
      allDocuments,
      selectedDocument?.relativePath || null,
    );

    const query = activeQuery.query.trim().toLowerCase();
    if (!query) return rawSuggestions;

    return rawSuggestions.filter((item) => {
      const title = titleFromPath(item.relativePath).toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.relativePath.toLowerCase().includes(query) ||
        title.includes(query)
      );
    });
  }, [activeQuery, allDocuments, draft, selectedDocument?.relativePath]);

  function applyWikilink(relativePath: string) {
    if (!activeQuery) return;

    const title = titleFromPath(relativePath);
    const before = draft.slice(0, activeQuery.start);
    const after = draft.slice(activeQuery.end);
    const nextValue = `${before}${title}]]${after}`;

    setDraft(nextValue);

    requestAnimationFrame(() => {
      const nextCursor = before.length + title.length + 2;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
      setCursorPosition(nextCursor);
      setSelectedIndex(0);
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!wikilinkSuggestions.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) => Math.min(current + 1, wikilinkSuggestions.length - 1));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter" && activeQuery) {
      event.preventDefault();
      const target = wikilinkSuggestions[selectedIndex];
      if (target) applyWikilink(target.relativePath);
    }

    if (event.key === "Escape") {
      setSelectedIndex(0);
    }
  }

  return (
    <div className="smart-editor">
      <textarea
        ref={textareaRef}
        className="editor editor--docked"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setCursorPosition(event.target.selectionStart ?? 0);
        }}
        onClick={(event) => {
          setCursorPosition((event.target as HTMLTextAreaElement).selectionStart ?? 0);
        }}
        onKeyUp={(event) => {
          setCursorPosition((event.target as HTMLTextAreaElement).selectionStart ?? 0);
        }}
        onKeyDown={handleKeyDown}
        disabled={!canEditSelectedDocument}
        placeholder="# New note"
      />

      {activeQuery && wikilinkSuggestions.length ? (
        <div className="smart-editor__autocomplete">
          <div className="smart-editor__autocomplete-head">
            Wikilink suggestions
          </div>
          <div className="smart-editor__autocomplete-list">
            {wikilinkSuggestions.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`smart-editor__autocomplete-item ${
                  index === selectedIndex ? "smart-editor__autocomplete-item--active" : ""
                }`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  applyWikilink(item.relativePath);
                }}
              >
                <span className="smart-editor__autocomplete-main">
                  <strong>{item.title}</strong>
                  <span>{item.relativePath}</span>
                </span>
                <span className="smart-editor__autocomplete-score">
                  {(item.score * 100).toFixed(0)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

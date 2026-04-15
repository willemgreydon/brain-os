import React, { useEffect, useState } from "react";

type FolderCreateModalProps = {
  open: boolean;
  initialPath?: string;
  onClose: () => void;
  onCreate: (relativePath: string) => Promise<void>;
};

export function FolderCreateModal({
  open,
  initialPath,
  onClose,
  onCreate,
}: FolderCreateModalProps) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValue(initialPath || "");
  }, [open, initialPath]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next = value.trim().replace(/^\/+|\/+$/g, "");
    if (!next) return;

    setBusy(true);
    try {
      await onCreate(next);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-card__header">
          <div>
            <p className="section-kicker">Folder</p>
            <h3 className="details-title">Create new folder</h3>
          </div>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="modal-card__body" onSubmit={handleSubmit}>
          <label className="field">
            <span className="meta-item__label">Relative path</span>
            <input
              className="search-input"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="knowledge/research/new-folder"
              autoFocus
            />
          </label>

          <div className="modal-card__footer">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? "Creating…" : "Create folder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

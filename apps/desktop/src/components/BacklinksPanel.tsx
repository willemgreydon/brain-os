import React from "react";

type VaultDocument = {
  id: string;
  name: string;
  relativePath: string;
  folder: string;
  raw: string;
  tags: string[];
  links: string[];
  wordCount: number;
  updatedAt: string;
};

type BacklinksPanelProps = {
  backlinks: VaultDocument[];
  onOpen: (relativePath: string) => void;
};

export function BacklinksPanel({ backlinks, onOpen }: BacklinksPanelProps) {
  return (
    <div className="analysis-block">
      <div className="panel__head">
        <p className="meta-item__label">Backlinks</p>
        <span className="section-count">{backlinks.length}</span>
      </div>

      {backlinks.length ? (
        <div className="doc-list">
          {backlinks.map((doc) => (
            <button
              key={doc.relativePath}
              className="doc-list__item"
              onClick={() => onOpen(doc.relativePath)}
            >
              <strong>{doc.name}</strong>
              <span>{doc.relativePath}</span>
              <span>{doc.wordCount} words</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-inline">No backlinks found.</div>
      )}
    </div>
  );
}

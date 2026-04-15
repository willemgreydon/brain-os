import React from "react";
import { getPreviewMode, renderMarkdownPreview } from "../lib/preview-registry";

type PreviewAsset = {
  name: string;
  type: string;
  raw?: string;
  relativePath: string;
};

export function PreviewPane({ asset }: { asset: PreviewAsset | null }) {
  if (!asset) {
    return (
      <section className="panel">
        <div className="panel__head">
          <p className="panel__kicker">Preview</p>
        </div>
        <div className="muted">Select a document or asset to preview it.</div>
      </section>
    );
  }

  const mode = getPreviewMode(asset.type);

  return (
    <section className="panel panel--editor">
      <div className="panel__head">
        <p className="panel__kicker">Preview</p>
        <span className="panel__meta">{mode}</span>
      </div>

      {mode === "markdown-preview" && (
        <div
          className="preview-pane prose-reset"
          dangerouslySetInnerHTML={{
            __html: `<p>${renderMarkdownPreview(asset.raw || "")}</p>`,
          }}
        />
      )}

      {mode === "code-view" && (
        <pre className="preview-code">
          <code>{asset.raw || ""}</code>
        </pre>
      )}

      {mode === "text-view" && (
        <pre className="preview-code">
          <code>{asset.raw || ""}</code>
        </pre>
      )}

      {mode === "pdf-placeholder" && (
        <div className="preview-placeholder">
          <strong>PDF preview placeholder</strong>
          <p>
            PDF viewer should lazy-load here later. Current asset: {asset.relativePath}
          </p>
        </div>
      )}

      {mode === "table-placeholder" && (
        <div className="preview-placeholder">
          <strong>Structured table preview placeholder</strong>
          <p>
            CSV/table viewer should render here later. Current asset: {asset.relativePath}
          </p>
        </div>
      )}

      {mode === "image-placeholder" && (
        <div className="preview-placeholder">
          <strong>Image preview placeholder</strong>
          <p>
            Image renderer should mount here later. Current asset: {asset.relativePath}
          </p>
        </div>
      )}

      {mode === "unknown" && (
        <div className="preview-placeholder">
          <strong>Unknown asset preview</strong>
          <p>No preview strategy defined yet for this file type.</p>
        </div>
      )}
    </section>
  );
}

import React, { useState } from "react";
import { legalDocuments } from "../lib/legal-documents";

export function LegalView() {
  const [selectedId, setSelectedId] = useState(legalDocuments[0]?.id || null);
  const selected = legalDocuments.find((item) => item.id === selectedId) || legalDocuments[0];

  return (
    <div className="surface-grid">
      <section className="panel">
        <div className="panel__head">
          <p className="panel__kicker">Legal Documents</p>
        </div>

        <div className="stack-sm">
          {legalDocuments.map((doc) => (
            <button
              key={doc.id}
              className={`list-item ${selectedId === doc.id ? "list-item--active" : ""}`}
              onClick={() => setSelectedId(doc.id)}
            >
              <span className="list-item__content">
                <strong>{doc.title}</strong>
                <span>{doc.summary}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel panel--span-2">
        <div className="panel__head">
          <p className="panel__kicker">{selected.title}</p>
        </div>

        <div className="preview-pane prose-reset">
          <pre className="preview-code">
            <code>{selected.body}</code>
          </pre>
        </div>
      </section>
    </div>
  );
}

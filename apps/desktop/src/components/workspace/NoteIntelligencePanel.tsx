// apps/desktop/src/components/workspace/NoteIntelligencePanel.tsx
import React from "react";
import type { NoteIntelligenceResult } from "../../features/note-intelligence/types";

type NoteIntelligencePanelProps = {
  intelligence: NoteIntelligenceResult | null;
  onOpenDocument: (relativePath: string) => Promise<void> | void;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("de-AT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function NoteIntelligencePanel({
  intelligence,
  onOpenDocument,
}: NoteIntelligencePanelProps) {
  if (!intelligence) {
    return (
      <section className="panel">
        <div className="panel__head">
          <p className="panel__kicker">Note Intelligence</p>
        </div>
        <div className="muted">Select a note to activate note intelligence.</div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel__head">
        <p className="panel__kicker">Note Intelligence</p>
        <span className="panel__meta">{intelligence.health.score}/100</span>
      </div>

      <div className="stats-grid stats-grid--two">
        <div className="stat-box">
          <span>Reading time</span>
          <strong>{intelligence.metadata.readingTimeMinutes} min</strong>
        </div>
        <div className="stat-box">
          <span>Graph role</span>
          <strong>{intelligence.metadata.graphRole}</strong>
        </div>
        <div className="stat-box">
          <span>Inbound</span>
          <strong>{intelligence.metadata.inboundLinks}</strong>
        </div>
        <div className="stat-box">
          <span>Outbound</span>
          <strong>{intelligence.metadata.outboundLinks}</strong>
        </div>
      </div>

      <div className="note-health">
        <div className="note-health__head">
          <strong>Health status</strong>
          <span>{intelligence.health.status}</span>
        </div>
        <div className="note-health__bar">
          <div
            className="note-health__fill"
            style={{ width: `${intelligence.health.score}%` }}
          />
        </div>
        <div className="stack-sm">
          {intelligence.health.reasons.length ? (
            intelligence.health.reasons.map((reason) => (
              <div key={reason} className="muted">
                • {reason}
              </div>
            ))
          ) : (
            <div className="muted">No issues detected.</div>
          )}
        </div>
      </div>

      <div className="stack-md">
        <div>
          <div className="subhead">Last changed</div>
          <div className="muted">{formatDate(intelligence.metadata.lastChanged)}</div>
        </div>

        <div>
          <div className="subhead">Semantic neighbors</div>
          <div className="list-stack list-stack--compact">
            {intelligence.semanticNeighbors.length ? (
              intelligence.semanticNeighbors.map((item) => (
                <button
                  key={item.id}
                  className="list-item list-item--soft"
                  onClick={() => void onOpenDocument(item.relativePath)}
                >
                  <span className="list-item__content">
                    <strong>{item.title}</strong>
                    <span>{item.reason}</span>
                  </span>
                  <span className="list-item__meta">{(item.score * 100).toFixed(0)}%</span>
                </button>
              ))
            ) : (
              <div className="muted">No semantic neighbors yet.</div>
            )}
          </div>
        </div>

        <div>
          <div className="subhead">Related notes</div>
          <div className="list-stack list-stack--compact">
            {intelligence.relatedNotes.length ? (
              intelligence.relatedNotes.map((item) => (
                <button
                  key={item.id}
                  className="list-item list-item--soft"
                  onClick={() => void onOpenDocument(item.relativePath)}
                >
                  <span className="list-item__content">
                    <strong>{item.title}</strong>
                    <span>{item.reason}</span>
                  </span>
                  <span className="list-item__meta">{(item.score * 100).toFixed(0)}%</span>
                </button>
              ))
            ) : (
              <div className="muted">No related notes yet.</div>
            )}
          </div>
        </div>

        <div>
          <div className="subhead">Backlinks</div>
          <div className="list-stack list-stack--compact">
            {intelligence.backlinks.length ? (
              intelligence.backlinks.map((item) => (
                <button
                  key={item.id}
                  className="list-item list-item--soft"
                  onClick={() => void onOpenDocument(item.relativePath)}
                >
                  <span className="list-item__content">
                    <strong>{item.title}</strong>
                    <span>{item.reason}</span>
                  </span>
                </button>
              ))
            ) : (
              <div className="muted">No backlinks detected.</div>
            )}
          </div>
        </div>

        <div>
          <div className="subhead">Bridge note suggestions</div>
          <div className="list-stack list-stack--compact">
            {intelligence.bridgeSuggestions.length ? (
              intelligence.bridgeSuggestions.map((bridge) => (
                <div key={`${bridge.leftCluster}-${bridge.rightCluster}`} className="bridge-card">
                  <div className="bridge-card__title">
                    {bridge.leftCluster} → {bridge.rightCluster}
                  </div>
                  <div className="muted">{bridge.reason}</div>
                  <div className="stack-sm">
                    {bridge.candidateNotes.map((item) => (
                      <button
                        key={item.id}
                        className="list-item list-item--soft"
                        onClick={() => void onOpenDocument(item.relativePath)}
                      >
                        <span className="list-item__content">
                          <strong>{item.title}</strong>
                          <span>{item.reason}</span>
                        </span>
                        <span className="list-item__meta">{(item.score * 100).toFixed(0)}%</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="muted">No bridge-note suggestions yet.</div>
            )}
          </div>
        </div>

        <div>
          <div className="subhead">Duplicate candidates</div>
          <div className="list-stack list-stack--compact">
            {intelligence.duplicateCandidates.length ? (
              intelligence.duplicateCandidates.map((item) => (
                <button
                  key={item.id}
                  className="list-item list-item--soft"
                  onClick={() => void onOpenDocument(item.relativePath)}
                >
                  <span className="list-item__content">
                    <strong>{item.title}</strong>
                    <span>{item.reason}</span>
                  </span>
                  <span className="list-item__meta">{(item.score * 100).toFixed(0)}%</span>
                </button>
              ))
            ) : (
              <div className="muted">No duplicate candidates detected.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

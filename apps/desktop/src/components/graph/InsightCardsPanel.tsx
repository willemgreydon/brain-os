// apps/desktop/src/components/graph/InsightCardsPanel.tsx
import React from "react";
import type { StructuralInsightCard } from "../../features/graph-research/types";

type InsightCardsPanelProps = {
  cards: StructuralInsightCard[];
  onFocusNodes?: (nodeIds: string[]) => void;
};

function severityClass(severity: StructuralInsightCard["severity"]) {
  if (severity === "high") return "insight-card--high";
  if (severity === "medium") return "insight-card--medium";
  return "insight-card--low";
}

export default function InsightCardsPanel({
  cards,
  onFocusNodes,
}: InsightCardsPanelProps) {
  return (
    <section className="research-panel">
      <div className="research-panel__header">
        <div>
          <p className="research-panel__eyebrow">Insight Cards</p>
          <h3 className="research-panel__title">Structural findings</h3>
        </div>
      </div>

      <div className="insight-cards">
        {cards.length ? (
          cards.map((card) => (
            <article
              key={card.id}
              className={`insight-card ${severityClass(card.severity)}`}
            >
              <div className="insight-card__meta">
                <span className="insight-card__type">{card.type.replaceAll("_", " ")}</span>
                <span className="insight-card__severity">{card.severity}</span>
              </div>
              <h4 className="insight-card__title">{card.title}</h4>
              <p className="insight-card__body">{card.body}</p>
              <div className="insight-card__footer">
                <span className="insight-card__count">{card.nodeIds.length} nodes</span>
                <button
                  className="btn btn--ghost btn--xs"
                  onClick={() => onFocusNodes?.(card.nodeIds)}
                >
                  Focus
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="muted">No structural findings yet.</div>
        )}
      </div>
    </section>
  );
}

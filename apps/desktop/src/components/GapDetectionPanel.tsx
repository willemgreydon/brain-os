import { motion } from "framer-motion";
import { Panel, Pill } from "@brain/ui";
import type { KnowledgeGap } from "@brain/ai-gap-engine";

const severityStyles: Record<KnowledgeGap["severity"], string> = {
  low: "bg-emerald-300/15 text-emerald-100 border-emerald-300/25",
  medium: "bg-amber-300/15 text-amber-100 border-amber-300/25",
  high: "bg-rose-300/15 text-rose-100 border-rose-300/25"
};

export function GapDetectionPanel({ gaps }: { gaps: KnowledgeGap[] }) {
  return (
    <Panel title="Knowledge Gaps" kicker="AI detection" className="h-[48%] overflow-hidden">
      <div className="h-full overflow-auto pr-1">
        <div className="space-y-3">
          {gaps.map((gap, index) => (
            <motion.article key={gap.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 shadow-glow">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">{gap.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/55">{gap.reason}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${severityStyles[gap.severity]}`}>
                  {gap.severity}
                </span>
              </div>
              <div className="mb-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-3 text-sm leading-6 text-cyan-50">
                {gap.recommendedBridge}
              </div>
              <div className="flex flex-wrap gap-2">
                {gap.nodesInvolved.map((nodeId) => <Pill key={nodeId}>{nodeId}</Pill>)}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </Panel>
  );
}

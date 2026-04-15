import { motion } from "framer-motion";
import { Panel, Pill } from "@brain/ui";
import type { GraphData } from "@brain/graph-core";
import { useAppStore } from "@/lib/store";

export function NodeDetails({ graph }: { graph: GraphData }) {
  const selectedNodeId = useAppStore((state) => state.selectedNodeId);
  const node = graph.nodes.find((item) => item.id === selectedNodeId) ?? graph.nodes[0];
  const neighbors = graph.edges.filter((edge) => edge.source === node.id || edge.target === node.id);

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Panel title="Node Details" kicker="Inspector">
        <motion.div key={node.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">{node.title}</h3>
              <p className="text-sm text-white/55">{node.type} · {node.layer}</p>
            </div>
            <Pill active>{Math.round((node.score ?? 0) * 100)}%</Pill>
          </div>

          <div className="space-y-3 text-sm text-white/65">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="mb-1 text-[11px] uppercase tracking-[0.24em] text-white/40">Role</div>
              <div>{node.role ?? "—"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="mb-1 text-[11px] uppercase tracking-[0.24em] text-white/40">Path</div>
              <div className="break-all">{node.filePath ?? "sample note"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-white/40">Tags</div>
              <div className="flex flex-wrap gap-2">{node.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-white/40">Connected edges</div>
              <div className="space-y-2">
                {neighbors.slice(0, 8).map((edge, index) => (
                  <div key={`${edge.source}-${edge.target}-${index}`} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2">
                    <span className="truncate text-white/74">{edge.label ?? edge.kind}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-white/40">{edge.kind}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </Panel>
    </div>
  );
}

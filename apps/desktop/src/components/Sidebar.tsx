import { motion } from "framer-motion";
import { Panel, Pill } from "@brain/ui";
import { useAppStore } from "@/lib/store";

const tree = [
  { label: "00 Core" },
  { label: "01 Identity" },
  { label: "02 Knowledge", children: ["00 Meta", "01 Domains", "02 Concepts", "03 Methods", "04 Models", "05 References", "06 Strategy"] },
  { label: "03 Systems" },
  { label: "04 Projects" },
  { label: "05 Output" },
  { label: "06 Archive" }
];

export function Sidebar() {
  const vault = useAppStore((state) => state.vault);

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-5 rounded-[28px] border border-white/10 bg-white/[0.06] p-4 shadow-glow backdrop-blur-xl">
        <p className="text-[11px] uppercase tracking-[0.32em] text-white/45">Brain OS</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Knowledge Graph Theater</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill active>Local-first</Pill>
          <Pill>3D</Pill>
          <Pill>Semantic</Pill>
        </div>
        <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-3 text-xs text-white/58">
          <div className="mb-1 uppercase tracking-[0.2em] text-white/36">Active source</div>
          <div className="font-medium text-white/82">{vault.source === "vault" ? vault.vaultPath : "Sample vault"}</div>
          <div className="mt-2 text-white/50">{vault.noteCount} notes indexed</div>
        </div>
      </div>

      <Panel title="Knowledge Tree" kicker="Navigation" className="flex-1 overflow-hidden">
        <div className="h-[calc(100vh-330px)] overflow-auto pr-1">
          <nav className="space-y-2">
            {tree.map((section, index) => (
              <motion.div
                key={section.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-2xl border border-transparent bg-white/[0.03] p-3 hover:border-white/10 hover:bg-white/[0.05]"
              >
                <div className="text-sm font-medium text-white/85">{section.label}</div>
                {section.children ? (
                  <div className="mt-2 space-y-1 pl-3 text-sm text-white/50">
                    {section.children.map((child) => (
                      <div key={child} className="rounded-xl px-2 py-1 transition hover:bg-white/[0.05] hover:text-white/80">
                        {child}
                      </div>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            ))}
          </nav>
        </div>
      </Panel>
    </div>
  );
}

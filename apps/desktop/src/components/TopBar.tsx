import { cn, Pill } from "@brain/ui";
import { useAppStore } from "@/lib/store";

type TopBarProps = {
  onChooseVault: () => void;
  onRefreshVault: () => void;
  status: "booting" | "ready" | "loading" | "error";
};

export function TopBar({ onChooseVault, onRefreshVault, status }: TopBarProps) {
  const graphMode = useAppStore((state) => state.graphMode);
  const setGraphMode = useAppStore((state) => state.setGraphMode);
  const accessibilityMode = useAppStore((state) => state.accessibilityMode);
  const toggleAccessibilityMode = useAppStore((state) => state.toggleAccessibilityMode);

  return (
    <div className="absolute left-6 right-6 top-6 z-20 flex items-center justify-between rounded-full border border-white/10 bg-black/25 px-5 py-3 shadow-glow backdrop-blur-2xl">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">Cognitive graph interface</p>
        <h2 className="text-lg font-semibold tracking-tight text-white">Real Vault Import + Semantic Flow</h2>
      </div>
      <div className="flex items-center gap-2">
        {(["3d", "focus", "cluster"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setGraphMode(mode)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium capitalize transition",
              graphMode === mode
                ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            {mode}
          </button>
        ))}
        <button onClick={onChooseVault} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:bg-white/10">
          Import vault
        </button>
        <button onClick={onRefreshVault} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:bg-white/10">
          Refresh
        </button>
        <button onClick={toggleAccessibilityMode} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:bg-white/10">
          {accessibilityMode ? "Reduce motion on" : "Reduce motion off"}
        </button>
        <Pill active={status === "ready"}>{status}</Pill>
      </div>
    </div>
  );
}

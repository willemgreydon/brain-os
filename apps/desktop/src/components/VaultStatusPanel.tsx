import { Panel, Pill } from "@brain/ui";
import { useAppStore } from "@/lib/store";

type VaultStatusPanelProps = {
  status: "booting" | "ready" | "loading" | "error";
  error: string | null;
};

export function VaultStatusPanel({ status, error }: VaultStatusPanelProps) {
  const vault = useAppStore((state) => state.vault);

  return (
    <Panel title="Vault Status" kicker="Watcher + import" className="h-[30%]">
      <div className="space-y-3 text-sm text-white/65">
        <div className="flex flex-wrap gap-2">
          <Pill active={status === "ready"}>status: {status}</Pill>
          <Pill active={vault.source === "vault"}>source: {vault.source}</Pill>
          <Pill>{vault.noteCount} notes</Pill>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="mb-1 text-[11px] uppercase tracking-[0.24em] text-white/40">Vault path</div>
          <div className="break-all">{vault.vaultPath ?? "Using built-in sample vault"}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="mb-1 text-[11px] uppercase tracking-[0.24em] text-white/40">Last update</div>
          <div>{vault.lastUpdatedAt ?? "—"}</div>
        </div>
        {error ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-3 text-rose-100">{error}</div>
        ) : (
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/10 p-3 text-emerald-50">Vault watcher is ready. Any markdown add, change or delete will re-index automatically.</div>
        )}
      </div>
    </Panel>
  );
}

import * as React from "react";

export function cn(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(" ");
}

export function AppShell({ sidebar, main, aside }: { sidebar: React.ReactNode; main: React.ReactNode; aside: React.ReactNode }) {
  return (
    <div className="grid h-screen grid-cols-[300px_minmax(0,1fr)_380px] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_28%),linear-gradient(180deg,#07111d_0%,#091926_100%)] text-white">
      <aside className="border-r border-white/10 bg-white/[0.045] backdrop-blur-2xl">{sidebar}</aside>
      <main className="relative overflow-hidden border-r border-white/10 bg-black/15">{main}</main>
      <aside className="bg-white/[0.045] backdrop-blur-2xl">{aside}</aside>
    </div>
  );
}

export function Panel({ title, kicker, children, className }: { title: string; kicker?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl", className)}>
      <div className="mb-4">
        {kicker ? <p className="mb-1 text-[11px] uppercase tracking-[0.28em] text-white/45">{kicker}</p> : null}
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function Pill({ children, active = false, subtle = false }: { children: React.ReactNode; active?: boolean; subtle?: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition",
      active ? "border-cyan-300/35 bg-cyan-300/12 text-cyan-100" : subtle ? "border-white/6 bg-white/[0.04] text-white/50" : "border-white/10 bg-white/[0.06] text-white/68"
    )}>
      {children}
    </span>
  );
}

export function MetricCard({ label, value, caption }: { label: string; value: string | number; caption?: string }) {
  return (
    <Panel title={String(value)} kicker={label} className="px-4 py-3">
      {caption ? <div className="mt-1 text-xs text-white/45">{caption}</div> : null}
    </Panel>
  );
}

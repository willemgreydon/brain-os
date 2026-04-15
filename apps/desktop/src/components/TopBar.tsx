// components/TopBar.tsx
import React from "react";
import { cn, Pill } from "@brain/ui";
import { useAppStore } from "@/lib/store";

type TopBarProps = {
  onChooseVault: () => void;
  onRefreshVault: () => void;
  status: "booting" | "ready" | "loading" | "error";
};

const VIEW_MODE_OPTIONS = [
  {
    value: "graph" as const,
    label: "Graph",
    description: "Graph-first workspace",
  },
  {
    value: "content" as const,
    label: "Content",
    description: "Writing-focused workspace",
  },
  {
    value: "split" as const,
    label: "Split",
    description: "Graph and content side by side",
  },
];

const GRAPH_MODE_OPTIONS = [
  {
    value: "3d" as const,
    label: "3D",
    description: "Spatial network view",
  },
  {
    value: "focus" as const,
    label: "Focus",
    description: "Reduced visual noise",
  },
  {
    value: "cluster" as const,
    label: "Clusters",
    description: "Grouped concept view",
  },
];

function getStatusLabel(status: TopBarProps["status"]) {
  switch (status) {
    case "booting":
      return "Starting";
    case "loading":
      return "Loading";
    case "ready":
      return "Ready";
    case "error":
      return "Error";
    default:
      return status;
  }
}

export function TopBar({ onChooseVault, onRefreshVault, status }: TopBarProps) {
  const viewMode = useAppStore((state) => state.viewMode);
  const setViewMode = useAppStore((state) => state.setViewMode);

  const graphMode = useAppStore((state) => state.graphMode);
  const setGraphMode = useAppStore((state) => state.setGraphMode);

  const accessibilityMode = useAppStore((state) => state.accessibilityMode);
  const toggleAccessibilityMode = useAppStore((state) => state.toggleAccessibilityMode);

  return (
    <header
      className="absolute left-6 right-6 top-6 z-20 rounded-[28px] border border-white/10 bg-black/30 shadow-glow backdrop-blur-2xl"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="flex min-h-[92px] items-center justify-between gap-6 px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">
            Cognitive workspace
          </p>

          <div className="mt-1 flex items-center gap-3">
            <h2 className="truncate text-lg font-semibold tracking-tight text-white">
              Knowledge Graph Workspace
            </h2>

            <span className="hidden rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-white/45 md:inline-flex">
              Real Vault + Semantic Flow
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/45">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
              View: {viewMode}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
              Graph mode: {graphMode}
            </span>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center justify-end gap-3"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            {VIEW_MODE_OPTIONS.map((option) => {
              const isActive = viewMode === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setViewMode(option.value)}
                  title={option.description}
                  aria-pressed={isActive}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "border border-cyan-300/40 bg-cyan-300/15 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.08)]"
                      : "border border-transparent bg-transparent text-white/65 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="hidden h-6 w-px bg-white/10 xl:block" />

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            {GRAPH_MODE_OPTIONS.map((option) => {
              const isActive = graphMode === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGraphMode(option.value)}
                  title={option.description}
                  aria-pressed={isActive}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "border border-violet-300/35 bg-violet-300/12 text-violet-100 shadow-[0_0_0_1px_rgba(196,181,253,0.08)]"
                      : "border border-transparent bg-transparent text-white/65 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="hidden h-6 w-px bg-white/10 xl:block" />

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={onChooseVault}
              className="rounded-full border border-transparent bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/10 hover:bg-white/10 hover:text-white"
            >
              Open vault
            </button>

            <button
              type="button"
              onClick={onRefreshVault}
              className="rounded-full border border-transparent bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/10 hover:bg-white/10 hover:text-white"
            >
              Refresh
            </button>
          </div>

          <div className="hidden h-6 w-px bg-white/10 xl:block" />

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={toggleAccessibilityMode}
              aria-pressed={accessibilityMode}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                accessibilityMode
                  ? "border border-emerald-300/35 bg-emerald-300/12 text-emerald-100"
                  : "border border-transparent bg-white/5 text-white/70 hover:border-white/10 hover:bg-white/10 hover:text-white"
              )}
            >
              {accessibilityMode ? "Reduced motion on" : "Reduced motion off"}
            </button>
          </div>

          <Pill active={status === "ready"}>{getStatusLabel(status)}</Pill>
        </div>
      </div>
    </header>
  );
}

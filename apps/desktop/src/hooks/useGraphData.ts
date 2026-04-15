import { useAppStore } from "@/lib/store";

export function useGraphData() {
  const graph = useAppStore((state) => state.graph);
  const gaps = useAppStore((state) => state.gaps);
  return { graph, gaps };
}

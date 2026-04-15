import { useMemo } from "react";

export function useGraphInteractions(nodes: any[], links: any[], activeId: string | null) {
  return useMemo(() => {
    if (!activeId) return { visibleNodes: nodes, visibleLinks: links };

    const connected = new Set<string>([activeId]);

    links.forEach((l) => {
      const s = typeof l.source === "string" ? l.source : l.source.id;
      const t = typeof l.target === "string" ? l.target : l.target.id;

      if (s === activeId) connected.add(t);
      if (t === activeId) connected.add(s);
    });

    return {
      visibleNodes: nodes.map((n) => ({
        ...n,
        faded: !connected.has(n.id),
      })),
      visibleLinks: links.map((l) => {
        const s = typeof l.source === "string" ? l.source : l.source.id;
        const t = typeof l.target === "string" ? l.target : l.target.id;

        return {
          ...l,
          faded: !(connected.has(s) && connected.has(t)),
        };
      }),
    };
  }, [nodes, links, activeId]);
}

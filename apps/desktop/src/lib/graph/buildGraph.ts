import { Note } from "@/store/useVault";

export function buildGraph(notes: Note[]) {
  const nodes = notes.map((note, i) => ({
    id: note.id,
    label: note.title,
    x: Math.cos(i) * 50,
    y: Math.sin(i) * 50,
    size: 8,
    color: "#4979ff",
  }));

  const edges: any[] = [];

  notes.forEach((note) => {
    const matches = note.content.match(/\[\[(.*?)\]\]/g);

    if (!matches) return;

    matches.forEach((match) => {
      const targetTitle = match.replace("[[", "").replace("]]", "");

      const target = notes.find((n) => n.title === targetTitle);

      if (target) {
        edges.push({
          id: `${note.id}-${target.id}`,
          source: note.id,
          target: target.id,
        });
      }
    });
  });

  return { nodes, edges };
}

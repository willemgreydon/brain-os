import matter from "gray-matter";
import path from "node:path";
import type { GraphData, GraphEdge, GraphNode, KnowledgeNodeType } from "@brain/graph-core";
import { annotateGraph, buildTagEdges, dedupeEdges } from "../../graph-core/src/index";
import { buildSemanticEdges } from "../../semantic-engine/src/index";

const WIKI_LINK_REGEX = /\[\[(.*?)(?:\|.*?)?\]\]/g;

export type ParsedNote = GraphNode & {
  links: string[];
};

export type SourceDocument = {
  id: string;
  filePath: string;
  raw: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function parseMarkdownNote(input: SourceDocument): ParsedNote {
  const { data, content } = matter(input.raw);
  const title = String(data.title ?? path.basename(input.filePath, ".md"));
  const folder = path.dirname(input.filePath).replace(/\\/g, "/");
  const links = [...content.matchAll(WIKI_LINK_REGEX)].map((match) => match[1].trim());

  return {
    id: input.id || slugify(title),
    title,
    filePath: input.filePath,
    folder,
    type: (data.type ?? "note") as KnowledgeNodeType,
    layer: String(data.layer ?? inferLayerFromPath(folder)),
    role: data.role ? String(data.role) : undefined,
    status: data.status ? (String(data.status) as GraphNode["status"]) : "active",
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    content,
    links,
    cluster: data.cluster ? String(data.cluster) : inferCluster(folder, data.layer)
  };
}

function inferLayerFromPath(filePath: string) {
  const normalized = filePath.toLowerCase();
  if (normalized.includes("identity")) return "identity";
  if (normalized.includes("knowledge")) return "knowledge";
  if (normalized.includes("systems")) return "systems";
  if (normalized.includes("projects")) return "projects";
  if (normalized.includes("output")) return "output";
  if (normalized.includes("archive")) return "archive";
  return "knowledge";
}

function inferCluster(folder: string, explicitLayer?: unknown) {
  const last = folder.split("/").filter(Boolean).pop();
  return last || String(explicitLayer ?? "general");
}

function buildHierarchyEdges(nodes: GraphNode[]): GraphEdge[] {
  const byFolder = new Map<string, string[]>();
  for (const node of nodes) {
    const folder = node.folder || "root";
    byFolder.set(folder, [...(byFolder.get(folder) ?? []), node.id]);
  }

  const edges: GraphEdge[] = [];
  for (const [folder, ids] of byFolder.entries()) {
    if (ids.length < 2) continue;
    const root = ids[0];
    for (let i = 1; i < ids.length; i += 1) {
      edges.push({ source: root, target: ids[i], weight: 0.18, kind: "hierarchy", label: `folder: ${folder}` });
    }
  }
  return edges;
}

export function buildGraphFromNotes(notes: ParsedNote[]): GraphData {
  const edges: GraphEdge[] = [];
  const titleIndex = new Map<string, string>();

  for (const note of notes) {
    titleIndex.set(note.title.toLowerCase(), note.id);
    titleIndex.set(note.id.toLowerCase(), note.id);
    titleIndex.set(slugify(note.title), note.id);
  }

  for (const note of notes) {
    for (const link of note.links) {
      const target = titleIndex.get(link.toLowerCase()) || titleIndex.get(slugify(link));
      if (target) {
        edges.push({ source: note.id, target, weight: 1, kind: "wikilink", label: "wikilink" });
      }
    }
  }

  const nodes: GraphNode[] = notes.map(({ links, ...rest }) => rest);
  const semanticEdges = buildSemanticEdges(nodes, edges);
  return annotateGraph({
    nodes,
    edges: dedupeEdges([...edges, ...buildTagEdges(nodes), ...buildHierarchyEdges(nodes), ...semanticEdges])
  });
}

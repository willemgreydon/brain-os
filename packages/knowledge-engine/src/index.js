import matter from "gray-matter";
import path from "node:path";
import { annotateGraph, buildTagEdges, dedupeEdges } from "@brain/graph-core";
import { buildSemanticEdges } from "@brain/semantic-engine";
const WIKI_LINK_REGEX = /\[\[(.*?)(?:\|.*?)?\]\]/g;
function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}
export function parseMarkdownNote(input) {
    const { data, content } = matter(input.raw);
    const title = String(data.title ?? path.basename(input.filePath, ".md"));
    const folder = path.dirname(input.filePath).replace(/\\/g, "/");
    const links = [...content.matchAll(WIKI_LINK_REGEX)].map((match) => match[1].trim());
    return {
        id: input.id || slugify(title),
        title,
        filePath: input.filePath,
        folder,
        type: (data.type ?? "note"),
        layer: String(data.layer ?? inferLayerFromPath(folder)),
        role: data.role ? String(data.role) : undefined,
        status: data.status ? String(data.status) : "active",
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        content,
        links,
        cluster: data.cluster ? String(data.cluster) : inferCluster(folder, data.layer)
    };
}
function inferLayerFromPath(filePath) {
    const normalized = filePath.toLowerCase();
    if (normalized.includes("identity"))
        return "identity";
    if (normalized.includes("knowledge"))
        return "knowledge";
    if (normalized.includes("systems"))
        return "systems";
    if (normalized.includes("projects"))
        return "projects";
    if (normalized.includes("output"))
        return "output";
    if (normalized.includes("archive"))
        return "archive";
    return "knowledge";
}
function inferCluster(folder, explicitLayer) {
    const last = folder.split("/").filter(Boolean).pop();
    return last || String(explicitLayer ?? "general");
}
function buildHierarchyEdges(nodes) {
    const byFolder = new Map();
    for (const node of nodes) {
        const folder = node.folder || "root";
        byFolder.set(folder, [...(byFolder.get(folder) ?? []), node.id]);
    }
    const edges = [];
    for (const [folder, ids] of byFolder.entries()) {
        if (ids.length < 2)
            continue;
        const root = ids[0];
        for (let i = 1; i < ids.length; i += 1) {
            edges.push({ source: root, target: ids[i], weight: 0.18, kind: "hierarchy", label: `folder: ${folder}` });
        }
    }
    return edges;
}
export function buildGraphFromNotes(notes) {
    const edges = [];
    const titleIndex = new Map();
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
    const nodes = notes.map(({ links, ...rest }) => rest);
    const semanticEdges = buildSemanticEdges(nodes, edges);
    return annotateGraph({
        nodes,
        edges: dedupeEdges([...edges, ...buildTagEdges(nodes), ...buildHierarchyEdges(nodes), ...semanticEdges])
    });
}

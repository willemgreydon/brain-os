// apps/desktop/src/features/note-intelligence/note-intelligence.ts
import type { VaultDocument } from "../../lib/types";
import type {
  BridgeSuggestion,
  NoteHealth,
  NoteHealthStatus,
  NoteIntelligenceResult,
  NoteMetadataSummary,
  SuggestedNote,
} from "./types";

type IndexedDocument = VaultDocument & {
  tokenSet: Set<string>;
};

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "into",
  "your",
  "you",
  "are",
  "was",
  "were",
  "used",
  "und",
  "der",
  "die",
  "das",
  "mit",
  "von",
  "ist",
  "ein",
  "eine",
  "im",
  "in",
  "zu",
  "auf",
  "als",
]);

function titleFromPath(relativePath: string) {
  const file = relativePath.split("/").pop() || relativePath;
  return file.replace(/\.[^/.]+$/u, "");
}

function tokenize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9äöüß\s/_-]/gi, " ")
    .split(/[\s/_-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function buildTokenSet(doc: VaultDocument) {
  return new Set([
    ...tokenize(doc.name),
    ...tokenize(doc.relativePath),
    ...tokenize(doc.raw || ""),
    ...doc.tags.map((tag) => tag.replace(/^#/, "").toLowerCase()),
    ...doc.links.map((link) => titleFromPath(link).toLowerCase()),
  ]);
}

function overlapScore(a: Set<string>, b: Set<string>) {
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function sharedOutgoingLinksScore(a: VaultDocument, b: VaultDocument) {
  const left = new Set(a.links.map((link) => titleFromPath(link).toLowerCase()));
  const right = new Set(b.links.map((link) => titleFromPath(link).toLowerCase()));
  let matches = 0;

  for (const link of left) {
    if (right.has(link)) matches += 1;
  }

  const max = Math.max(left.size, right.size, 1);
  return matches / max;
}

function sharedTagsScore(a: VaultDocument, b: VaultDocument) {
  const left = new Set(a.tags.map((tag) => tag.replace(/^#/, "").toLowerCase()));
  const right = new Set(b.tags.map((tag) => tag.replace(/^#/, "").toLowerCase()));
  let matches = 0;

  for (const tag of left) {
    if (right.has(tag)) matches += 1;
  }

  const max = Math.max(left.size, right.size, 1);
  return matches / max;
}

function inboundLinkCount(target: VaultDocument, docs: VaultDocument[]) {
  const base = titleFromPath(target.relativePath).toLowerCase();

  return docs.filter((doc) => {
    if (doc.relativePath === target.relativePath) return false;
    return doc.links.some((link) => titleFromPath(link).toLowerCase() === base);
  }).length;
}

function readingTimeMinutes(raw: string) {
  const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 220));
}

function inferGraphRole(input: {
  inbound: number;
  outbound: number;
  duplicateScore: number;
  daysSinceChange: number | null;
}): NoteHealthStatus {
  if (input.duplicateScore >= 0.8) return "duplicate_candidate";
  if (input.daysSinceChange !== null && input.daysSinceChange > 180) return "outdated";
  if (input.inbound === 0 && input.outbound === 0) return "orphan";
  if (input.inbound + input.outbound <= 2) return "underlinked";
  if (input.inbound >= 4 || input.outbound >= 6) return "high_value_hub";
  return "healthy";
}

function buildHealth(input: {
  inbound: number;
  outbound: number;
  duplicateScore: number;
  daysSinceChange: number | null;
  semanticNeighbors: number;
}): NoteHealth {
  const reasons: string[] = [];
  let score = 50;

  if (input.inbound === 0 && input.outbound === 0) {
    score -= 35;
    reasons.push("No inbound or outbound links.");
  }

  if (input.inbound + input.outbound <= 2) {
    score -= 15;
    reasons.push("Weakly linked note.");
  }

  if (input.semanticNeighbors >= 3) {
    score += 12;
    reasons.push("Semantically connected to nearby notes.");
  }

  if (input.inbound >= 4 || input.outbound >= 6) {
    score += 18;
    reasons.push("Acts as a graph hub.");
  }

  if (input.daysSinceChange !== null && input.daysSinceChange > 180) {
    score -= 12;
    reasons.push("Potentially outdated.");
  }

  if (input.duplicateScore >= 0.8) {
    score -= 18;
    reasons.push("Likely duplicate or overlapping note.");
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    status: inferGraphRole({
      inbound: input.inbound,
      outbound: input.outbound,
      duplicateScore: input.duplicateScore,
      daysSinceChange: input.daysSinceChange,
    }),
    reasons,
  };
}

function daysSince(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function sortSuggestions(items: SuggestedNote[]) {
  return [...items].sort((a, b) => b.score - a.score);
}

export function buildNoteIntelligence(
  selectedDocument: VaultDocument | null,
  allDocuments: VaultDocument[],
): NoteIntelligenceResult | null {
  if (!selectedDocument) return null;

  const indexed: IndexedDocument[] = allDocuments.map((doc) => ({
    ...doc,
    tokenSet: buildTokenSet(doc),
  }));

  const current = indexed.find((doc) => doc.relativePath === selectedDocument.relativePath);
  if (!current) return null;

  const others = indexed.filter((doc) => doc.relativePath !== current.relativePath);

  const backlinks: SuggestedNote[] = others
    .filter((doc) =>
      doc.links.some(
        (link) =>
          titleFromPath(link).toLowerCase() === titleFromPath(current.relativePath).toLowerCase(),
      ),
    )
    .map((doc) => ({
      id: doc.id,
      title: doc.name,
      relativePath: doc.relativePath,
      reason: "Links back to the current note.",
      score: 1,
    }));

  const relatedNotes: SuggestedNote[] = sortSuggestions(
    others
      .map((doc) => {
        const tagScore = sharedTagsScore(current, doc);
        const semanticScore = overlapScore(current.tokenSet, doc.tokenSet);
        const outgoingScore = sharedOutgoingLinksScore(current, doc);
        const total = tagScore * 0.4 + semanticScore * 0.45 + outgoingScore * 0.15;

        return {
          id: doc.id,
          title: doc.name,
          relativePath: doc.relativePath,
          reason:
            tagScore > semanticScore
              ? "Shared tags and topical overlap."
              : "Semantic similarity and overlapping language.",
          score: Number(total.toFixed(3)),
        };
      })
      .filter((item) => item.score >= 0.12)
      .slice(0, 8),
  );

  const semanticNeighbors: SuggestedNote[] = sortSuggestions(
    others
      .map((doc) => ({
        id: doc.id,
        title: doc.name,
        relativePath: doc.relativePath,
        reason: "Similar language and concept framing.",
        score: Number(overlapScore(current.tokenSet, doc.tokenSet).toFixed(3)),
      }))
      .filter((item) => item.score >= 0.18)
      .slice(0, 8),
  );

  const duplicateCandidates: SuggestedNote[] = sortSuggestions(
    others
      .map((doc) => ({
        id: doc.id,
        title: doc.name,
        relativePath: doc.relativePath,
        reason: "Potential duplicate or overlapping scope.",
        score: Number(
          (
            overlapScore(current.tokenSet, doc.tokenSet) * 0.75 +
            sharedTagsScore(current, doc) * 0.25
          ).toFixed(3),
        ),
      }))
      .filter((item) => item.score >= 0.55)
      .slice(0, 4),
  );

  const clusterGroups = new Map<string, IndexedDocument[]>();
  for (const doc of others) {
    const key = doc.folder || "root";
    clusterGroups.set(key, [...(clusterGroups.get(key) || []), doc]);
  }

  const bridgeSuggestions: BridgeSuggestion[] = [];
  const currentCluster = current.folder || "root";

  for (const [clusterKey, docs] of clusterGroups.entries()) {
    if (clusterKey === currentCluster) continue;

    const candidates = sortSuggestions(
      docs
        .map((doc) => {
          const semanticScore = overlapScore(current.tokenSet, doc.tokenSet);
          const tagScore = sharedTagsScore(current, doc);
          const outgoingScore = sharedOutgoingLinksScore(current, doc);
          const total = semanticScore * 0.55 + tagScore * 0.25 + outgoingScore * 0.2;

          return {
            id: doc.id,
            title: doc.name,
            relativePath: doc.relativePath,
            reason: "Potential bridge between weakly connected folders/clusters.",
            score: Number(total.toFixed(3)),
          };
        })
        .filter((item) => item.score >= 0.16)
        .slice(0, 2),
    );

    if (candidates.length) {
      bridgeSuggestions.push({
        leftCluster: currentCluster,
        rightCluster: clusterKey,
        candidateNotes: candidates,
        reason: "These clusters appear weakly connected and may benefit from linking notes.",
      });
    }
  }

  const inbound = inboundLinkCount(current, allDocuments);
  const outbound = current.links.length;
  const duplicateScore = duplicateCandidates[0]?.score ?? 0;
  const semanticNeighborCount = semanticNeighbors.length;
  const daysSinceChange = daysSince(current.updatedAt);

  const metadata: NoteMetadataSummary = {
    readingTimeMinutes: readingTimeMinutes(current.raw || ""),
    lastChanged: current.updatedAt || null,
    inboundLinks: inbound,
    outboundLinks: outbound,
    semanticNeighbors: semanticNeighborCount,
    graphRole: inferGraphRole({
      inbound,
      outbound,
      duplicateScore,
      daysSinceChange,
    }),
  };

  const health = buildHealth({
    inbound,
    outbound,
    duplicateScore,
    daysSinceChange,
    semanticNeighbors: semanticNeighborCount,
  });

  return {
    backlinks,
    relatedNotes,
    semanticNeighbors,
    bridgeSuggestions: bridgeSuggestions.slice(0, 4),
    duplicateCandidates,
    metadata,
    health,
  };
}

export function suggestWikilinks(
  draft: string,
  allDocuments: VaultDocument[],
  currentPath: string | null,
): SuggestedNote[] {
  const currentTokens = new Set(tokenize(draft));
  const currentLinks = [...draft.matchAll(/\[\[(.*?)\]\]/g)]
    .map((match) => match[1]?.trim().toLowerCase())
    .filter(Boolean);

  return sortSuggestions(
    allDocuments
      .filter((doc) => doc.relativePath !== currentPath)
      .map((doc) => {
        const tokenSet = buildTokenSet(doc);
        const semanticScore = overlapScore(currentTokens, tokenSet);
        const alreadyLinked = currentLinks.some(
          (link) => titleFromPath(doc.relativePath).toLowerCase() === titleFromPath(link).toLowerCase(),
        );

        return {
          id: doc.id,
          title: doc.name,
          relativePath: doc.relativePath,
          reason: alreadyLinked
            ? "Already linked in this draft."
            : "Suggested from shared language, tags, and note context.",
          score: alreadyLinked ? 0 : Number(semanticScore.toFixed(3)),
        };
      })
      .filter((item) => item.score >= 0.14)
      .slice(0, 6),
  );
}

export function extractActiveWikilinkQuery(
  draft: string,
  cursorPosition: number,
): { query: string; start: number; end: number } | null {
  const before = draft.slice(0, cursorPosition);
  const match = before.match(/\[\[([^[\]]*)$/);
  if (!match) return null;

  const query = match[1] ?? "";
  return {
    query,
    start: cursorPosition - query.length,
    end: cursorPosition,
  };
}

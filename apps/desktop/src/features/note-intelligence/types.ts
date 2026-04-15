// apps/desktop/src/features/note-intelligence/types.ts
export type NoteHealthStatus =
  | "orphan"
  | "underlinked"
  | "healthy"
  | "high_value_hub"
  | "outdated"
  | "duplicate_candidate";

export type SuggestedNote = {
  id: string;
  title: string;
  relativePath: string;
  reason: string;
  score: number;
};

export type BridgeSuggestion = {
  leftCluster: string;
  rightCluster: string;
  candidateNotes: SuggestedNote[];
  reason: string;
};

export type NoteMetadataSummary = {
  readingTimeMinutes: number;
  lastChanged: string | null;
  inboundLinks: number;
  outboundLinks: number;
  semanticNeighbors: number;
  graphRole: NoteHealthStatus;
};

export type NoteHealth = {
  score: number;
  status: NoteHealthStatus;
  reasons: string[];
};

export type NoteIntelligenceResult = {
  backlinks: SuggestedNote[];
  relatedNotes: SuggestedNote[];
  semanticNeighbors: SuggestedNote[];
  bridgeSuggestions: BridgeSuggestion[];
  duplicateCandidates: SuggestedNote[];
  metadata: NoteMetadataSummary;
  health: NoteHealth;
};

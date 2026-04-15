# Brain OS — Architecture

## 1. Product framing

Brain OS is a local-first desktop application that treats a markdown vault as a living knowledge graph.

The app imports a vault, parses frontmatter and wikilinks, derives semantic relationships, and renders the result as a high-fidelity 3D dependency space with an AI gap detection workspace.

---

## 2. System layers

### Desktop shell
- Electron main process
- native open-folder dialog
- IPC bridge for vault events and graph updates
- chokidar-based file watcher lifecycle

### Renderer application
- Vite + React + TypeScript
- Zustand app state
- Apple-grade desktop UI shell
- graph visualization + inspector + gap workspace

### Knowledge engine
- recursive markdown discovery
- frontmatter parsing via gray-matter
- wikilink extraction
- hierarchy inference from file paths
- note normalization into graph nodes

### Semantic engine
- token normalization
- stopword filtering
- tag overlap scoring
- layer / cluster reinforcement
- pairwise semantic edge generation for likely bridges

### Graph core
- graph schema
- node annotation
- degree scoring
- visual metadata defaults
- neighborhood and cluster utilities

### AI gap engine
- isolated note detection
- weak-cluster bridge detection
- semantic-neighbor-without-explicit-link detection
- action recommendations for bridge notes and MOCs

---

## 3. Monorepo structure

```text
brain-os/
├── apps/
│   └── desktop/
│       ├── electron/
│       │   ├── main.ts
│       │   ├── preload.ts
│       │   ├── vault-service.ts
│       │   └── types.ts
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── lib/
│       │   ├── styles/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── sample-data.ts
│       ├── index.html
│       ├── package.json
│       ├── tailwind.config.ts
│       ├── postcss.config.cjs
│       ├── tsconfig.json
│       ├── tsconfig.electron.json
│       └── vite.config.ts
├── packages/
│   ├── graph-core/
│   ├── knowledge-engine/
│   ├── semantic-engine/
│   ├── ai-gap-engine/
│   └── ui/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

---

## 4. Data flow

```text
Vault folder
   ↓
recursive markdown scan
   ↓
frontmatter + content parsing
   ↓
normalized notes
   ↓
wikilink edges + tag edges + hierarchy edges
   ↓
semantic edge generation
   ↓
graph annotation
   ↓
AI gap detection
   ↓
renderer UI
   ↓
3D graph + inspector + bridge recommendations
```

---

## 5. Semantic edge strategy

Current semantic edges are local and deterministic, so the app runs without external AI.

Signals:
- token overlap in cleaned content and title
- shared tags
- same cluster / layer reinforcement
- explicit thresholding to avoid noisy graphs

The abstraction is intentionally ready for a future embeddings provider.

---

## 6. Recommended production upgrades

### Near-term
- persist selected vault and view mode
- debounce vault reloads per file event batch
- add sqlite cache for large vaults
- add search and filter indexing

### Next phase
- embeddings provider interface
- vector cache
- bridge note generator
- community detection algorithms
- temporal replay of graph evolution

### Packaging
- add electron-builder
- configure macOS notarization and Windows signing
- add crash logging and telemetry opt-in

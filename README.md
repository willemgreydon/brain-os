# Brain OS

A local-first cognitive workspace for exploring notes, code, concepts, and semantic relationships through an interactive graph-driven interface.

Brain OS combines a filesystem-backed knowledge layer with a spatial UI, document editing, structural graph exploration, and research-oriented overlays. The goal is not just to store notes, but to help users think across them.

---

## Overview

Brain OS is designed as a desktop-first knowledge environment where documents, links, concepts, and clusters become navigable as a living system.

Instead of treating content as isolated files, Brain OS turns them into a connected network that can be explored visually and analytically.

Core characteristics:

- local-first vault workflow
- filesystem-backed markdown and document editing
- 3D knowledge graph exploration
- semantic and structural relationship mapping
- split workspace for graph, editor, preview, and insight overlays
- command-driven navigation
- research-oriented graph tooling
- extensible monorepo architecture

---

## Vision

Brain OS aims to feel less like a dashboard and more like a cognitive instrument.

The product direction focuses on:

- turning note collections into navigable thought systems
- identifying bridges, blind spots, weak links, and dense clusters
- supporting writing, linking, and sensemaking in one place
- making the graph a real research surface rather than a decorative visualization
- keeping the system maintainable, modular, and extensible

---

## Current Capabilities

### Workspace
- spatial workspace shell
- graph-first visual experience
- floating overlays and docked surfaces
- focus mode for reduced interface noise
- command bar for fast navigation
- fullscreen graph mode

### Vault + Documents
- open a real local vault through Electron bridge
- load sample graph mode
- read documents from filesystem
- create new folders
- create new notes
- edit and save supported text-based files
- quick note capture
- live preview for markdown
- document analysis metrics

### Graph
- 3D graph rendering
- node selection
- graph fullscreen mode
- semantic filtering
- graph grouping groundwork
- node inspector
- backlinks tray
- related content surfacing

### Research Layer
- neighborhood isolation concept
- path highlighting groundwork
- pinned node architecture
- insight cards architecture
- graph metric infrastructure
- structural analysis direction inspired by knowledge-network thinking

---

## Monorepo Structure

```text
brain-os/
├─ apps/
│  └─ desktop/                # Electron + Vite desktop app
├─ packages/
│  ├─ ai-gap-engine/          # AI-oriented gap analysis logic
│  ├─ graph-core/             # Shared graph utilities / core logic
│  ├─ knowledge-engine/       # Knowledge parsing / indexing logic
│  ├─ semantic-engine/        # Semantic processing logic
│  └─ ui/                     # Shared UI package
├─ package.json               # Root workspace config
└─ turbo.json / pnpm-workspace.yaml
```

---

## Tech Stack

### App
- React
- TypeScript
- Vite
- Electron

### Visualization
- Three.js
- react-force-graph-3d
- three-spritetext
- d3-force-3d

### State + Utilities
- Zustand
- graphology
- graphology-layout-forceatlas2
- gray-matter
- chokidar

### Tooling
- pnpm workspaces
- Turbo
- tsup
- TypeScript project references

---

## Architecture Principles

Brain OS follows a systems-first architecture.

### 1. Domain separation
The codebase separates:
- domain/data types
- app shell concerns
- workspace UI concerns
- graph research logic
- desktop bridge responsibilities

### 2. Local-first workflow
The desktop app interacts with the local filesystem through an Electron bridge. The UI is designed to keep working meaningfully even before optional online layers are introduced.

### 3. Graph as substrate
The graph is not treated as a side feature. It is the structural background of the workspace and a core navigation/analysis layer.

### 4. Progressive research tooling
The graph layer is being evolved from:
- visual exploration
- analytical exploration
- recommendation and structural insight generation

### 5. Extensibility
The project is structured so that additional capabilities can be added without destabilizing the shell:
- saved viewpoints
- semantic pathfinding
- bridge detection
- duplicate detection
- contradiction/tension surfacing
- timeline/replay modes
- AI-assisted synthesis

---

## Desktop App Responsibilities

The desktop application is responsible for:

- renderer UI
- Electron shell
- local vault selection
- vault indexing
- document reading and saving
- rendering workspace surfaces
- connecting graph data with document content

The bridge contract currently includes methods such as:

- `ping`
- `selectVault`
- `refreshVault`
- `useSampleVault`
- `onVaultUpdated`
- `getVaultIndex`
- `readDocument`
- `saveDocument`
- `createDocument`
- `createFolder`
- `moveEntry`

---

## UI Direction

The interface direction intentionally moves away from a dense boxed dashboard.

Target qualities:

- canvas-first
- atmospheric
- layered
- spatial
- focused
- instrument-like rather than admin-like

Current design elements include:
- floating glass panels
- graph as visual substrate
- docked editor surface
- adaptive overlays
- command bar navigation
- soft depth and blur
- contrast hierarchy instead of heavy borders

---

## Research Graph Direction

The graph is being upgraded into a real research tool.

Planned or partially scaffolded directions include:

- double-click node isolation
- neighborhood depth control
- semantic path highlighting
- group clouds / cluster hulls
- grouping by tag / folder / layer / semantic similarity / link density
- node pinning
- saved viewpoints
- minimap / orientation widget
- timeline / replay mode
- bridge concept detection
- structural hole detection
- over-dense cluster warnings
- underlinked important note surfacing
- “what connects A and B?” prompts
- duplicate candidates
- contradiction / tension zone detection
- insight cards from graph structure

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Electron-compatible environment

### Install

```bash
pnpm install
```

### Run development

```bash
pnpm dev
```

Or run only the desktop app:

```bash
pnpm --filter @brain/desktop run dev
```

---

## Build

From the root:

```bash
pnpm build
```

For the desktop app only:

```bash
pnpm --filter @brain/desktop run build
```

---

## Development Workflow

### Root workspace
The root uses Turbo to run package development/build tasks across the monorepo.

### Desktop development
The desktop app runs:
- Vite for the renderer
- TypeScript build for Electron entry files
- Electron runtime

### Package development
Shared packages use `tsup` in watch mode.

---

## Important Notes for Development

### Local vault behavior
Some features only work with a real writable vault:
- creating folders
- creating notes
- saving documents

Sample mode is useful for:
- graph exploration
- visual testing
- shell validation
- interaction prototyping

### 3D graph dependencies
The 3D graph stack is sensitive to Three.js version alignment. Keep `three`, `react-force-graph-3d`, and related graph rendering dependencies coordinated carefully.

### Generated files
Do not commit generated or dependency-heavy folders such as:
- `node_modules`
- `dist`
- `dist-electron`
- `.turbo`
- `.vite`

---

## Keyboard / Interaction Direction

Current and intended interaction model includes:
- command bar via keyboard shortcut
- quick switching between graph/content/split modes
- fullscreen graph focus
- dock visibility toggles
- selection-driven opening of linked documents
- focus mode for reduced UI noise

---

## Current Status

Brain OS is in active prototyping and foundation-stabilization.

The shell, graph layer, overlays, and vault workflows are already meaningful, but the system is still evolving toward a more mature research-grade knowledge OS.

Priority themes at the current stage:
- stabilize architecture
- improve graph reliability and analysis value
- refine spatial UI
- strengthen local-first workflows
- keep modules clean and extensible

---

## Roadmap Direction

### Phase 1 — Foundation
- stabilize workspace shell
- reliable graph rendering
- local vault CRUD
- consistent document/editor flows
- cleaner surface layering

### Phase 2 — Research Graph
- neighborhood isolation
- pathfinding
- grouping and clustering modes
- insight card generation
- bridge and blind-spot analysis
- saved viewpoints

### Phase 3 — Advanced Knowledge Operations
- stronger semantic analysis
- contradiction mapping
- duplicate detection
- graph evolution timeline
- recommendation engine for links and synthesis
- AI-assisted structural interpretation

### Phase 4 — Product Maturity
- polished onboarding
- better packaging/distribution
- sync/export options
- deeper plugin/extension model
- collaboration or optional cloud augmentation

---

## Accessibility Goals

The app is built with attention toward:
- readable contrast
- keyboard-driven interaction
- predictable panel structure
- scalable UI settings
- reduced UI noise through focus mode
- maintainable, semantic React structure

Further accessibility hardening is still an active area for improvement.

---

## Contributing

At this stage, contributions should favor:
- stability over novelty
- modular implementation
- typed contracts
- clean dependency boundaries
- minimal regression risk
- performance-aware rendering
- accessible interaction patterns

When adding features:
- avoid mixing domain and UI concerns
- keep graph logic separate from shell layout
- prefer reusable primitives over one-off panel logic
- treat the workspace as a system, not a collection of pages

---

## License

This project currently has no final license decision committed.
Add the chosen license before public distribution.

---

## Maintainer

Claus Nisslmüller

---

## Quick Start

```bash
pnpm install
pnpm dev
```

Open the desktop app, load a vault, and start exploring your knowledge space.

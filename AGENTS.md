# AGENTS.md

This file defines the expected engineering behavior for humans and AI agents working in this repository.

## Mission

Brain OS is a local-first cognitive workspace. All work should improve one or more of these dimensions:

- reliability
- clarity
- analytical usefulness
- spatial interaction quality
- maintainability
- extensibility

## Core Principles

### 1. System-first thinking
Do not treat the app as a collection of isolated screens.
Always consider:
- shell stability
- graph/rendering implications
- workspace layering
- bridge contracts
- local-first filesystem flows
- long-term extension paths

### 2. Clean separation of concerns
Keep these concerns separate:
- domain/data types
- bridge / filesystem integration
- app shell state
- workspace feature state
- graph research logic
- presentation components
- styling

### 3. Local-first by default
Do not introduce unnecessary server assumptions.
Any future cloud/sync features must remain optional and must not break local-only workflows.

### 4. Stable foundations before visual expansion
Do not add flashy UI that destabilizes:
- graph rendering
- Electron runtime
- resize behavior
- document CRUD
- keyboard interaction
- workspace layering

### 5. Performance-aware UI
All new interactions must be designed with rendering cost in mind.
Prefer:
- memoized transforms
- narrow rerender surfaces
- lightweight overlays
- explicit cleanup in effects
- minimal graph object churn

Avoid:
- unnecessary React state fanout
- rebuilding heavy graph objects every frame
- uncontrolled resize loops
- excessive blur/shadow stacks without purpose

## Repository Guidance

### Apps
- `apps/desktop` is the Electron + Vite desktop app.
- Keep renderer concerns and Electron concerns separate.

### Packages
Shared packages should remain focused and reusable.
Do not leak app-specific UI logic into engine packages.

## File Placement Rules

### Use `src/lib/*` for:
- domain types
- shared utility functions
- bridge contracts
- low-level app-wide helpers

### Use `src/features/*` for:
- feature-specific state
- analysis logic
- composable feature modules

### Use `src/components/*` for:
- reusable UI building blocks
- presentational components
- layout components that do not own domain logic

## Graph Development Rules

When changing the graph:

1. Preserve interaction stability.
2. Avoid introducing extra Three.js instances.
3. Be explicit about version compatibility for graph/Three dependencies.
4. Keep analytical logic independent from visual rendering where possible.
5. Prefer deterministic transforms before AI-assisted inference.

### Graph feature priority order
1. reliability
2. analytical value
3. interaction clarity
4. visual refinement

## Workspace UI Rules

The workspace should feel like a cognitive instrument.

Target qualities:
- spatial
- calm
- layered
- focused
- navigable
- responsive

Avoid:
- heavy dashboard boxing
- arbitrary nested panels
- duplicated controls in multiple locations
- floating panels that collide or obscure core tasks

## Styling Rules

- Respect the existing visual token system.
- Prefer one strong visual system over ad hoc overrides.
- Use contrast hierarchy more than border clutter.
- Motion should be functional, not decorative.
- Desktop-first is acceptable, but all layouts should degrade cleanly.

## Accessibility Rules

Every change should preserve or improve:
- keyboard operability
- visible focus states
- readable contrast
- semantic structure
- predictable control behavior

## Git Hygiene

Do not commit generated files or caches.
Keep `.gitignore` current.
Prefer small focused commits.

Commit message style:
- `feat: ...`
- `fix: ...`
- `refactor: ...`
- `docs: ...`
- `chore: ...`

## Before Merging Any Significant Change

Check:
- does the app boot?
- does the desktop bridge still work?
- does the graph still render reliably?
- can a real vault still be opened?
- can documents still be created/saved?
- do overlays still layer correctly?
- is the change localized and maintainable?

## If You Are an AI Coding Agent

You must:
- produce copy-paste-ready output
- avoid speculative architecture drift
- preserve existing contracts unless intentionally refactored
- prefer explicitness over magic
- make the minimum clean change that unlocks the next stable step

You must not:
- rewrite unrelated parts of the system casually
- add hidden dependencies without need
- create duplicate types or duplicated state models without a migration plan
- optimize visuals at the cost of stability

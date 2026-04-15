export const sampleNotes: Record<string, string> = {
  "identity/core-identity": `---
title: Core Identity
layer: core
cluster: identity
tags:
  - identity
  - self
---

# Core Identity

I am building Brain OS as a local-first cognitive operating system.

## Principles

- Trust first
- Local-first
- AI as augmentation
- Clear systems over clutter

## Related

[[identity/mission]]
[[systems/platform-architecture]]
`,

  "identity/mission": `---
title: Mission
layer: core
cluster: identity
tags:
  - mission
  - direction
---

# Mission

Create a trustworthy knowledge platform that feels precise, useful, and future-safe.

## Focus

- Desktop now
- Web next
- Mobile-ready architecture later

[[identity/core-identity]]
[[systems/platform-architecture]]
[[insights/contradiction-zones]]
`,

  "systems/platform-architecture": `---
title: Platform Architecture
layer: meta
cluster: system
tags:
  - architecture
  - platform
  - system
---

# Platform Architecture

Brain OS should be separated into:

- Workspace
- Library
- Insights
- Settings
- Legal + Trust
- Auth + Billing

## Shared packages

- domain
- file-system
- preview-core
- ai-core
- auth-core
- legal-core

[[identity/mission]]
[[output/product-roadmap]]
`,

  "output/product-roadmap": `---
title: Product Roadmap
layer: output
cluster: strategy
tags:
  - roadmap
  - product
---

# Product Roadmap

## Phase 2.5

- Settings
- File registry
- Preview

## Phase 3

- Revision history
- Trash
- Legal
- Account

## Phase 4

- AI layer
- Graph insights
- Perspective cards

[[systems/platform-architecture]]
[[insights/underdeveloped-ideas]]
`,

  "insights/contradiction-zones": `---
title: Contradiction Zones
layer: knowledge
cluster: insight
tags:
  - contradiction
  - insight
---

# Contradiction Zones

Where does the platform claim trust but still hide critical logic or user control?

[[identity/mission]]
[[systems/platform-architecture]]
`,

  "insights/underdeveloped-ideas": `---
title: Underdeveloped Ideas
layer: knowledge
cluster: insight
tags:
  - idea
  - growth
---

# Underdeveloped Ideas

Potential future ideas:

- 3D stats cloud
- perspective cards
- semantic contradiction highlighting
- synthesis views

[[output/product-roadmap]]
`,
};

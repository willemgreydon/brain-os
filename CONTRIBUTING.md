# Contributing

Thanks for contributing to Brain OS.

This project is still in an active architecture and interaction-design phase, so the priority is clean, stable progress rather than feature volume.

## What Good Contributions Look Like

- focused
- typed
- modular
- low-regression
- performance-aware
- accessible
- local-first compatible

## Before You Start

Make sure you can:

```bash
pnpm install
pnpm dev
```

And for the desktop app directly:

```bash
pnpm --filter @brain/desktop run dev
```

## Branching

Use focused feature branches.

Examples:
- `feat/graph-isolation`
- `fix/three-resolver`
- `refactor/workspace-store`
- `docs/repo-guidelines`

## Commit Style

Use conventional-style prefixes:

- `feat:` new functionality
- `fix:` bug fix
- `refactor:` internal cleanup without behavior change
- `docs:` documentation only
- `chore:` tooling / housekeeping

## Pull Request Expectations

A strong PR should:
- solve one clear problem
- avoid unrelated rewrites
- keep graph logic and UI logic separated
- include enough context for review
- keep dependencies intentional

## Quality Checklist

Before opening a PR, verify:

- app boots successfully
- no obvious Electron/runtime regressions
- graph still renders
- real vault flows still work
- no generated files are committed
- no duplicate type systems were introduced unintentionally
- layout changes do not create overlap/collision issues
- keyboard basics still work

## Design + UX Guidance

Brain OS should feel like a cognitive instrument, not an admin dashboard.

Favor:
- spatial clarity
- layered interaction
- graph-first thinking
- reduced chrome
- strong hierarchy

Avoid:
- unnecessary panel nesting
- visual noise
- duplicated control surfaces
- abrupt interaction changes without system consistency

## Dependency Changes

If you change dependencies:
- explain why
- keep versions compatible with the current graph stack
- be especially careful with `three`, `react-force-graph-3d`, and related packages

## Documentation

If your change materially affects architecture, usage, or workflow, update:
- `README.md`
- `AGENTS.md`
- any relevant inline docs

## Questions to Ask Before Shipping a Change

- does this improve the system, not just one screen?
- does this make the workspace more stable or more useful?
- is the implementation understandable for the next contributor?

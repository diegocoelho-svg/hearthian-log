# Hearthian Log

A desktop companion for **Outer Wilds** that watches the game's save file and shows your
exploration progress **without spoiling what you have not found yet**.

It is not a mod. It does not read game memory and it is not real time. It reads the JSON the
game writes on specific events, diffs it against the last read, and turns the difference into
counts, toasts and, later, a 100% checklist with hints you unlock one layer at a time.

> **Spoiler warning.** This repository will contain the game's Ship Log text under
> `packages/content/data/` and the game's fact ids under `packages/core/fixtures/`. If you have
> not finished Outer Wilds, do not browse those folders.

## Status

Phase 0 (foundation) is done: pure domain package, save fixtures, content schemas, IPC
contracts and CI. Phase 1 builds the Electron app around it. See the
[roadmap](specs/project/roadmap.md).

## How it works

```
save file ──► watcher ──► parseSave ──► SaveSnapshot ──► diffSnapshots ──► SaveEvent[]
                                                             │
                                          ProgressEngine ◄───┘
                                                 │
                                     projectView(progress, content, level)
                                                 │
                                          renderer (React)
```

The spoiler level is not a UI flag. It is applied in the main process, before anything crosses
the IPC boundary, by a pure function that returns a `View` type containing **only** what the
level allows. The renderer never depends on the content package, a lint rule blocks the import,
a type-level test checks every `View` for leaked fields, and a build test looks for a sentinel
string in the renderer bundle.

## Packages

| Package | Role | Depends on |
|---|---|---|
| `packages/core` | Save parser, snapshot, diff, progress, spoiler projection. No Node, no Electron | `zod` |
| `packages/content` | Ship Log tables and 100% guide as versioned JSON, validated by schema | `core` |
| `packages/contracts` | IPC channels, settings and `View` schemas shared by main and renderer | `core` |
| `packages/save-io` | Save locator and file watcher (phase 1) | `core`, Node |
| `packages/steam` | Optional Steamworks achievement source (phase 3) | `core` |
| `packages/config` | Shared tsconfig, ESLint and Vitest config | — |
| `apps/desktop` | Electron main, preload and renderers (phase 1) | everything |

## Development

Node 22+ and pnpm 11. Never use npm here.

```bash
pnpm install
pnpm lint        # eslint + prettier
pnpm typecheck   # tsc per package, via turbo
pnpm test        # vitest per package, via turbo
pnpm validate    # content schema and integrity checks
```

Test fixtures in `packages/core/fixtures/` are derived from a real save with counters and
reveal order regenerated. Real saves never enter the repository: the folder that holds them is
named after the player's profile.

## Documentation

The specs live in `specs/` and are written in Portuguese. Start with the
[onboarding](specs/project/onboarding.md), then the [architecture](specs/domain/arquitetura.md),
the [save model](specs/domain/save-model.md) and the [spoiler policy](specs/domain/spoiler.md).
Design decisions are recorded as ADRs in [`specs/decisions/`](specs/decisions/).

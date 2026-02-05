---
title: Project State
type: session
tags: [active, continuity, status]
updated: 2026-02-04
---

# Project State

## Current Position

Phase: 27.1 Physics-Controlled Active Piece
Plan: 1 of 3 complete
Status: Falling physics foundation ready, wire-up next
Last activity: 2026-02-05 - Completed 27.1-01-PLAN.md

Progress: ███████░░░ ~78%

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- `soft-body-experiment` — Soft Body Goop (SBG) integration (v1.5 milestone)

## Next Steps

**Completed:** 27.1-01-PLAN.md (Physics falling foundation)
**Branch:** `soft-body-experiment`

### 27.1-01 Completed (2026-02-05)

| Task | Commit | Description |
|------|--------|-------------|
| SoftBlob type | b6cdd66 | Add isColliding property |
| Blob factory | 1655ea8 | Initialize isColliding, copy gridCells |
| Falling physics | da47d81 | Implement stepActivePieceFalling function |

**What's ready:**
- SoftBlob has `gridCells`, `visualOffsetY`, `isColliding` properties
- `stepActivePieceFalling` implements Proto-9's smooth falling pattern
- Grid collision detection (O(1) cell lookup)
- GameEngine can read `blob.isColliding` to trigger lock timer

### What's Still Open
- 27.1-02: Wire up stepActivePieceFalling to useSoftBodyPhysics hook
- 27.1-03: Add spinning/rotation physics

### Next: 27.1-02 Plan

Wire up the falling physics to the game loop so active pieces use physics-owned motion instead of sync-to-game-state.

---

## Session Continuity

Last session: 2026-02-05
**Version:** 1.1.13
**Branch:** soft-body-experiment
**Build:** 184

### Resume Command
```
27.1-01 plan complete.

DONE:
- SoftBlob.isColliding property for lock signaling
- stepActivePieceFalling with Proto-9 visualOffsetY pattern
- Grid collision detection via gridCells lookup

READY FOR:
- 27.1-02: Wire up falling physics to useSoftBodyPhysics

Next: /gsd:execute-plan .planning/phases/27.1-physics-controlled-active-piece/27.1-02-PLAN.md
```

---

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<runtests>`, `<save>`, `<deploy>`, `<research>`, `<askme>`, `<flow>`

## Related

- [[HOME]] - Navigation hub
- [[PROJECT]] - Full project definition
- [[ROADMAP]] - All milestones

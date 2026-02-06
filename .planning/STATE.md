---
title: Project State
type: session
tags: [active, continuity, status]
updated: 2026-02-05
---

# Project State

## Current Position

Phase: 27.1 Physics-Controlled Active Piece
Plan: MASTER-PLAN complete (9/9 tasks)
Status: Implementation complete. Ready for manual testing.
Last activity: 2026-02-05 - Completed 27.1-MASTER-PLAN.md

Progress: ████████░░ ~80% (wiring done, testing pending)

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- `soft-body-experiment` — Soft Body Goop (SBG) integration (v1.5 milestone)

## Next Steps

**Completed:** 27.1-01 + 27.1-02 (Physics falling integrated)
**Branch:** `soft-body-experiment`

### 27.1 Status (2026-02-05)

**MASTER-PLAN COMPLETE** — All 9 tasks executed successfully.

**Commits:**
- `c053204` feat: update scaling parameters for 30px cells
- `043e8c0` feat: add physics step context and getActivePieceState
- `74404bb` feat: wire physics to Game.tsx and GameEngine
- `7cb7839` refactor: remove Y sync from GameBoard to physics
- `200cc95` feat: sync blob shape on piece rotation

**Key Implementation:**
- Physics now OWNS the Y position during falling
- GameEngine READS position via `syncActivePieceFromPhysics()`
- Data flow reversed: physics→game (correct direction)
- All parameters scaled ×0.6 for 30px cells

### Next Steps

**Manual Testing Required:**
1. Piece falls smoothly with soft-body wobble
2. Fall speed matches expected (2 cells/sec, 8x when fast-dropping)
3. Piece stops at floor and on top of other goop
4. Rotation updates blob shape without Y reset
5. Tank rotation keeps piece visually centered

---

## Session Continuity

Last session: 2026-02-05
**Version:** 1.1.13
**Branch:** soft-body-experiment
**Build:** 190+

### Resume Command
```
27.1 MASTER-PLAN EXECUTED SUCCESSFULLY.

COMPLETED:
- All 9 implementation tasks
- Physics step context and getActivePieceState()
- Game.tsx handlePhysicsStep wiring
- GameEngine syncActivePieceFromPhysics()
- Blob shape rotation sync
- All parameters scaled ×0.6

SUMMARY LOCATION:
.planning/phases/27.1-physics-controlled-active-piece/27.1-MASTER-SUMMARY.md

Next: Manual testing to verify physics-controlled falling works
```

---

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<runtests>`, `<save>`, `<deploy>`, `<research>`, `<askme>`, `<flow>`

## Related

- [[HOME]] - Navigation hub
- [[PROJECT]] - Full project definition
- [[ROADMAP]] - All milestones

---
title: Project State
type: session
tags: [active, continuity, status]
updated: 2026-02-06
---

# Project State

## Current Position

Phase: 27.1 Physics-Controlled Active Piece
Plan: MASTER-PLAN complete (9/9 tasks) — ALL BUGS FIXED
Status: Physics-controlled falling piece fully working + goo filter tuned + overflow bug fixed
Last activity: 2026-02-06 - Goo filter tuning, overflow game-over bug fix

Progress: ████████░░ ~80% (core physics working, needs polish)

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- `soft-body-experiment` — Soft Body Goop (SBG) integration (v1.5 milestone)

## Next Steps

**Completed:** 27.1-01 + 27.1-02 + 27.1-03 (Physics falling fully integrated)
**Branch:** `soft-body-experiment`

### 27.1 Status (2026-02-06)

**ALL CRITICAL BUGS FIXED** — Physics-controlled active piece working.

**Recent Commits:**
- `34fcfcf` fix(27.1): resolve 3 critical physics bugs (rotation, overlap, spawn)
- Previous: rotation sync, Y sync, physics wiring

**Bugs Fixed This Session:**
1. **Visual rotation mismatch** — Added `blob.rotation = pieceRotation * 90`
2. **Pieces overlapping** — Fixed Y coordinate conversion (visual → full grid with BUFFER_HEIGHT)
3. **No second piece after lock** — Physics sync now checks blob timestamp matches current piece
4. **Tank rotation wobble** — Vertices now shift instantly with target position
5. **Displacement bug (X coords)** — Added tankRotation to convert visual X → game grid X

**Key Fixes:**
- Physics collision now correctly converts visual coords to game grid coords
- Y: `fullGridY = visualY + BUFFER_HEIGHT`
- X: `gridX = visualX + tankRotation` (with wrapping)
- Physics sync only updates blob matching current piece's spawnTimestamp

### Known Issues

None critical. Minor polish items:
- Physics "looseness" could be tuned (blobs are a bit wobbly)
- Could optimize by reducing debug variable declarations

### Decisions Made This Session
- **Goo filter defaults:** stdDeviation=8, alphaMul=24, alphaOff=-13 (user-tuned via live sliders)
- **No stroke on blob SVG paths** — goo filter handles edge definition alone
- **Goo filter sliders** added to backtick debug panel (Goo Filter section)

### Next Steps

1. Test edge cases (fast fall, rotation near floor, tank rotation during collision)
2. Consider physics parameter tuning for tighter feel
3. Move to next phase (Phase 28: Locked Goop Behavior)

---

## Session Continuity

Last session: 2026-02-06
**Version:** 1.1.13
**Branch:** soft-body-experiment
**Build:** 206

### Resume Command
```
27.1 COMPLETE — Goo filter tuned + overflow bug fixed.

SESSION ACCOMPLISHMENTS:
- Tuned goo filter defaults (8/24/-13) with live debug sliders
- Removed blob strokes (goo filter handles edges)
- Added goo filter sliders to backtick debug panel
- Fixed P0 overflow game-over bug (3 root causes):
  1. lockActivePiece() had no gameOver guard → lock loop
  2. spawnNewPiece() continued after finalizeGame() → set stale activeGoop
  3. resetSession() didn't clear activeGoop → physics re-triggered game over on dismiss
- Added gameOver/isSessionActive guards to physics callback
- Added touch-action: none to monitor drag element
- Updated PRD with goo filter reference docs

FILES MODIFIED:
- Game.tsx (goo filter state, physics guards, debug sliders)
- components/GameBoard.tsx (dynamic filter values, removed blob strokes)
- components/Art.tsx (touch-action: none on monitor)
- core/GameEngine.ts (overflow guards in lockActivePiece, spawnNewPiece, syncActivePieceFromPhysics, resetSession)
- core/softBody/rendering.ts (updated filter defaults/presets)
- .planning/PRD.md (goo filter reference docs)

Next: Test edge cases, physics tuning, or move to Phase 28
```

---

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<runtests>`, `<save>`, `<deploy>`, `<research>`, `<askme>`, `<flow>`

## Related

- [[HOME]] - Navigation hub
- [[PROJECT]] - Full project definition
- [[ROADMAP]] - All milestones

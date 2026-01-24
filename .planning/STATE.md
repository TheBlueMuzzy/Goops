# Project State

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- None — ready for v1.2 feature branch

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-24)

**Core value:** The game feels satisfying to play on mobile - responsive controls, smooth animations, no input lag.
**Current focus:** v1.2 progression system — ranks 0-39 with new upgrades and mechanics

## Current Position

Phase: 16 of 18 (Junk Band)
Plan: 3 of 3 in current phase
Status: In progress — active ability UI complete, needs UAT
Last activity: 2026-01-24

Progress: ████░░░░░░ 26%

## v1.1 Architecture Refactor

**Goal:** Fix memory leaks, split large files, centralize state management, expand test coverage.

**Phases:**
- ✅ Phase 8: Quick Wins & Memory Fixes (2026-01-21)
- ✅ Phase 9: Art.tsx Decomposition (2026-01-21)
- ✅ Phase 10: GameBoard.tsx Decomposition (2026-01-21)
- ✅ Phase 11: GameEngine Refactor (2026-01-21)
- ✅ Phase 12: State Management & Events (2026-01-21)
- ✅ Phase 13: Testing & Documentation (2026-01-21)

**Constraints:**
- All 112 tests must pass throughout
- No gameplay changes
- Each phase independently deployable

**Success Criteria:**
- ✅ No files over 400 lines
- ✅ All hard-coded values in constants.ts
- ✅ GameEngine.tick() under 50 lines (22 lines achieved)
- ✅ Event-based communication replaces prop drilling

## What's Done

### v1.1 Architecture Refactor (Shipped 2026-01-21)

All 6 phases (8-13) complete. See [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) for full details.

**Key accomplishments:**
- Art.tsx: 1,478 → 581 lines (61% reduction)
- GameBoard.tsx: 1,031 → 604 lines (41% reduction)
- GameEngine.tick(): 159 → 22 lines (86% reduction)
- Tests: 65 → 112 (72% increase)
- Event-based input, 6 callback props removed

### v1.0 MVP (Shipped 2026-01-21)

All 7 phases complete. See [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) for full details.

## Accumulated Context

### Decisions

All key decisions documented in PROJECT.md Key Decisions table.

### Key Technical Discovery

**SVG Coordinate Conversion with preserveAspectRatio="xMidYMid slice"**

Simple viewBox math doesn't work. Must use:
```tsx
const refPoint = document.getElementById('coord-reference');
const ctm = refPoint.getScreenCTM();
const svgPoint = screenPoint.matrixTransform(ctm.inverse());
```

### Deferred Issues

None — all UAT issues resolved.

## Session Continuity

Last session: 2026-01-24
Stopped at: 16-03 active ability UI complete, pending final UAT
Resume file: None
Phase 16 Status: In progress — executing plan 3 of 3

### This Session Summary

**What was done:**
1. Fixed active ability UI click passthrough (uses onPointerDown + stopPropagation)
2. Added shake animation reusing existing shake-anim class
3. Changed fill visual to bottom-to-top like goops
4. Increased crack seal charge: 10% → 25% per sealed crack
5. Reduced lights malfunction: 50% → 20% base trigger chance
6. Sped up lights minigame: 50% faster pattern, near-instant button popup
7. Added Code Reuse Guideline to CLAUDE.md
8. Added version note: patch versions can go past 9 (1.1.9 → 1.1.10)
9. Updated PRD with new balance values

**Commits this session:**
- `237fdd8` fix(16-03): active ability UI and balance tuning v1.1.9

**Version:** 1.1.9

### What Works (Verified)
- Active ability button charges (1%/sec passive, 25%/crack seal)
- Fill visual shows bottom-to-top progress like goops
- Lights minigame pattern is faster with quick button popup

### Needs UAT
- Click passthrough fix (clicking ability shouldn't rotate piece)
- Shake feedback when clicking non-ready ability
- GOOP_DUMP effect (spawns orange goop when activated)

### Next Steps

1. User tests v1.1.9 ability button behavior
2. If issues found, fix and bump to 1.1.10
3. Complete human verification checkpoint
4. Create 16-03-SUMMARY.md
5. Continue with remaining 16-03 plan items or move to 16-04

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<commit>`, `<merge>`, `<status>`, `<handoff>`

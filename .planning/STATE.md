# Project State

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- `refactor-v1.1` — v1.1 Architecture Refactor (Phase 11 in progress)

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-21)

**Core value:** The game feels satisfying to play on mobile - responsive controls, smooth animations, no input lag.
**Current focus:** v1.1 Architecture Refactor — solidify codebase before new features

## Current Position

Phase: 11 of 13 (GameEngine Refactor) - COMPLETE
Plan: 2/2 complete
Status: **Phase 11 complete** — Ready for Phase 12
Last activity: 2026-01-21 — Completed Plan 11-02 (ComplicationManager & GoalManager)

Progress: █████████████████████████ 4/6 phases (67%)

## v1.1 Architecture Refactor

**Goal:** Fix memory leaks, split large files, centralize state management, expand test coverage.

**Phases:**
- ✅ Phase 8: Quick Wins & Memory Fixes (2026-01-21)
- ✅ Phase 9: Art.tsx Decomposition (2026-01-21)
- ✅ Phase 10: GameBoard.tsx Decomposition (2026-01-21)
- ✅ Phase 11: GameEngine Refactor (2026-01-21)
- Phase 12: State Management & Events
- Phase 13: Testing & Documentation

**Constraints:**
- All 81 tests must pass throughout (65 original + 16 new)
- No gameplay changes
- Each phase independently deployable

**Success Criteria:**
- No files over 400 lines
- All hard-coded values in constants.ts
- GameEngine.tick() under 50 lines
- Event-based communication replaces prop drilling

## What's Done

### v1.0 MVP (Shipped 2026-01-21)

All 7 phases complete. See [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) for full details.

### Phase 9: Art.tsx Decomposition (2026-01-21)

Art.tsx reduced from 1,478 to 581 lines (61% reduction):
- Extracted 3 minigame state machine hooks
- Extracted 4 panel components for minigame rendering
- Created central types/minigames.ts

**Files created:**
- types/minigames.ts (137 lines) — central minigame types
- hooks/useLaserMinigame.ts (226 lines) — LASER state machine
- hooks/useLightsMinigame.ts (375 lines) — LIGHTS state machine
- hooks/useControlsMinigame.ts (452 lines) — CONTROLS dial state machine
- components/MiniGames/ArcadeButton.tsx (63 lines) — reusable button
- components/MiniGames/LaserPanel.tsx (90 lines) — LASER SVG
- components/MiniGames/LightsPanel.tsx (135 lines) — LIGHTS SVG
- components/MiniGames/ControlsPanel.tsx (141 lines) — CONTROLS SVG

## Audit Findings (from discuss-milestone)

**Critical Issues:**
- ~~Art.tsx: 1,478 lines~~ ✅ Fixed in Phase 9 (581 lines)
- ~~GameBoard.tsx: 1,052 lines~~ ✅ Fixed in Phase 10 (604 lines, 41% reduction)
- ~~rotationTimestamps memory leak~~ ✅ Fixed in Phase 8 (circular buffer)

**High Priority:**
- ~~GameEngine.tick() is 167 lines~~ ✅ Fixed in Phase 11 (22 lines)
- ~~Hard-coded values scattered~~ ✅ Fixed in Phase 8 (complicationConfig.ts)
- State fragmented across 6 locations
- Prop drilling (10+ callbacks to GameBoard)

See `.planning/SYSTEM-INVENTORY.md` for complete system list.

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

Last session: 2026-01-21
Stopped at: Plan 11-01 complete, ready for Plan 11-02

### Phase 11 Summary (Complete)

GameEngine refactored with improved separation of concerns:
- Plan 11-01: Split tick() into 7 focused sub-methods (159 → 22 lines)
- Plan 11-02: Extracted ComplicationManager (178 lines) and GoalManager (96 lines)
- GameEngine.ts reduced from 811 → 576 lines (28% reduction)

### Next Steps

1. Run `/gsd:plan-phase 12` to plan State Management & Events phase
2. Or `/gsd:verify-work 11` to do UAT on Phase 11

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<commit>`, `<merge>`, `<status>`, `<handoff>`

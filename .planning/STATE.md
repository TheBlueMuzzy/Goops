# Project State

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- None yet — create `refactor-v1.1` before starting Phase 8

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-21)

**Core value:** The game feels satisfying to play on mobile - responsive controls, smooth animations, no input lag.
**Current focus:** v1.1 Architecture Refactor — solidify codebase before new features

## Current Position

Phase: 8 of 13 (Quick Wins & Memory Fixes)
Plan: Not started
Status: Ready to plan
Last activity: 2026-01-21 — Milestone v1.1 created

Progress: ░░░░░░░░░░░░░░░░░░░░░░░░░ 0/6 phases (0%)

## v1.1 Architecture Refactor

**Goal:** Fix memory leaks, split large files, centralize state management, expand test coverage.

**Phases:**
- Phase 8: Quick Wins & Memory Fixes
- Phase 9: Art.tsx Decomposition
- Phase 10: GameBoard.tsx Decomposition
- Phase 11: GameEngine Refactor
- Phase 12: State Management & Events
- Phase 13: Testing & Documentation

**Constraints:**
- All 65 tests must pass throughout
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

## Audit Findings (from discuss-milestone)

**Critical Issues:**
- Art.tsx: 1,478 lines (3 minigames in 1 file)
- GameBoard.tsx: 1,052 lines (rendering + input + math mixed)
- rotationTimestamps memory leak (~6000 allocations/session)

**High Priority:**
- GameEngine.tick() is 167 lines
- Hard-coded values scattered
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
Stopped at: Milestone v1.1 initialization
Resume with: `/gsd:plan-phase 8`
Next action: Create feature branch, then plan Phase 8

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<commit>`, `<merge>`, `<status>`, `<handoff>`

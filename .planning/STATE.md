# Project State

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- None — ready for Phase 16/17 work

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-24)

**Core value:** The game feels satisfying to play on mobile - responsive controls, smooth animations, no input lag.
**Current focus:** v1.2 progression system — ranks 0-39 with new upgrades and mechanics

## Current Position

Phase: 17 of 18 (Mixer Band)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-01-24 - Completed 17-01-PLAN.md

Progress: █████░░░░░ 35%

## What's Done

### Lights Malfunction Rework (Completed 2026-01-24)

Replaced random trigger with player-controlled brightness system:
- **Soft dropping** (S key or drag down) charges the lights
- **Not soft dropping** starts grace period, then dims, then triggers malfunction
- CIRCUIT_STABILIZER now extends grace period (+0.75s per level, max 8s at level 4)

Timing:
- Grace period: 5s base
- Dim duration: 5s (100% → 10%)
- Recovery: ~0.25s at 400%/sec
- Overflare: 110% peak for visual feedback

Also removed crack color pool UI from top of screen (freeing space for hold/next piece).

### v1.1 Architecture Refactor (Shipped 2026-01-21)

All 6 phases (8-13) complete. See [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) for full details.

### v1.0 MVP (Shipped 2026-01-21)

All 7 phases complete. See [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) for full details.

## Accumulated Context

### Key Technical Discovery

**SVG Coordinate Conversion with preserveAspectRatio="xMidYMid slice"**

Simple viewBox math doesn't work. Must use:
```tsx
const refPoint = document.getElementById('coord-reference');
const ctm = refPoint.getScreenCTM();
const svgPoint = screenPoint.matrixTransform(ctm.inverse());
```

### Balance Summary (Current v1.1.16)

| Complication | Trigger | Player Mitigation |
|--------------|---------|-------------------|
| Laser | Capacitor drains on pop | +10% refill on piece lock |
| Controls | Heat builds on rotate | Heat dissipates when idle |
| Lights | Brightness dims when not soft dropping | Soft drop to recharge |

All three complications now have player-driven triggers AND mitigations.

## Session Continuity

Last session: 2026-01-24
Stopped at: UI improvements, preparing task list for next session
Phase 17 Status: 2/3 plans complete (17-01, 17-02 done)
**Version:** 1.1.19

### This Session Summary (2026-01-24 Evening)

**What was done:**
1. Executed 17-02-PLAN (piece preview boxes) - commits up to 93b9ef0
2. Fixed piece preview sizing/positioning (fixed 48x48 boxes, centered)
3. Major UpgradePanel UI overhaul:
   - +/- buttons instead of "UPGRADE" button
   - Added Features section (GOOP_HOLD_VIEWER, GOOP_WINDOW, ACTIVE_EXPANSION_SLOT)
   - Reordered: Actives → Features → Passives
   - Fixed PRESSURE_CONTROL max level bug (was capped at 5, now uses correct maxLevel=8)
4. Minigame pulsing improvements:
   - Active: purple → red pulse (more noticeable)
   - Text: white instead of red (contrast with red pulse)
   - Solved: snap to green, fade to purple over 2s
5. UpgradePanel: Current + Max on same line

### NEXT SESSION TASKS (Priority Order)

**Quick UI Fixes:**
1. UpgradePanel: Remove "ACTIVES (0/1 equipped)" text, replace with centered "Earn PWR by Increasing your Operator Rank" (Amazon Ember font, same size)
2. Fix Max text for minigame upgrades to say "Easier Fixing Sequence" for all 3

**Bugs to Investigate:**
3. **Pressure not rising bug** - Sometimes pressure doesn't start rising for a long time. User couldn't reproduce consistently, may be related to timing/speed. Investigate anything connected to pressure rise timing/start conditions.

4. **Falling pieces don't interact with cracks** - After clears, when pieces fall (gravity), they don't destroy cracks (different color) or consume them (same color). This is different from normal single-piece falling. Need to check sticky gravity / collision logic.

**Feature: Goop Dump Rework:**
5. GOOP_DUMP active should spawn units from TOP and fall down across board length (gives player reaction time). Units should:
   - Move with the board (unlike main falling piece)
   - Be "ghosts" until they lock (like main piece)
   - Fall from top, not spawn in place

**RESEARCH REQUIRED - Tetris Movement Feel:**
6. **Lock delay / last-moment sliding** - In Tetris you can "slide" pieces at the last moment before locking. Research how Tetris achieves this feel. User wants this in game.

7. **Sideways movement into gaps** - In Tetris, if there's a vertical wall with one unit missing, you can move a falling piece sideways INTO that gap. Currently not possible in this game. Research how Tetris handles this collision logic.

⚠️ **WARNING for tasks 6-7:** User previously attempted these features and it "broke pretty badly" with cascading bugs. They reverted. Approach with caution:
- Do thorough research first
- Understand the existing collision/movement system deeply
- Make small, testable changes
- Test extensively after each change

### Key Files for Investigation

**Pressure rise timing:**
- `core/GameEngine.ts` - tick() function, pressure calculation
- `complicationConfig.ts` - CONTROLS complication config

**Gravity/crack interaction:**
- `core/GameEngine.ts` - applyGravity(), handleClearAndScore()
- `utils/gameLogic.ts` - findConnectedGroup(), checkCollision()

**Goop Dump:**
- `core/commands/actions.ts` - ActivateAbilityCommand
- `core/GameEngine.ts` - activateAbility()

**Tetris movement feel:**
- `core/GameEngine.ts` - movePiece(), lockPiece()
- `utils/gameLogic.ts` - checkCollision()
- Current lock mechanism needs understanding before modification

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<commit>`, `<merge>`, `<status>`, `<handoff>`

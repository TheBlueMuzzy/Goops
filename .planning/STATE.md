---
title: Project State
type: session
tags: [active, continuity, status]
updated: 2026-02-10
---

# Project State

## Current Position

Phase: 33 of 38 (Rank 0 Training Sequence)
Plan: 4 of 4 in current phase — Tutorial v2 redesign approved, full rebuild next
Status: In progress — D-phase bugs fixed, Tutorial2.md finalized, ready for full tutorial rebuild
Last activity: 2026-02-15 - Tutorial2.md design review complete, all 3 user concerns addressed

Progress: █████░░░░░ 50%

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- `feature/tutorial-infrastructure` (Phase 31 complete, Phase 32 complete, Phase 33 in progress)

## Next Steps

**Tutorial v2 redesign (Tutorial2.md) finalized.** Ready for full rebuild.

**Key design decisions (2026-02-15):**
- 14 steps (down from 19), 6 phases (A:1, B:4, C:4, D:3, E:1, F:1)
- Player never waits > 3s without an action — C1 pressure sped up to 2.5 rate (~3s to reach goop)
- Pressure is "honest": only rises when relevant, popping lowers it, never reaches 100%
- D1 pressure = 0 (player just reading about cracks, not managing pressure)
- F1 graduation: pressure caps at 95% → practice message → "swipe up to leave training" → console
- Stack overflow during F1: "Training is over. Swipe up to end." → console (no end-game screen)
- New features needed: continuous piece spawning, persistent D3 discovery trigger, pressure cap, swipe-up exit, pop-lowers-pressure during training

**D-phase bugs fixed (2026-02-14, in this commit):**
1. D2 piece never falls — isDelayedPause expanded for position-gated + cracks-offscreen steps
2. D3 soft-lock — added spawnCrack (green, near-stack) to D3 config
3. D2 retry — staged 3-phase: freeze → 1s → pop → 1.5s → retry message
4. D2 message-timing branch reorder — position-gated → cracks-offscreen → pauseDelay
5. Offscreen arrow threshold — `>` to `>=` in GameBoard.tsx
6. D3 discovery — `some()` not `every()`, auto-skip after 15s

**What changed (uncommitted):**
- All prior C-phase + D1 crack spawn changes (from last session)
- `hooks/useTrainingFlow.ts`: isDelayedPause, branch reorder, staged retry (3 phases), discovery-gated D3 with auto-skip
- `data/trainingScenarios.ts`: D3 spawnCrack added
- `components/GameBoard.tsx`: offscreen arrow threshold `>` → `>=`

### Key Technical Changes This Session

**PieceSpawn Refactor (types/training.ts, useTrainingFlow.ts)**
- Replaced `size: number` with `shape: GoopShape` + optional `rotation: number`
- Spawn logic now finds actual shape templates from TETRA_NORMAL/PENTA_NORMAL/HEXA_NORMAL
- Applies rotation via `getRotatedCells()` for initial orientation
- B1: blue T_I horizontal (rotation:1), B3: yellow T_T, B4: blue T_O (2x2), D2: green T_O

**Per-Blob Shake (GameBoard.tsx)**
- Removed per-color-group shake (was shaking ALL blobs of same color)
- Added `isBlobShaking = blob.id === shakingGroupId` check on each blob's `<g>` in both goo-filter and cutout sections
- Each blob shakes independently when rejected

**Training Input Gating (useInputHandlers.ts, GameBoard.tsx, Game.tsx)**
- `disableSwap`: Skips hold interval entirely (no radial graphic, no swap event)
- `disablePop`: All goop taps trigger shake+rejection when `AllowedControls.pop===false`
- `trainingHighlightColor`: Wrong-color taps trigger shake+rejection
- All three passed as props: Game.tsx → GameBoard → useInputHandlers

**Pressure Color Filter (useTrainingFlow.ts, types/training.ts)**
- New `advancePressureAboveColor` StepSetup field
- When set, pressure-above-pieces poll only checks cells of that color
- C1B uses `COLORS.YELLOW` — triggers when pressure covers yellow T, not all blues

**Highlight System (GameEngine.ts, useTrainingFlow.ts, GameBoard.tsx, actions.ts)**
- `trainingHighlightColor` on GameEngine + returned from useTrainingFlow
- CSS `training-pulse` animation: scale 1→1.06 with `transform-box: fill-box`
- Pop color restriction in PopGoopCommand: rejects pops of non-matching color
- C1C highlights YELLOW (pop yellow → C2 shows blue merge + solidify timing)

**B-Phase Single-Fall Flow (trainingScenarios.ts)**
- All 3 messages during SAME first piece fall: B1 (goop intro) → B1B at 25% → B2 at 40%
- B2: no separate piece spawn, no reshow, pauseGame:false, fast-drop enabled mid-fall
- B4_PRACTICE: new step after B3, spawns blue 2x2, "Practice what you've learned"
- 16 total steps across 6 phases

### Decisions Made

- Typography: 18px minimum body, CSS classes with !important, full project sweep
- Journal layout: accordion (single column) over sidebar+content (two column)
- TEXT_MANIFEST.md as editable text source-of-truth
- Garble system: bracket notation, no partial corruption
- Training mode: pendingTrainingPalette interception, tick gates, freezeFalling
- Advance arming prevents dismiss-tap from triggering advance
- B2 keywords: "down" and "press" are white, not green
- C-phase: pop yellow (not blue) → demonstrates merge + solidify timing with blue-on-blue

### Pipeline Architecture Session (2026-02-10)

**Goal:** Design a "Lossless Pipeline" integrating BMUZ + GSD + Agent Teams.

**Installed:**
- Agent Teams feature flag enabled globally (~/.claude/settings.json)
- `/build-with-agent-team` skill installed (~/.claude/skills/build-with-agent-team/)

**Architecture Explored (4-Agent Team):**
- Lead (user handler), Scribe (docs), Builder (code), Researcher (eyes)
- Scribe updates STATE/ROADMAP/SUMMARY/PRD/CLAUDE.md/memory in real-time
- Researcher uses Playground (design exploration) + Playwright (automated testing)
- Wrapper skill reads GSD PLAN.md and orchestrates AT team

**Critical Concerns Identified:**
- Token cost: 4 agents = 3-5x cost per session (too expensive for small tasks)
- AT is experimental (no session resume, known bugs, could change)
- Lead context bloat from message relaying (not actually "lean")
- GSD plans are sequential — parallel agents don't add speed
- Non-coders can't debug team coordination failures

**Revised Direction:**
- Enhanced single-agent with smart automation as default
- Agent Teams as opt-in power mode for big plans only
- Better hooks for auto-saving STATE.md (solve context loss without AT)
- Playground for non-CLI visual interaction (JSON config files)
- Subagents for parallel research (already works, no AT needed)

**User's Core Needs (refined):**
1. Low cost
2. Lossless memory + vision capture
3. Project manager that doesn't fall out of GSD loop
4. Simple, covers non-coder mistakes
5. End-to-end with flexible entry points
6. Parallel research + documentation
7. Non-CLI interaction methods

**Status:** Designing final architecture. No code built yet for pipeline skill.

### Known Issues

- PiecePreview NEXT/HOLD labels at 18px may be too large for 48px box
- Some SVG text in Art.tsx not yet standardized
- Per-step crack spawning now active (spawnCrack handler in useTrainingFlow.ts)

### Roadmap Evolution

- Milestone v1.5 shipped: Soft-body goop rendering, 4 completed phases (2026-02-08)
- Milestone v1.6 created: Progressive Tutorial, 8 phases (Phase 31-38)

---

## Session Continuity

Last session: 2026-02-15
**Version:** 1.1.13
**Branch:** feature/tutorial-infrastructure
**Build:** 266

### Resume Command
```
Phase 33 Plan 04 — Tutorial v2 full rebuild

Tutorial2.md is the approved design spec (14 steps, 6 phases).
D-phase bug fixes committed. 210 tests pass.

WHAT TO DO:
1. Read .planning/Tutorial2.md — this IS the plan
2. Rebuild entire tutorial from scratch based on Tutorial2.md
3. Remove "jump to D" debug button
4. New features needed: continuous piece spawning, pressure cap at 95%,
   swipe-up exit, persistent D3 discovery trigger, pop-lowers-pressure
5. Build top-to-bottom: types → scenarios → steps → flow hook → rendering
6. Test full flow A1→F1
```

---

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<runtests>`, `<save>`, `<deploy>`, `<research>`, `<askme>`, `<flow>`

## Related

- [[HOME]] - Navigation hub
- [[PROJECT]] - Full project definition
- [[ROADMAP]] - All milestones

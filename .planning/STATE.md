---
title: Project State
type: session
tags: [active, continuity, status]
updated: 2026-02-23
---

# Project State

## Current Position

Phase: 33 of 38 (Rank 0 Training Sequence)
Plan: 33-06 complete → 33-07 next (Custom Handlers + Integration + UAT)
Status: Tutorial v3 — Plan 33-06 committed (ef26d1d, c3ec712), ready for 33-07
Last activity: 2026-02-23 — Plan 33-06 completed (state machine framework + 15 step configs)

Progress: █████████░ 95%

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- `feature/tutorial-infrastructure` (Phase 31 complete, Phase 32 complete, Phase 33 in progress)

## Tutorial v3 Rewrite (2026-02-19)

### Why Rewrite
Tutorial v2 had persistent bugs through 11 UAT rounds. Root cause: fragile architecture with 20+ refs, 10+ pause/unpause locations, and custom handlers embedded in a 1400-line effect chain. Small changes caused destructive regressions. A clean rewrite with proper architecture is faster than continued patching.

### Design Document
**Source of truth:** `.planning/Tutorial3.md`
- Full audit of v2 (every step, every pattern, every coupling point)
- All designer questions answered and confirmed
- 15 steps across 6 phases (E2_POP_SEALED removed, E3 renumbered to E2)
- Architecture direction: state machine, handler registry, timeout pool

### Key Decisions Confirmed
| Decision | Detail |
|----------|--------|
| Architecture | State machine pattern (ENTERING -> WAITING -> MESSAGE_VISIBLE -> ARMED -> ADVANCING) |
| Step count | 15 steps, 6 phases (A:1, B:4, C:4, D:3, E:2, F:1) |
| E-phase | E2_POP_SEALED eliminated, absorbed into E1 via standard hint pattern. E3->E2 renumbered. |
| Crack sealing | Two-step: plug on lock, seal on pop (implemented in plan 33-05) |
| D3 trigger | CRACK_OFFSCREEN event (implemented in plan 33-05) |
| D2 retry | Accumulate cracks (never remove old ones) instead of pop-all reset |
| F1 exit | Console screen, rank 0->1 (no end screen). Replays don't affect rank. |
| Config editing | All timings/colors/pause states as named config fields, easy to change |
| Garble system | Keep exactly as-is |
| Future tutorials | Same system reused at higher ranks for new concepts |

### GSD Plans
```
Plan 33-05: Engine Prerequisites (2 tasks) — COMPLETE (b6f4a40)
  1. Two-step crack sealing (plug on lock, seal on pop, glow indicator)
  2. CRACK_OFFSCREEN event (fires when arrow first appears)

Plan 33-06: Tutorial Framework + Step Configs (2 tasks) — COMPLETE (ef26d1d, c3ec712)
  1. State machine framework (lifecycle states, timeout pool, handler registry, types)
  2. Step configs (15 steps) + messages + standard handler implementations

Plan 33-07: Custom Handlers + Integration + UAT (2 tasks + 1 checkpoint)
  1. Custom handlers (D2 retry, D3 discovery, E1 seal+pop, F1 freeplay)
  2. Wire into Game.tsx, GameBoard, TutorialOverlay, remove old code
  3. Full A1->F1 playthrough verification
```

### What Plan 33-06 Built
- **State machine:** `hooks/tutorial/stateMachine.ts` — 5 lifecycle states with derived properties
- **Timeout pool:** `hooks/tutorial/timeoutPool.ts` — Named timers, clearAll on step change
- **Handler registry:** `hooks/tutorial/handlers.ts` — Standard + stubs for 4 custom handlers
- **Types updated:** `types/training.ts` — 15 step IDs, handlerType, hintDelay, state machine types
- **Orchestrator:** `hooks/useTrainingFlow.ts` — Rewritten using pool + state machine (same Game.tsx interface)
- **Step configs:** `data/trainingScenarios.ts` — 15 steps with handlerType assignments
- **Messages:** `data/tutorialSteps.ts` — 15 messages, F1 endings, D2 retry

### Next Steps
1. Execute Plan 33-07: Custom handlers + integration + UAT

---

## Prior Work (v2 — for reference)

<details>
<summary>Tutorial v2 History (UAT rounds 1-11)</summary>

### What v2 Built (2026-02-15)
- 16 steps (A:1, B:4, C:4, D:3, E:3, F:1), 6 phases
- All new step IDs, messages, and scenario configs
- 6 features: continuousSpawn, pressureCap, periodicCrackInterval, autoSkipMs, persistent D3 discovery, F1 ending states
- Pop-lowers-pressure, F1 graduation + overflow endings

### UAT Rounds Summary
- **Rounds 1-6**: Basic flow fixes, rendering, progression bugs
- **Rounds 7-8**: Message stability, E-phase split, pressure cap
- **Rounds 9-10**: E-phase redesign, F1 soft crash, message flash fixes
- **Round 11**: E1 GOAL_CAPTURED not firing (2 root causes found, fixes applied but untested)

### Architecture Problems Identified
- 1400-line useTrainingFlow.ts with 20+ refs
- Pause/unpause in 10+ scattered locations
- 4 steps with 200+ lines of custom code embedded in main effect
- Deferred timeouts requiring generation counter pattern
- D3 discovery crossing step boundaries via intentionally un-cleaned ref
- trainingPopLowersPressure set but never read by engine

</details>

## Known Issues

- PiecePreview NEXT/HOLD labels at 18px may be too large for 48px box
- Some SVG text in Art.tsx not yet standardized
- **Fill rendering "almost hole" inversion**: fillRule="evenodd" issue with near-touching vertices

---

## Session Continuity

Last session: 2026-02-23
**Version:** 1.1.13
**Branch:** feature/tutorial-infrastructure
**Build:** 307

### Resume Command
```
Phase 33 — Tutorial v3 Rewrite

Plans 33-05 and 33-06 COMPLETE. One plan remaining.

WHAT TO DO:
1. Execute Plan 33-07: Custom handlers + integration + UAT
   - Read .planning/phases/33-rank-0-training-sequence/33-07-PLAN.md
   - Implement D2 retry, D3 discovery, E1 continuous, F1 freeplay handlers
   - Wire into Game.tsx, remove old v2 code
   - Full A1->F1 playthrough verification
```

---

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<runtests>`, `<save>`, `<deploy>`, `<research>`, `<askme>`, `<flow>`

## Related

- [[HOME]] - Navigation hub
- [[PROJECT]] - Full project definition
- [[ROADMAP]] - All milestones

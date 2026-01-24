# Project State

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- None — v1.2 complete, ready for bug fix work

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-24)

**Core value:** The game feels satisfying to play on mobile - responsive controls, smooth animations, no input lag.
**Current focus:** v1.2 shipped — bug fixes and testing before next milestone

## Current Position

Phase: 18 of 18 (all complete)
Plan: All plans complete
Status: v1.2 SHIPPED
Last activity: 2026-01-24 — v1.2 milestone archived

Progress: ████████████████████ 49/49 plans (v1.0 + v1.1 + v1.2 complete)

## What's Done

### v1.2 Progression System (Shipped 2026-01-24)

Full ranks 0-39 progression with 4 bands, 20 upgrades, and 3 new colors.

Key features:
- 20 upgrades across passive/active/feature types
- Active ability system with per-ability charge times
- Lights malfunction rework (player-controlled brightness)
- Expanding cracks mechanic
- 3 new colors: Orange@10, Purple@20, White@30

See [v1.2-ROADMAP.md](milestones/v1.2-ROADMAP.md) for full details.

### v1.1 Architecture Refactor (Shipped 2026-01-21)

All 6 phases (8-13) complete. See [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) for full details.

### v1.0 MVP (Shipped 2026-01-21)

All 7 phases complete. See [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) for full details.

## Accumulated Context

### Balance Summary (Current v1.2.0)

| Complication | Trigger | Player Mitigation |
|--------------|---------|-------------------|
| Laser | Capacitor drains on pop | +10% refill on piece lock |
| Controls | Heat builds on rotate | Heat dissipates when idle |
| Lights | Brightness dims when not soft dropping | Soft drop to recharge |

All three complications have player-driven triggers AND mitigations.

### Active Abilities (v1.2.0)

| Active | Charge Time | Level 1 | Level 2 | Level 3 |
|--------|-------------|---------|---------|---------|
| Cooldown Booster | 20s | +25% cooldown | +35% | +50% |
| Goop Dump | 15s | 1 wave (18 pcs) | 2 waves | 3 waves |
| Goop Colorizer | 25s | 6 match | 7 match | 8 match |
| Crack Down | 30s | 3 cracks low | 5 cracks | 7 cracks |

## Known Issues (Post v1.2)

**Fixed:**
- Gravity pieces now interact with cracks (v1.1.27)
- Non-matching color pieces no longer destroy cracks (they persist under goop)

**Researched (see INVESTIGATIONS.md):**
- Tetris movement feel — research complete, ready for implementation
- Pressure not rising bug — likely fixed in v1.1, cannot reproduce

### Tetris Movement Feel Summary

**Key Finding:** Lock delay and sideways-into-gaps are linked systems.

| What Tetris Has | What Goops Has | Gap |
|-----------------|----------------|-----|
| Move Reset lock delay (resets timer on any move/rotate) | Fixed 500ms timer | **HIGH IMPACT** - add move reset |
| 15-reset limit (prevents infinite spin) | No limit | Need to add with move reset |
| SRS wall kicks (+1/+2 y-offsets for climbing) | Basic kicks (no upward) | **MEDIUM IMPACT** - add +y kicks |
| Rotation-state-dependent kick tables | Same kicks for all states | Low priority |

**Recommended Implementation:**
1. Phase 1: Add move reset to lock delay (reset timer on rotation/board move, 15-reset cap)
2. Phase 2: Add upward kick tests (+1 y-offset)

⚠️ **CAUTION:** Previous attempts broke badly. Issues likely due to cylindrical coordinate wrapping and gridX/screenX/boardOffset sync.

## Session Continuity

Last session: 2026-01-24
**Version:** 1.1.28

### This Session Summary (2026-01-24)

**What was done:**
- Investigated "pressure not rising" bug — archived to INVESTIGATIONS.md (likely fixed in v1.1)
- Fixed gravity pieces not interacting with cracks (v1.1.27)
- Changed behavior: non-matching pieces no longer destroy cracks (persist under goop)
- Fixed footer text layout — Version/MuzzyMade symmetrical, "RANK SELECT" centered (v1.1.28)

**Decisions made:**
- Cracks persist when covered by non-matching color goop (visible through/over)
- Gravity pieces check for crack matches on landing
- "OPERATOR RANK" renamed to "RANK SELECT" in console footer

**Next session:**
- Research: Tetris movement feel (lock delay, sideways into gaps) — ⚠️ CAUTION, previous attempts broke badly
- Consider planning v1.3 or v2.0 milestone

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<commit>`, `<merge>`, `<status>`, `<handoff>`

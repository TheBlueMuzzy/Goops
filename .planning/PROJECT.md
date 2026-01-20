# Goops

## What This Is

A puzzle-action game where players operate as tank maintenance technicians clearing colored goop from a cylindrical pressure tank. Built with React/TypeScript/Vite. Mobile-optimized with touch controls.

## Core Value

The game feels satisfying to play on mobile - responsive controls, smooth animations, no input lag.

## Requirements

### Validated

- ✓ Core gameplay loop (piece falling, rotation, collision, clearing) — existing
- ✓ Cylindrical grid wrapping — existing
- ✓ Scoring system with bonuses (height, off-screen, adjacency, speed) — existing
- ✓ Goal/objective system (crack marks to fill) — existing
- ✓ Rank progression (XP, levels, color unlocks) — existing
- ✓ Upgrade system (time bonus, stability) — existing
- ✓ Mobile performance optimization (40fps, simplified rendering) — existing
- ✓ Console/Periscope phase UI — existing
- ✓ Minigame sliders (Reset Laser, Reset Lights) — existing
- ✓ Unit test infrastructure (36 tests, pre-commit hooks) — existing
- ✓ Dial spins when dragged (Reset Controls dial) — snaps to 4 corners
- ✓ Reset Laser puzzle logic (4 sliders match indicator lights)
- ✓ Reset Lights puzzle logic (sequence memory: slider → watch → repeat → slider)
- ✓ Reset Controls puzzle logic (dial alignment: 4 corners in sequence)
- ✓ Complications — triggers and effects defined and implemented
- ✓ Minigame-Complication integration — puzzles resolve complications

### Active

None — milestone complete, ready for user verification

### Out of Scope

- Control state persistence (save/load between sessions) — not needed for v1
- Multi-color pieces — needs piece redesign first

## Context

**Current state:** All phases complete. Complication system fully implemented:

**Complication Triggers:**
| Type | Trigger | Rank |
|------|---------|------|
| LASER | Cumulative units popped (12-24 threshold) | 1+ |
| CONTROLS | 20 rotations within 3 seconds | 2+ |
| LIGHTS | 50% chance on piece lock when pressure 3-5 rows above goop | 3+ |

**Complication Effects:**
| Type | Effect |
|------|--------|
| LASER | Two-tap mechanic (first tap primes, restarts fill; second tap pops) |
| CONTROLS | Requires 2 inputs per move, held keys at half speed |
| LIGHTS | Dims to 10% + grayscale over 1.5s (alert exempt) |

**Key files:**
- `components/Art.tsx` — All minigame state machines, puzzle logic, visual feedback
- `components/GameBoard.tsx` — Game rendering, LIGHTS dim effect via CSS filter
- `core/GameEngine.ts` — Complication triggers and spawn logic
- `core/commands/actions.ts` — MoveBoardCommand rotation tracking
- `Game.tsx` — CONTROLS double-input effect, movement loop

**User preferences:**
- Not a professional engineer, prefers readable code over abstractions
- Targeted minimal changes, don't refactor beyond what's asked
- Run tests after every change

## Constraints

- **Mobile-first**: Controls must work well on touch devices
- **Existing patterns**: Follow the slider implementation pattern for consistency
- **Test requirement**: Run `npm run test:run` after changes, fix failures immediately

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sliders use local state in Art.tsx | Simple, self-contained, no game logic coupling | ✓ Good |
| LIGHTS effect via CSS filter on SVG | Alert stays visible, cleaner than overlay | ✓ Good |
| CONTROLS tracks timestamps not counter | Speed-based trigger (20 in 3s) needs timing data | ✓ Good |
| LIGHTS trigger on piece lock | Situational trigger based on pressure gap, not counter | ✓ Good |

---
*Last updated: 2026-01-19 — Milestone complete, all 4 phases done*

# Goops

## What This Is

A puzzle-action game where players operate as tank maintenance technicians clearing colored goop from a cylindrical pressure tank. Features complication systems that challenge players, HUD meters for real-time feedback, and an upgrade system to tune difficulty. Built with React/TypeScript/Vite. Mobile-optimized with touch controls.

## Core Value

The game feels satisfying to play on mobile - responsive controls, smooth animations, no input lag.

## Requirements

### Validated

**v1.0 MVP:**
- ✓ Core gameplay loop (piece falling, rotation, collision, clearing)
- ✓ Cylindrical grid wrapping
- ✓ Scoring system with bonuses (height, off-screen, adjacency, speed)
- ✓ Goal/objective system (crack marks to fill)
- ✓ Rank progression (XP, levels, color unlocks)
- ✓ Mobile performance optimization (40fps, simplified rendering)
- ✓ Console/Periscope phase UI
- ✓ 65 tests, pre-commit hooks
- ✓ Complications (LASER, LIGHTS, CONTROLS) with minigame resolution
- ✓ HUD meters (laser capacitor, controls heat)
- ✓ Complication cooldowns (rank-scaled)

**v1.1 Architecture:**
- ✓ No files over 400 lines
- ✓ GameEngine.tick() under 50 lines (22 achieved)
- ✓ Event-based input communication
- ✓ Test coverage 112 tests

**v1.2 Progression (Phase 14-15):**
- ✓ Upgrade system overhaul (17 upgrades with level effects)
- ✓ 8 Onboarding Band upgrades implemented (ranks 2-9)
- ✓ Active ability system (equip, charge, activate)
- ✓ AUTO_POPPER end-game mechanic
- ✓ COOLDOWN_BOOSTER active ability
- ✓ Focus Mode (time slow at console)
- ✓ Dense Goop (increased fall speed)
- ✓ Pressure Control (+5s per level, 8 levels)

### Active

**Phase 16: Junk Band** (ranks 10-19)
- Junk Goop complication + starting junk mechanic
- Orange color unlock at rank 10
- 4 upgrades: Junk Uniformer, Goop Swap, Goop Dump, Sealing Bonus

### Out of Scope (v1.2)

- Multi-color pieces — Phase 17 (rank 20+)
- Expanding cracks — Phase 18 (rank 30+)
- Sound design
- Save state persistence

## Context

**Current state:** v1.2 Progression System in progress. 15 phases, 39 plans complete.

**Shipped in v1.2 (so far):**
- Upgrade system overhaul: 17 upgrades with type/passive/active/feature
- 8 Onboarding Band upgrades (ranks 2-9) fully implemented
- Active ability system: equip UI, charge circles, activation
- Charging: 1%/sec passive + 10% jump per crack-goop seal

**Complication System:**
| Type | Trigger | Effect | Unlock |
|------|---------|--------|--------|
| LASER | Capacitor drains to 0 | Two-tap mechanic | Rank 1 |
| LIGHTS | 50% on piece lock (pressure gap) | 10% brightness + grayscale | Rank 2 |
| CONTROLS | Heat meter reaches 100 | 2 inputs per move, half hold speed | Rank 3 |

**Onboarding Band Upgrades (8 total):**
| Upgrade | Rank | Type | Effect per Level |
|---------|------|------|------------------|
| Circuit Stabilizer | 2 | passive | -7.5% trigger chance |
| Auto-Popper | 3 | passive | -4% end-game decay |
| Capacitor Efficiency | 4 | passive | -6.25% drain rate |
| Cooldown Booster | 5 | active | +25% cooldown extension |
| Gear Lubrication | 6 | passive | +12.5% dissipation |
| Focus Mode | 7 | passive | -10% time speed |
| Dense Goop | 8 | passive | +12.5% fall speed |
| Pressure Control | 9 | passive | +5s game time |

**Key files:**
- `constants.ts` — UPGRADES configuration (17 upgrades)
- `core/GameEngine.ts` — Complication triggers, HUD meters, active abilities
- `components/ActiveAbilityCircle.tsx` — Charge/activate UI
- `components/UpgradePanel.tsx` — Purchase + equip UI

**User preferences:**
- Not a professional engineer, prefers readable code over abstractions
- Targeted minimal changes, don't refactor beyond what's asked
- Run tests after every change

## Rank Band System

Progression is organized into bands of 10 ranks. See PRD.md for full details.

| Band | Ranks | Mechanic | New Color | Upgrades | Status |
|------|-------|----------|-----------|----------|--------|
| Onboarding | 0-9 | Complications | - | 8 | **Complete** |
| Junk | 10-19 | Starting Junk | Orange | 4 | Phase 16 |
| Mixer | 20-29 | Multi-color Pieces | Purple | 4 | Phase 17 |
| Cracked | 30-39 | Expanding Cracks | White | 4 | Phase 18 |
| Future | 40-99 | TBD | TBD | TBD | Future |

**Upgrade types:** passive (always-on), active (equip + charge), feature (unlock only)

**Focus next:** Phase 16 — Junk Band

## Constraints

- **Mobile-first**: Controls must work well on touch devices
- **Existing patterns**: Follow the slider implementation pattern for consistency
- **Test requirement**: Run `npm run test:run` after changes, fix failures immediately

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sliders use local state in Art.tsx | Simple, self-contained, no game logic coupling | ✓ Good |
| LIGHTS effect via CSS filter on SVG | Alert stays visible, cleaner than overlay | ✓ Good |
| CONTROLS tracks heat meter not counter | Continuous feedback, clearer than input counting | ✓ Good |
| LIGHTS trigger on piece lock | Situational trigger based on pressure gap | ✓ Good |
| Rank Band System (10 ranks each) | Predictable progression, upgrades throughout band | ✓ Good |
| All rank checks use starting rank | Prevents mid-run unlocks, consistent behavior | ✓ Good |
| Max-level simplifies puzzles | Fewer steps (3 vs 4), not different mechanics | ✓ Good |
| SVG coordinate conversion via getScreenCTM | Handles preserveAspectRatio="xMidYMid slice" | ✓ Good |
| Managers operate on passed state, don't own it | Clean separation, testable | ✓ Good |
| Event-based input replaces callback props | Reduces prop drilling, cleaner component boundaries | ✓ Good |
| Active ability charging: 1%/sec + 10% per crack | Rewards crack-goop sealing, ~100s passive full | ✓ v1.2 |
| Equip checkbox in UpgradePanel | Simple UI, no extra screen needed | ✓ v1.2 |
| Active circles under controls meter | Right side of screen, stacked vertically | ✓ v1.2 |
| AUTO_POPPER probabilistic auto-pop | Reduces end-game penalty naturally | ✓ v1.2 |
| Focus Mode slows time at console | Gives breathing room during complications | ✓ v1.2 |
| Dense Goop increases fall speed | Optional difficulty increase, respecable | ✓ v1.2 |

---
*Last updated: 2026-01-24 after Phase 15 (Onboarding Band) complete*

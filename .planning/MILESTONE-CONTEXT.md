# Milestone Context: v1.2 Band Implementation

**Generated:** 2026-01-23
**Status:** Ready for level effects discussion, then /gsd:new-milestone

## Scope

**Target:** Implement ranks 0-39 progression system
**Max rank for now:** 39 (Bands 4+ deferred until playtesting)
**Colors:** 4 base + Orange@10 + Purple@20 + White@30 = 7 total

## Key Design Decisions

1. **All passives are 4 levels** (not 5) — except Pressure Control which is 8
2. **All actives are 1 point** — unlock only, no leveling
3. **Features are 1 point** — unlock only (slots, viewers)
4. **Level 0 = no effect** — must spend a point to get benefit
5. **Respec planned** — players can reallocate points (implementation TBD)
6. **60 points available by rank 39, only 39 earned** — intentional scarcity, forces choices

## Upgrade Types

- **Passive:** Always-on benefits, 4 levels (costs 4 points to max)
- **Active:** Equippable abilities charged by sealing cracks, 1 level (costs 1 point)
- **Feature:** UI/QoL unlocks, 1 level (costs 1 point)

## Progression Table (Ranks 0-39)

### Onboarding Band (Ranks 0-9) — 33 points available

| Rank | Complication | Upgrade Name | Type | Levels | Effect Description |
|------|--------------|--------------|------|--------|-------------------|
| 0 | Pressure | — | — | — | Builds over time, ends the workday |
| 1 | Cracks | — | — | — | Core mechanic |
| 2 | Malfunctioning Lights | Circuit Stabilizer | Passive | 4 | Reduces Lights trigger chance |
| 3 | — | Auto-Popper | Passive | 4 | Auto-pops leftover goop at end of day |
| 4 | Malfunctioning Laser | Capacitor Efficiency | Passive | 4 | Reduces laser drain when popping |
| 5 | — | Cooldown Booster | Active | 1 | Increases all malfunction cooldowns |
| 6 | Malfunctioning Gears | Gear Lubrication | Passive | 4 | Increases heat dissipation rate |
| 7 | — | Focus Mode | Passive | 4 | Time slows while at the console |
| 8 | — | Dense Goop | Passive | 4 | Goop falls faster (can add/remove points) |
| 9 | — | Pressure Control | Passive | 8 | Extend time to reach 100% Pressure |

**Complication Notes:**
- Lights: "When the pressure is too far above the goops, they break"
- Laser: "Using the laser too much causes it to break"
- Gears: "Rotating the tank too much causes it to break"

### Junk Band (Ranks 10-19) — 13 points available

| Rank | Complication | Upgrade Name | Type | Levels | Effect Description | Color |
|------|--------------|--------------|------|--------|-------------------|-------|
| 10 | Junk Goop | Junk Uniformer | Passive | 4 | Starting junk more likely to spawn matching colors | +Orange |
| 11 | — | — | — | — | — | |
| 12 | — | Goop Swap | Passive | 4 | Swap falling goop with new goop faster | |
| 13 | — | — | — | — | — | |
| 14 | — | — | — | — | — | |
| 15 | — | Goop Dump | Active | 1 | Drops same colored junk across the board | |
| 16 | — | — | — | — | — | |
| 17 | — | — | — | — | — | |
| 18 | — | Sealing Bonus | Passive | 4 | Decreases sealing needed to charge Active abilities | |
| 19 | — | — | — | — | — | |

**Mechanic:** Tank starts with pre-existing junk goop, amount scales with rank.

### Mixer Band (Ranks 20-29) — 4 points available

| Rank | Complication | Upgrade Name | Type | Levels | Effect Description | Color |
|------|--------------|--------------|------|--------|-------------------|-------|
| 20 | Goop Mix | Active Expansion Slot | Feature | 1 | Allows 2nd Active to be equipped | +Purple |
| 21 | — | — | — | — | — | |
| 22 | — | Goop Hold Viewer | Feature | 1 | Shows the Goop in Holding | |
| 23 | — | — | — | — | — | |
| 24 | — | — | — | — | — | |
| 25 | — | Goop Colorizer | Active | 1 | Next 5 goop are same color as current falling goop | |
| 26 | — | — | — | — | — | |
| 27 | — | — | — | — | — | |
| 28 | — | Goop Window | Feature | 1 | Shows you the next Goop | |
| 29 | — | — | — | — | — | |

**Mechanic:** Falling goop can be split into 2 colors (multi-color pieces).

### Cracked Band (Ranks 30-39) — 10 points available

| Rank | Complication | Upgrade Name | Type | Levels | Effect Description | Color |
|------|--------------|--------------|------|--------|-------------------|-------|
| 30 | Expanding Cracks | Slow Cracks | Passive | 4 | Cracks grow slower | +White |
| 31 | — | — | — | — | — | |
| 32 | — | Crack Matcher | Passive | 4 | Match the next goop with the lowest existing crack | |
| 33 | — | — | — | — | — | |
| 34 | — | — | — | — | — | |
| 35 | — | Crack Down | Active | 1 | New cracks form on the bottom row for a while | |
| 36 | — | — | — | — | — | |
| 37 | — | — | — | — | — | |
| 38 | — | Active Expansion Slot | Feature | 1 | Allows 3rd Active to be equipped | |
| 39 | — | — | — | — | — | |

**Mechanic:** Cracks grow over time, requiring more coverage to seal.

## Level Effects (TBD)

These need to be defined in the next session:

| Upgrade | Levels | Level 1 | Level 2 | Level 3 | Level 4 |
|---------|--------|---------|---------|---------|---------|
| Circuit Stabilizer | 4 | ? | ? | ? | ? |
| Auto-Popper | 4 | ? | ? | ? | ? |
| Capacitor Efficiency | 4 | ? | ? | ? | ? |
| Gear Lubrication | 4 | ? | ? | ? | ? |
| Focus Mode | 4 | ? | ? | ? | ? |
| Dense Goop | 4 | ? | ? | ? | ? |
| Pressure Control | 8 | ? | ? | ? | ? (x8) |
| Junk Uniformer | 4 | ? | ? | ? | ? |
| Goop Swap | 4 | ? | ? | ? | ? |
| Sealing Bonus | 4 | ? | ? | ? | ? |
| Slow Cracks | 4 | ? | ? | ? | ? |
| Crack Matcher | 4 | ? | ? | ? | ? |

## Changes from Current Code

### Renames
- CONTROLS complication → **Gears**
- JUNK_UNIFORMITY → **Junk Uniformer**
- GOOPER → **Goop Dump**

### New Upgrades to Implement
- **Focus Mode** (passive, rank 7): Time slows at console
- **Dense Goop** (passive, rank 8): Faster goop fall, adjustable
- **Pressure Control** (passive, rank 9): Extend pressure timer, 8 levels
- **Goop Swap** (passive, rank 12): Faster swap mechanic
- **Sealing Bonus** (passive, rank 18): Reduce active charge cost
- **Goop Hold Viewer** (feature, rank 22): UI for held goop
- **Goop Colorizer** (active, rank 25): Next 5 goop same color
- **Goop Window** (feature, rank 28): UI for next goop preview
- **Slow Cracks** (passive, rank 30): Reduce crack growth rate
- **Crack Matcher** (passive, rank 32): Smart goop color matching
- **Crack Down** (active, rank 35): Force cracks to bottom

### Color Order Change
- Current: Base 4, +Teal@2, +White@5, +Orange@8
- New: Base 4, +Orange@10, +Purple@20, +White@30, +Pink@40, +Teal@50, +Grey@60

### Starting Junk Change
- Current: Starts at rank 3
- New: Starts at rank 10 (Junk Band)

## Future Bands (40-99) — Deferred

To be designed after extensive playtesting of ranks 0-39.

| Band | Ranks | Color | Notes |
|------|-------|-------|-------|
| Band 4 | 40-49 | Pink | TBD |
| Band 5 | 50-59 | Teal | TBD |
| Band 6 | 60-69 | Grey | TBD |
| Band 7 | 70-79 | Wild Rainbow | TBD |
| Band 8 | 80-89 | Black | TBD |
| Band 9 | 90-99 | — | TBD |

---

## Next Steps

1. `/clear` — Fresh context window
2. Discuss level effects for each upgrade
3. Explain intent behind each mechanic
4. `/gsd:new-milestone` — Create v1.2 milestone with phases

---

*This file captures the discuss-milestone output. Delete after /gsd:new-milestone creates the milestone.*

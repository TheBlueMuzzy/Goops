---
title: Project State
type: session
tags: [active, continuity, status]
updated: 2026-02-04
---

# Project State

## Current Position

Phase: 26.1 (Flatten Coordinate System) + SBG Integration
Plan: 3/3 complete - PHASE COMPLETE
Status: Seam wrapping works! Ready for visual tuning
Last activity: 2026-02-04 - Completed 26.1-03 seam wrapping

Progress: ███████░░░ ~70%

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- `soft-body-experiment` — Soft Body Goop (SBG) integration (v1.5 milestone)

## Next Steps

**Current:** Finetune goo filter visuals (user feedback: "messed up this round")
**Status:** Seam wrapping works, visuals need tuning
**Branch:** `soft-body-experiment`

### Seam Wrapping: SOLVED (2026-02-04)

**Design document:** `.planning/phases/26.1-flatten-coordinate-system/SEAM-WRAPPING-DESIGN.md`
**Visual reference:** `/art/wrap_example.png`

**Solution:** Goo filter merges duplicate blob renders at seam boundaries. No complex path clipping needed!

**How it works:**
1. `getBlobRenderOffsets()` detects when blob straddles viewport edge
2. Blob rendered at multiple X offsets (original + shifted by ±900px)
3. ClipPath masks each copy to viewport
4. Goo filter (stdDeviation=12, matrix 25/-15) visually merges the copies

**Debug tools:**
- Press backtick (`) for debug panel
- Enable "Show Vertices" for Proto-9 style vertex display
- Console logs when blob straddles seam

### What's Working
- SBG appears on lock
- Fill animation with inset path
- Fill pulse (ready-to-pop impulse)
- Same-color blob merging with attraction springs
- Position stays aligned when rotating
- Catmull-Rom smooth curves (not jagged polygons)
- ClipPath masks blobs to viewport (no rendering past edges)
- Physics no longer wraps individual vertices (prevents explosion)
- Debug vertices updated to Proto-9 style
- **Seam crossing WORKS** - goo filter merges duplicate renders at seam boundaries

### What's NOT Working
- **Goo filter visuals need tuning** - user reports visuals "messed up" after parameter changes
- Pop particles (droplets) - not implemented yet
- Some sliders may not be connected

### Changes Made This Session (2026-02-04)
- Added `tank-viewport-clip` clipPath to mask SBG rendering
- Removed X wrapping from `applyBoundaryConstraints()` - physics drifts freely
- Removed X wrapping from `shiftBlobsForRotation()` - prevents vertex explosion
- Updated `getBlobRenderOffsets()` to calculate which positions overlap viewport
- Updated debug vertices to Proto-9 style (yellow r=4 circles, lime edges, fill % label)
- Updated test for new no-wrap behavior

### v1.5 Soft-Body Integration Overview

Port soft-body physics visuals from completed prototypes (5b-9) into main game rendering.

| Phase | Name | Goal |
|-------|------|------|
| 25 | Physics Foundation | Port Verlet engine, adapt to game coordinates |
| 26 | Perimeter & Blob System | Replace rect rendering with perimeter-traced blobs |
| 26.1 | Flatten Coordinates | Remove cylindrical projection (DONE) |
| 27 | Active Piece Physics | Falling pieces use soft-body (snappy) |
| 28 | Locked Goop Behavior | Viscosity, fill, ready-to-pop, attraction |
| 29 | Pop & Cascade | Droplets, support detection, loose goop |
| 30 | Polish & Performance | Mobile optimization, parameter tuning |

---

## Proto 9 Final Settings (Source of Truth)

These are the FINAL tweaked values from Proto 9:

| Parameter | Value | Notes |
|-----------|-------|-------|
| WallThickness | 8px | Fill animation wall |
| Damping | 0.97 | High, preserves momentum |
| Stiffness | 1 | Very low, loose springs |
| Pressure | 3.0 | Volume maintenance |
| HomeStiffness | 0.3 | Shape retention |
| InnerStiffness | 0.1 | Inner vertex stability |
| ReturnSpeed | 0.5 | Moderate |
| Viscosity | 2.5 | Honey-like for locked blobs |
| Iterations | 3 | Constraint solver |
| Goopiness | 25px | SVG filter strength |
| AttractRadius | 20px | Tendril detection range |
| AttractStiffness | 0.005 | Tendril pull strength |
| TendrilSize | 10px | Tendril endpoint radius |

---

## Session Continuity

Last session: 2026-02-04
**Version:** 1.1.13
**Branch:** soft-body-experiment
**Build:** 168

### Files Modified This Session (2026-02-04)

**New files:**
- `.planning/phases/26.1-flatten-coordinate-system/SEAM-WRAPPING-DESIGN.md` - Full design document
- `.planning/phases/26.1-flatten-coordinate-system/26.1-03-SUMMARY.md` - Plan completion

**Modified:**
- `core/softBody/physics.ts` - Removed X wrapping from boundary constraints
- `hooks/useSoftBodyPhysics.ts` - Removed wrapPixelX from rotation shift
- `components/GameBoard.tsx` - Goo filter tuning (stdDeviation 8→12, matrix 25/-15), seam debug logging
- `tests/softBody.test.ts` - Updated test for no-wrap behavior

### Resume Command
```
SEAM WRAPPING WORKS! Phase 26.1 complete.

Goo filter successfully merges duplicate blob renders at seam.
Parameters: stdDeviation=12, feColorMatrix values="... 25 -15"

User feedback: Visuals "messed up" - need to finetune goo filter appearance.
The seam crossing works, but overall blob look may need adjustment.

NEXT: Finetune goo filter visuals based on user feedback.
```

---

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<runtests>`, `<save>`, `<deploy>`, `<research>`, `<askme>`, `<flow>`

## Related

- [[HOME]] - Navigation hub
- [[PROJECT]] - Full project definition
- [[ROADMAP]] - All milestones

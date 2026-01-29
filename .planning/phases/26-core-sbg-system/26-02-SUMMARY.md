---
phase: 26-core-sbg-system
plan: 02
subsystem: rendering
tags: [soft-body, physics, mesh-generation, grid-to-mesh]

requires:
  - phase: 26-01
    provides: Body structure, collision detection, spring physics
provides:
  - extractPerimeter() - converts cell Set to perimeter vertices
  - createBodyFromPerimeter() - creates physics Body from vertices
  - Game-accurate physics (falling vs locked bodies)
affects: [26-03, renderer-integration]

tech-stack:
  added: []
  patterns:
    - "Rest offsets relative to gridPos for anchored physics"
    - "Column-locked falling (X fixed, Y increases)"

key-files:
  modified:
    - components/SoftBodyDemo.tsx

key-decisions:
  - "Rest positions stored as offsets from gridPos, not absolute coordinates"
  - "Bodies track isLocked state - locked bodies anchor, falling bodies descend"
  - "Wave undulation at 50% original speed for calmer gloopy feel"

issues-created: []

duration: ~45min
completed: 2026-01-28
---

# Phase 26 Plan 02: Grid-to-Mesh Generation Summary

**Grid-to-mesh generation with game-accurate physics: falling bodies descend column-locked, locked bodies anchor with jiggle, both squish on collision**

## Performance

- **Duration:** ~45 min
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 1

## Accomplishments

- `extractPerimeter()`: Converts Set<"x,y"> cells to ordered perimeter vertices with subdivision
- `createBodyFromPerimeter()`: Creates complete Body with hub, springs, and rest offsets
- Game-accurate physics mode: falling body descends (column-locked), locked body anchors
- Collision causes both bodies to squish, then spring back to rest
- Iterative refinement based on user feedback (grid-locked → game-accurate)

## Task Commits

1. **Task 1+2: Grid-to-mesh generation** - `0754f2d` (feat)
2. **Iteration: Grid-locked mode** - `049588c` (feat)
3. **Iteration: Game-accurate physics** - `292836b` (feat)
4. **Tuning: Slow wave undulation 50%** - `048a481` (fix)

## Files Modified

- `components/SoftBodyDemo.tsx` - Added extractPerimeter, createBodyFromPerimeter, game-accurate physics

## Technical Details

### Perimeter Extraction Algorithm
1. For each cell, check 4 edges against neighbors
2. Perimeter edge = adjacent cell NOT in set
3. Order edges into continuous polygon (chain end→start)
4. Subdivide long edges (~18px spacing for smooth curves)

### Body Structure (Game-Accurate)
```typescript
interface Body {
  points: Point[];        // Perimeter + hub
  restOffsets: {x,y}[];   // RELATIVE to gridPos
  gridX, gridY: number;   // Current grid position
  isLocked: boolean;      // Locked vs falling
  fallSpeed: number;      // Current descent speed
}
```

### Physics Modes
- **Falling**: gridY increases via gravity, X fixed (column-locked)
- **Locked**: gridPos fixed, vertices jiggle from collision but spring to rest
- **Collision**: Both bodies squish, handled by checkBodyCollision()

### Wave Constants (Tuned)
- WAVE1_SPEED: 0.6375 (was 1.275)
- WAVE2_SPEED: 0.525 (was 1.05)

## Deviations from Plan

### Iterative Refinement Based on User Feedback

**1. Initial implementation had free physics (tumbling)**
- User feedback: Bodies should stay upright, not fall over
- Fix: Added grid-locked mode with anchor springs

**2. Grid-locked mode was too static**
- User feedback: Need falling body + locked body interaction like actual game
- Fix: Added game-accurate physics with isLocked state, column-locked falling

**3. Wave undulation too fast**
- User feedback: Slow wiggling by 50%
- Fix: Reduced WAVE1_SPEED and WAVE2_SPEED by 50%

All iterations were necessary refinements to match actual game mechanics.

## Issues Encountered

None - iterative refinement based on user testing feedback.

## Next Step

Ready for 26-03-PLAN.md (Renderer integration with main game)

---
*Phase: 26-core-sbg-system*
*Completed: 2026-01-28*

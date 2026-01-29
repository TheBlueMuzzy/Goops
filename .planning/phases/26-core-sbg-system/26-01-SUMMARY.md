---
phase: 26-core-sbg-system
plan: 01
subsystem: rendering
tags: [soft-body, physics, collision, demo]

requires:
  - phase: 25-research-prototype
    provides: soft body physics prototype with hub & spoke springs

provides:
  - Body-to-body collision detection
  - Proximity-based collision response
  - Stable soft body interaction

affects: [27-physics-response, 28-merge-transitions]

tech-stack:
  added: []
  patterns:
    - Proximity-based collision (vertex-to-edge distance)
    - Gentle position correction instead of force-based response

key-files:
  created: []
  modified:
    - components/SoftBodyDemo.tsx

key-decisions:
  - "Proximity collision over point-in-polygon: simpler, more stable"
  - "5px collision radius for close contact feel"
  - "30-35% position correction per frame prevents explosion"

patterns-established:
  - "Collision: check vertex distance to edges, push apart gently"
  - "Velocity dampening on approach prevents bounce"

issues-created: []

duration: 38min
completed: 2026-01-28
---

# Phase 26 Plan 01: Body-to-Body Collision Summary

**Proximity-based soft body collision with gentle push-apart response - bodies squish on contact without exploding**

## Performance

- **Duration:** 38 min
- **Started:** 2026-01-28T18:41:48Z
- **Completed:** 2026-01-28T19:19:54Z
- **Tasks:** 2 (+ 1 checkpoint)
- **Files modified:** 1

## Accomplishments

- Implemented body-to-body collision detection between soft bodies
- Bodies now land on each other instead of passing through
- Visible squish deformation at contact points
- Stable physics - no jitter or explosion

## Task Commits

1. **Task 1: Edge-based collision detection** - `87a16b5` (feat) — initial implementation (had issues)
2. **Task 2: Tune collision response** - `acfd16c` (feat) — tuning attempt
3. **Bug fix: Explosion/implosion** - `b3a2e97` (fix) — replaced with proximity-based approach
4. **Final tuning** - `285e34d` (feat) — tighter collision radius (8→5px)

## Files Created/Modified

- `components/SoftBodyDemo.tsx` - Added collision detection, updated to v12

## Technical Details

### Algorithm: Proximity-Based Collision

Instead of point-in-polygon (which caused force explosion), we use simple distance checks:

```typescript
// For each vertex of body B, check distance to each edge of body A
const { dist } = pointToSegment(vertex.x, vertex.y, edge1.x, edge1.y, edge2.x, edge2.y);
if (dist < COLLISION_RADIUS) {
  // Push apart gently along separation vector
}
```

### Key Parameters

| Constant | Value | Purpose |
|----------|-------|---------|
| COLLISION_RADIUS | 5px | How close before collision triggers |
| COLLISION_PUSH | 0.35 | Position correction factor (35% per frame) |

### Why Proximity Over Point-in-Polygon

The original point-in-polygon approach had issues:
1. Normal direction calculation was complex and error-prone
2. Force magnitudes were too high (600 stiffness × penetration depth)
3. Position correction fought with velocity-based forces
4. Result: bodies flew apart and imploded

Proximity approach is simpler:
1. Just measure distance - no complex geometry
2. Push direction is always "away from edge"
3. Gentle position correction only (no force accumulation)
4. Result: stable, soft contact

## Decisions Made

- **Proximity over point-in-polygon:** Simpler algorithm, more stable behavior
- **Position correction over forces:** Direct position adjustment prevents runaway energy
- **5px radius:** Close enough for satisfying squish, far enough for stability

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced explosion-causing collision algorithm**
- **Found during:** Checkpoint verification (user reported "fly off and implode")
- **Issue:** Point-in-polygon with force-based response caused runaway forces
- **Fix:** Complete rewrite using proximity-based detection with gentle push
- **Files modified:** components/SoftBodyDemo.tsx
- **Verification:** Bodies now land softly with visible squish
- **Committed in:** b3a2e97

---

**Total deviations:** 1 auto-fixed (algorithm replacement)
**Impact on plan:** Algorithm changed but outcome achieved - stable body-to-body collision

## Issues Encountered

Initial implementation caused bodies to explode apart. Root cause was overly strong collision forces combined with position correction. Fixed by switching to gentler proximity-based approach.

## Next Step

Ready for 26-02-PLAN.md (Grid-to-Mesh Generation)

---
*Phase: 26-core-sbg-system*
*Completed: 2026-01-28*

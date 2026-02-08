---
title: Project State
type: session
tags: [active, continuity, status]
updated: 2026-02-07
---

# Project State

## Current Position

Phase: 27.1 Physics-Controlled Active Piece
Plan: MASTER-PLAN complete (9/9 tasks) — ALL BUGS FIXED + getGhostY safety net
Status: Deploying — soft body rendering fixes + hole support + loose goop ease-in
Last activity: 2026-02-07 - Multiple rendering fixes, donut hole support, loose goop ease-in
Branch: `soft-body-experiment` (merging to master for deploy)

Progress: █████████░ ~92% (core physics working, holes supported, rendering polished)

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- `soft-body-experiment` — Soft Body Goop (SBG) integration (v1.5 milestone)

## Next Steps

### What was done THIS session:

1. **Tendril cylindrical wrapping fix** — Tendrils now use `cylindricalDistanceX()` so they don't stretch across the screen when vertex positions straddle the cylinder boundary
2. **Wall/blur color bleed fix** — Inner cutouts (`#1e293b`) moved outside goo filter group so dark fill can't contaminate the goo blur fringe
3. **Donut hole support** — New `traceAllLoops()` separates outer boundary from inner hole boundaries. Compound SVG paths + `fillRule="evenodd"` render holes correctly. Ring springs respect loop boundaries. Pieces like P_S_C now show hollow centers.
4. **Default stiffness** — Changed from 15 → 10
5. **Loose goop gravity ease-in** — Cubic ease-in (`t³`) over 0.6s so loose blobs drip/peel slowly before ripping away. No more instant collapse.

### Files modified (this session):

- `components/GameBoard.tsx` — fillRule="evenodd", cylindrical tendril fix, cutout layer separation
- `core/softBody/blobFactory.ts` — `traceAllLoops()`, multi-loop blob creation, loop-aware ring springs
- `core/softBody/physics.ts` — Loose goop gravity ease-in with cubic ramp
- `core/softBody/rendering.ts` — Compound SVG path generation for blobs with holes
- `core/softBody/types.ts` — `loopStarts`, `looseTime` fields, stiffness default
- `tests/softBody.test.ts` — Updated stiffness default

### Known Issues

- None currently

### Decisions Made

- Goo filter defaults: stdDeviation=5, alphaMul=40, alphaOff=-11 (user-tuned)
- Stiffness default = 10 (user-tuned, was 15)
- Donut holes use separate boundary loops + evenodd fill, not figure-8 paths
- Inner cutouts render OUTSIDE goo filter to prevent color bleed
- Loose goop uses cubic ease-in (t³) over 0.6s for drip/rip feel
- `homeStiffness` is the right param for anchoring against attraction pull (not returnSpeed/viscosity)
- Tendrils must be inside goo filter groups to get the smooth Proto 9 look

---

## Session Continuity

Last session: 2026-02-07
**Version:** 1.1.13
**Branch:** soft-body-experiment (deploying to master)
**Build:** 224

### Resume Command
```
DEPLOYED — Rendering fixes + hole support + loose goop ease-in live on GitHub Pages.

SESSION ACCOMPLISHMENTS:
- Tendril cylindrical wrapping fix (no more cross-screen stretching)
- Wall/blur color bleed fix (cutouts outside goo filter)
- Donut hole support (traceAllLoops + compound paths + evenodd)
- Stiffness default 15 → 10
- Loose goop cubic ease-in (0.6s ramp, t³ curve)
- 210 tests, all passing
- Deployed to production

REMAINING WORK:
- Further physics tuning if needed
- Falling blob tendril improvements

Next: User testing of deployed version
```

---

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<runtests>`, `<save>`, `<deploy>`, `<research>`, `<askme>`, `<flow>`

## Related

- [[HOME]] - Navigation hub
- [[PROJECT]] - Full project definition
- [[ROADMAP]] - All milestones

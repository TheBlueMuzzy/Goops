---
title: Project State
type: session
tags: [active, continuity, status]
updated: 2026-02-04
---

# Project State

## Current Position

Phase: 26.1 Flatten Coordinate System
Plan: FIX complete (4 commits)
Status: Proto-9 parity fixes done, some stiffness issues remain for Phase 27
Last activity: 2026-02-04 - Completed 26.1-FIX plan

Progress: ███████░░░ ~75%

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- `soft-body-experiment` — Soft Body Goop (SBG) integration (v1.5 milestone)

## Next Steps

**Completed:** 26.1-FIX plan (Proto-9 parity fixes)
**Branch:** `soft-body-experiment`

### 26.1-FIX Completed (2026-02-04)

| Fix | Commit | Description |
|-----|--------|-------------|
| Damping formula | 3ea119c | Use params.damping directly (not /viscosity) |
| Home force | 7a18181 | Direct distance (not cylindricalDistanceX) |
| Droplets on pop | 2d1a499 | Only spawn on actual pop, not merge |
| Audit fixes | 0b56b56 | Slider deps, stiffness formula, loose goop fall |

### What's Working
- SBG appears on lock with fill animation
- Fill pulse (ready-to-pop impulse)
- Same-color blob merging with attraction springs
- Position stays aligned when rotating
- Seam crossing via goo filter merge
- Blob collision - different colors push apart
- Droplet system - particles on pop only
- All debug sliders connected and working
- **Smooth loose goop fall animation**

### What's Still Open (26.1-ISSUES.md)
- UAT-001: Goop still feels too stiff (needs Phase 27 active piece SBG to test)
- UAT-002: Blob collision hard to observe (depends on stiffness)
- UAT-004: Sliders don't fully match Proto-9 (most work, stiffness issue remains)

### Key Insight: Active Piece SBG Needed

The remaining stiffness issues can't be fully tested until the active falling piece uses soft-body physics (Phase 27). Currently:
- Locked goop = SBG
- Falling piece = basic rendering

Without SBG on the falling piece, there's no impact force transmitted to locked goop on landing, making it hard to see the "jiggly" behavior.

---

## Session Continuity

Last session: 2026-02-04
**Version:** 1.1.13
**Branch:** soft-body-experiment
**Build:** 181

### Resume Command
```
26.1-FIX plan complete.

DONE:
- Damping: params.damping (not /viscosity)
- Home force: direct distance (not cylindrical)
- Droplets: only on pop (not merge)
- Sliders: all droplet params connected
- Attraction stiffness: formula fixed
- Loose goop: smooth fall animation

REMAINING ISSUES (for later phases):
- Stiffness feel - needs active piece SBG (Phase 27)
- Blob collision visibility - depends on stiffness

Next: /gsd:progress to see options
```

---

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<runtests>`, `<save>`, `<deploy>`, `<research>`, `<askme>`, `<flow>`

## Related

- [[HOME]] - Navigation hub
- [[PROJECT]] - Full project definition
- [[ROADMAP]] - All milestones

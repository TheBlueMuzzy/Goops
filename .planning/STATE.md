---
title: Project State
type: session
tags: [active, continuity, status]
updated: 2026-01-31
---

# Project State

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- `soft-body-experiment` — Soft Body Goop (SBG) visual overhaul (Proto-5c IN PROGRESS)

## Next Steps

**Current:** Proto-6 Fill/Pour
**Status:** IN PROGRESS — Core fill working, architecture needs rethink for seamless edges
**Branch:** `soft-body-experiment`
**Server:** `localhost:5203/GOOPS/?proto=6`

### Proto-6 Fill/Pour — IN PROGRESS

**The Goal:**
- Fill rises from bottom inside the cell wall "container"
- Fill color matches outer goop exactly
- When 100% filled, looks like solid goop (no visible seam)
- Shake animation when clicking before 100%
- Boop scale pulse when fill reaches 100%

**What Works:**
- Fill amount (0-1) per blob, auto-fills over time
- Fill rendered as rising rect clipped to inner shape
- Shake animation on early click (CSS keyframes)
- Boop scale animation at 100% (scale from center)
- Reset button to empty all containers

**The Problem (UNSOLVED):**
There's a visible seam/gap between the fill and the outer goop edge.

**Root Cause Analysis:**
1. Outer goop goes through goo filter → creates curved/blobby edges
2. Inner cutout is a clean path (NOT filtered) → sharp edges
3. Fill clips to the clean inner path → matches cutout, not the goo-filtered edge
4. The goo filter curves the outer edge INWARD in places
5. The clean inner cutout doesn't follow those curves
6. Result: visible gap between goo-filtered outer edge and clean inner edge

**What We Tried (and why it failed):**
1. **Extend fill outward (negative inset)** → Fill escaped outside the goop boundary
2. **Clip fill to outer blob path** → Raw path doesn't match goo-filtered visual
3. **Put fill inside goo filter group** → Fill merged with outer, then cutout cut through both, fill invisible
4. **Put fill UNDER outer goop** → Outer goop covered fill completely, cutout revealed nothing

**Proposed Architecture Solutions:**

**Option A: Goop as RING (recommended)**
```
LAYER 1: Fill (underneath or on top)
LAYER 2: Goop RING (outer - inner path, filtered) → BOTH edges are gooey
```
- Render outer goop as a ring (outer path + inner path reversed, fill-rule="evenodd")
- Apply goo filter to the ring
- Both inner AND outer edges get the same gooey treatment
- Fill renders on top, visible through the ring's center
- When 100% full, fill meets the goo-filtered inner edge seamlessly

**Option B: Filter both layers together**
```
LAYER 1 (filtered group): Outer goop + Fill together
LAYER 2: Inner cutout (bgColor, NOT filtered)
```
- Put fill inside the filter group WITH outer goop
- They merge through the filter (same color = same blob)
- Inner cutout still cuts the hole
- Issue: Need fill to not fully merge with outer

**Key Insight:**
The fundamental mismatch is: goo filter applied to outer shape only, not to inner cutout. Whatever solution we choose must either:
- Apply filter to BOTH edges (ring approach)
- Or make fill part of the filtered content

**Key Files:**
- `prototypes/SoftBodyProto6.tsx` — Main prototype file (current working state)
- `prototypes/SoftBodyProto5c.tsx` — Base prototype (cell wall without fill)

**Current Render Order (working but has seam):**
1. LAYER 1: Outer goop (solid, filtered)
2. LAYER 2: Inner cutout (bgColor, clean path)
3. LAYER 3: Fill (clipped to same path as cutout)

### Proto-5c Cell Wall Experiment — SOLVED

**The Goal:**
Render goop with a "cell wall" effect:
- **Outer edge** = gooey silhouette that stretches and merges (like Proto-5b)
- **Inner edge** = stable boundary that barely moves
- **Cell wall** = the visible filled ring BETWEEN outer and inner
- **Interior** = empty space for future "time to pop" fill

**The Approach:**
1. Layer 1: Render outer gooey shape with goo filter (filled, like 5b)
2. Layer 2: Render inner shape on top with background color (cuts out the middle)
3. Result: visible cell wall ring

**The Problem (SOLVED):**
Corrupt shape inner cutouts weren't wobbling like T/U shapes because they had separate physics vertices instead of deriving from the outer vertices.

**The Fix:**
Added `outerVertexIndices` to `InnerRegion` interface. Each inner region corner maps to a specific outer vertex. At render time, inner positions are derived directly from outer vertex positions (not simulated separately).

Mappings for Corrupt shape:
- Top-left square → outer vertices [0, 1, 2, 19]
- Top-right square → outer vertices [12, 13, 14, 11]
- Stem rectangle → outer vertices [5, 8, 7, 6]

**Key Code:**
```typescript
interface InnerRegion {
  outerVertexIndices?: number[];  // Maps corners to outer vertices (for wobble)
  // ... other fields
}

// Rendering: use outer vertex positions when available
if (region.outerVertexIndices) {
  worldPoints = region.outerVertexIndices.map(idx => blob.vertices[idx].pos);
} else {
  worldPoints = region.vertices.map(v => v.pos);  // fallback
}
```

**Key Files:**
- `prototypes/SoftBodyProto5c.tsx` — Main prototype file

### Proto-5c Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| Filter | Medium preset | Blur 8, Alpha 20/-12 |
| Wall Thickness | 8px | Inset amount for inner cutout |
| Inner Home Stiffness | 0.5 | Very stiff (for stable inner) |
| Goopiness | 25px | Break distance for tendrils |
| Tendril End Radius | 10px | Bead size at string ends |
| Tendril Skinniness | 0.7 | Middle thins when stretched |

### Proto Access URLs

| Proto | URL | Status |
|-------|-----|--------|
| 5b | `?proto=5b` | COMPLETE — Gold standard goo filter |
| 5c | `?proto=5c` | COMPLETE — Cell wall rendering |
| 6 | `?proto=6` | IN PROGRESS — Fill/Pour mechanics |

---

## Previous Proto Results (Complete)

### Proto-5b: Gold Standard ✅

Single perimeter shapes with gooey SVG filter:
- T, U, and Corrupted T shapes
- Attraction springs with mozzarella pull
- Beads-on-string tendrils
- Corrupted shapes work with pressure disabled

**Gold Standard Settings:**
| Parameter | Value |
|-----------|-------|
| Blur | 8 |
| Alpha Mult | 20 |
| Alpha Offset | -12 |
| Goopiness | 25px |
| Attraction Radius | 20px |
| Attraction Strength | 0.005 |

### Proto 1-4: Complete ✅

See full details in sections below.

---

## Remaining Prototypes

### Proto-6: Fill/Pour
How does goop visually "fill" into a piece shape?

### Proto-7: Pop
What happens visually when goop is cleared?

### Proto-8: Loose Goop
How does freed goop behave when disconnected?

---

## Session Continuity

Last session: 2026-01-31
**Version:** 1.1.13
**Branch:** soft-body-experiment
**Build:** 109

### Resume Command
```
Proto-6 Fill/Pour IN PROGRESS. Branch: soft-body-experiment
Server: localhost:5203/GOOPS/?proto=6

CURRENT STATE: Basic fill mechanics work (rising fill, shake, boop).
PROBLEM: Visible seam between fill and outer goop edge.
CAUSE: Goo filter applied to outer shape only. Inner cutout/fill are clean paths
       that don't match the goo-filtered curved edges.

NEXT: Implement "goop as ring" architecture:
1. Render outer goop as RING (outer - inner path, fill-rule="evenodd")
2. Apply goo filter to ring (BOTH edges become gooey)
3. Fill renders on top, visible through center
4. No seam because fill meets goo-filtered inner edge

See STATE.md "Proto-6 Fill/Pour" section for full analysis of what failed and why.
File: prototypes/SoftBodyProto6.tsx
```

---

## Proto 1-4 Results (Reference)

### Proto-1: Single Blob Physics ✅
- Verlet + springs + pressure + Catmull-Rom
- Damping 0.975, Gravity 30, Stiffness 20, Pressure 2.5

### Proto-2: Blob Follows Cursor ✅
- Two-layer architecture (data drives render)
- Home Stiffness 0.03 for laggy/stretchy follow

### Proto-3: Rotation Stress Test ✅
- Rapid 90° rotations stable
- Home Stiffness 0.18 for snappy recovery

### Proto-4: Two Blobs Attraction ✅
- Per-vertex attraction radii (outer=1.5x, inner=0.3x)
- Variable stiffness ramp (10% → 100%)
- Break distance 60 for stickiness

---

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<runtests>`, `<save>`, `<deploy>`, `<research>`, `<askme>`, `<flow>`

## Related

- [[HOME]] - Navigation hub
- [[PROJECT]] - Full project definition
- [[ROADMAP]] - All milestones

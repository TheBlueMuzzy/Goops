# Soft Body Cylindrical Projection Issue

## The Problem

The game uses a **cylindrical projection** for the tank view:
- 40 total columns, 14 visible at once
- `visXToScreenX(visX)` = `CYL_RADIUS * sin((visX - 7) * ANGLE_PER_COL)`
- Columns are **wider at center, narrower at edges**

Soft body physics operates in a **fixed coordinate space**. When we create a body shape and try to move it via transform, the shape doesn't match the projection at different positions.

## What We Tried

1. **Simple transform** - Body baked at one position, translated as tank rotates
   - FAILED: Shape doesn't match projection at new position

2. **Per-vertex projection** - Store body in grid coords, project each vertex at render
   - PARTIALLY WORKING: Projection is correct, but something still wrong

3. **Grid coords + physics deformation** - Separate rest shape from physics
   - Current approach, still has issues

## The Correct Architecture

```
Body stores:
- perimeterGridCoords[] : original perimeter in GRID units (gx, gy relative to anchor)
- points[]              : physics simulation in PIXEL space
- anchorGridX, anchorRow: position in stable grid coordinates

Rendering (per vertex):
1. Get grid coord: perimeterGridCoords[i]
2. Calculate absolute grid position: anchorGridX + gx
3. Convert to visX: absoluteGridX - tankRotation (with wrapping)
4. Project to screenX: visXToScreenX(visX)
5. Calculate physics deformation: points[i] - (gx * BLOCK_SIZE, gy * BLOCK_SIZE)
6. Add deformation to projected position (scaled by local projection factor)
```

## Key Files

- `components/GameBoard.tsx` - Body creation (~line 118-260) and rendering (~line 555-620)
- `rendering/SoftBodyRenderer.ts` - Body type, physics simulation
- `utils/coordinateTransform.ts` - `visXToScreenX()` projection function

## What Might Still Be Wrong

1. The deformation scaling factor might be incorrect
2. The grid coordinate calculation might have off-by-one or wrapping issues
3. Physics restOffsets vs perimeterGridCoords might be misaligned
4. The Bezier curve generation might be distorting things

## Debug Approach

1. Add visual debugging - render dots at projected grid positions (without deformation)
2. Verify grid coords match actual cell positions
3. Check if deformation is being calculated correctly
4. Compare with normal goop cell positions

## Alternative Approach

Instead of trying to make physics work across projection, consider:
- Only show soft bodies when near center of viewport (visX 4-10)
- Recreate bodies when they enter/leave this zone
- Simpler, more reliable, physics stays consistent

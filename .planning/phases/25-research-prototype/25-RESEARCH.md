# Phase 25: Research & Prototype - Research

**Researched:** 2026-01-28
**Domain:** Soft body / metaball rendering for 2D web games
**Confidence:** HIGH

<research_summary>
## Summary

Researched rendering techniques for soft body "goop" visuals in a React/TypeScript mobile-optimized 2D puzzle game. The goal is to replace grid-cell rendering with jelly-like blobs that merge organically.

**Key findings:**
1. **Metaballs** are the standard technique for blob/goop visuals - mathematical isosurfaces where blob influences sum and threshold to create organic merging shapes
2. **Three viable approaches** with different complexity/performance tradeoffs: SVG filters (simplest), Canvas + Marching Squares (mid), WebGL shaders (best performance)
3. **Visual-only is sufficient** - full physics simulation is NOT needed since goop doesn't collide or interact physically; CSS/JS spring wobble is enough for jelly feel
4. **Mobile performance** is achievable at 40fps with 20-40 blobs using WebGL, fewer with Canvas/SVG

**Primary recommendation:** Start with SVG gooey filter for proof-of-concept (1 day), then evaluate if WebGL is needed for mobile performance. The SVG filter approach handles merging automatically with minimal code.
</research_summary>

<standard_stack>
## Standard Stack

### Core Rendering Options

| Approach | Technology | Complexity | Performance | Best For |
|----------|------------|------------|-------------|----------|
| SVG Gooey Filter | SVG + feGaussianBlur + feColorMatrix | Low | Medium | PoC, <20 blobs |
| Canvas + Marching Squares | Canvas 2D + MarchingSquaresJS | Medium | Medium | Custom shapes |
| WebGL Fragment Shader | WebGL2 + custom shaders | High | Excellent | 40+ blobs, mobile |
| WebGL + Pixi.js | Pixi.js with custom filters | Medium-High | Excellent | React integration |

### Recommended Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None (SVG filter) | N/A | Built-in gooey effect | Simplest PoC |
| marching-squares | 1.3.3 | Contour generation from scalar field | Canvas approach |
| MarchingSquaresJS | Latest | Alternative with benchmarks | Canvas approach |
| metaballs-js | 2.1.2 | Ready-made WebGL metaballs | Quick WebGL test |
| Pixi.js | 8.x | 2D WebGL renderer with React | Production WebGL |
| TWGL | 5.x | Reduces WebGL boilerplate 50% | Custom WebGL shaders |

### Supporting Libraries (Visual Effects)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Animate.css | 4.1.1 | Wobble/jello CSS animations | Piece landing squish |
| GSAP | 3.x | Path morphing, spring physics | Complex animations |
| svg.js | 3.x | SVG manipulation | Path generation |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SVG filter | Canvas filter | Canvas filter has same blur-threshold pattern |
| Marching Squares | Dual Contouring | Dual contouring handles sharp features but overkill here |
| Pixi.js | Three.js/R3F | Three.js is 3D-focused, heavier for pure 2D work |
| metaballs-js | Custom shaders | metaballs-js may hit mobile uniform limits |

**Installation (if going WebGL route):**
```bash
npm install pixi.js @pixi/react
# or for lower-level control:
npm install twgl.js
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Pattern 1: Visual Layer Separation (CRITICAL)

**What:** Soft body rendering is a VISUAL LAYER only. Grid logic remains authoritative.

**Why:** Game state (which cells have goop, merging groups, colors) stays in existing `GameEngine.ts`. The soft body renderer reads this state and draws it with visual effects.

**Structure:**
```
GameEngine (authoritative)          SoftBodyRenderer (visual only)
┌─────────────────────────────┐    ┌─────────────────────────────┐
│ tankGrid: TankCell[][]      │───>│ Read cell positions         │
│ goopGroups: Map<id, cells>  │───>│ Generate blob geometry      │
│ activeGoop: GoopState       │───>│ Apply wobble/squish effects │
└─────────────────────────────┘    └─────────────────────────────┘
         │                                     │
         │ (state changes)                     │ (re-render)
         v                                     v
    Game events ──────────────────────> Visual updates
```

**Example interface:**
```typescript
interface SoftBodyRenderer {
  // Called when goop state changes
  updateFromGrid(grid: TankCell[][], groups: Map<string, GoopGroup>): void;

  // Called each frame for animations
  animate(deltaTime: number): void;

  // Render to target (SVG element, Canvas, or WebGL canvas)
  render(): void;
}
```

### Pattern 2: SVG Gooey Filter (Simplest Approach)

**What:** Use SVG filter to automatically merge overlapping shapes

**When to use:** Proof of concept, performance testing, small blob counts

**Implementation:**
```tsx
// SVG filter definition (add once to document)
<svg style={{ position: 'absolute', width: 0, height: 0 }}>
  <defs>
    <filter id="gooey">
      <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
      <feColorMatrix in="blur" mode="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 18 -7" />
    </filter>
  </defs>
</svg>

// Apply filter to blob container
<g filter="url(#gooey)">
  {goopCells.map(cell => (
    <circle
      key={`${cell.x}-${cell.y}`}
      cx={cell.x * cellSize + cellSize/2}
      cy={cell.y * cellSize + cellSize/2}
      r={cellSize * 0.6}
      fill={cell.color}
    />
  ))}
</g>
```

**Key insight:** The filter handles merging automatically - overlapping circles blend into organic shapes.

### Pattern 3: Marching Squares (Canvas Approach)

**What:** Generate contour lines from a scalar field representing blob influence

**When to use:** Need custom merge shapes, Canvas-based rendering, moderate blob counts

**Structure:**
```typescript
// 1. Create scalar field (influence values at grid points)
function computeScalarField(blobs: Blob[], gridWidth: number, gridHeight: number): number[][] {
  const field: number[][] = [];
  for (let y = 0; y < gridHeight; y++) {
    field[y] = [];
    for (let x = 0; x < gridWidth; x++) {
      let sum = 0;
      for (const blob of blobs) {
        const dx = x - blob.x;
        const dy = y - blob.y;
        sum += blob.radius * blob.radius / (dx * dx + dy * dy + 0.0001);
      }
      field[y][x] = sum;
    }
  }
  return field;
}

// 2. Extract contours at threshold
import { isoLines } from 'marching-squares';
const threshold = 1.0;
const contours = isoLines(field, threshold);

// 3. Render contours to canvas
ctx.beginPath();
for (const contour of contours) {
  ctx.moveTo(contour[0].x, contour[0].y);
  for (const point of contour.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
}
ctx.fill();
```

### Pattern 4: WebGL Two-Pass Metaballs (Best Performance)

**What:** Render blob gradients to framebuffer, then threshold in post-process

**When to use:** Mobile performance critical, 40+ blobs, need precise control

**Structure:**
```
Pass 1: Density Field                Pass 2: Threshold
┌───────────────────────┐           ┌───────────────────────┐
│ For each blob:        │           │ Sample framebuffer    │
│ - Draw radial gradient│   ───>    │ - If alpha > 0.5:     │
│ - Additive blending   │           │   draw colored pixel  │
│ - Result: density map │           │ - Else: discard       │
└───────────────────────┘           └───────────────────────┘
```

**Fragment shader (Pass 1 - density):**
```glsl
precision mediump float;
varying vec2 v_uv;

void main() {
  float dist = distance(v_uv, vec2(0.5)) * 2.0;
  float c = clamp(1.0 - dist, 0.0, 1.0);
  gl_FragColor = vec4(1.0, 1.0, 1.0, c);
}
```

**Fragment shader (Pass 2 - threshold):**
```glsl
precision mediump float;
uniform sampler2D u_densityTexture;
varying vec2 v_uv;

void main() {
  float density = texture2D(u_densityTexture, v_uv).a;
  if (density < 0.5) discard;

  vec3 baseColor = vec3(0.8, 0.2, 0.2); // Red goop
  gl_FragColor = vec4(baseColor, 1.0);
}
```

### Anti-Patterns to Avoid

- **Don't mix physics and rendering:** Keep game logic in GameEngine, visuals in renderer
- **Don't compute scalar field every pixel:** Use grid with appropriate resolution (5-10px cells)
- **Don't use full physics engine for visuals:** Matter.js/Box2D overkill if just want wobble
- **Don't render individual cells:** Group connected goop into single merged shapes
- **Don't use highp precision on mobile:** Use mediump in fragment shaders
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Blob merging effect | Custom overlap detection | SVG gooey filter OR marching squares library | Edge cases, performance, already solved |
| Marching squares algorithm | Your own implementation | marching-squares npm OR MarchingSquaresJS | Bit masking, interpolation, edge cases |
| WebGL boilerplate | Raw gl.* calls everywhere | TWGL or Pixi.js | 50% less code, handles state management |
| Wobble physics | Full spring-mass simulation | CSS animation OR simple JS damped spring | Visual-only doesn't need real physics |
| Bezier path generation | Manual control point math | SVG path library OR built-in ctx.bezierCurveTo | Tangent calculations are error-prone |
| Frame buffer management | Manual texture/FBO creation | Pixi.js RenderTexture OR TWGL helpers | Easy to leak memory, hard to debug |

**Key insight:** The goop doesn't need to actually behave physically - it just needs to LOOK like it does. A simple damped spring for wobble plus SVG filters for merging achieves 90% of the visual effect with 10% of the complexity.

**Wobble without physics:**
```typescript
// Simple damped spring for visual wobble (no physics library needed)
class DampedSpring {
  value = 0;
  velocity = 0;
  target = 0;
  stiffness = 180;  // How snappy
  damping = 12;     // How quickly it settles

  update(dt: number) {
    const force = -this.stiffness * (this.value - this.target);
    const damping = -this.damping * this.velocity;
    this.velocity += (force + damping) * dt;
    this.value += this.velocity * dt;
  }
}

// Usage: scale.target = 1.2 on impact, animate back to 1.0
```
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Mobile Uniform Limits
**What goes wrong:** WebGL shader crashes with "too many uniforms" on mobile
**Why it happens:** Passing blob positions as uniform array; mobile GPUs have strict limits
**How to avoid:** Use instanced rendering OR texture-based position data OR limit blob count to 20-30
**Warning signs:** Works on desktop, crashes on iPhone/Android

### Pitfall 2: SVG Filter Performance
**What goes wrong:** SVG gooey filter causes 10fps on mobile
**Why it happens:** Gaussian blur is expensive; applied to entire container every frame
**How to avoid:** Limit blur radius (10px not 20px), reduce filter area, or switch to WebGL
**Warning signs:** Mobile frame rate drops when goop is on screen

### Pitfall 3: Grid Resolution Mismatch
**What goes wrong:** Marching squares output looks blocky or has weird artifacts
**Why it happens:** Grid too coarse, or grid doesn't align with blob positions
**How to avoid:** Use 5-10px grid cells; ensure blob coordinates match grid scale
**Warning signs:** Jagged edges, "staircase" contours, blobs not touching when they should

### Pitfall 4: Fragment Shader Precision
**What goes wrong:** Visual artifacts or NaN colors on mobile
**Why it happens:** Mobile GPUs don't support highp float in fragment shaders
**How to avoid:** Use `precision mediump float;` in all fragment shaders
**Warning signs:** Works on desktop, glitchy/black on mobile

### Pitfall 5: Forgetting Retina/DPR
**What goes wrong:** Blurry rendering on high-DPI screens, or massive performance drop
**Why it happens:** Canvas/WebGL at 1x resolution on 3x device, OR rendering at 3x when not needed
**How to avoid:** Detect DPR, cap at 2x for mobile: `Math.min(window.devicePixelRatio, 2)`
**Warning signs:** Blurry on iPhone, or 1/9th expected framerate

### Pitfall 6: Re-computing Every Frame
**What goes wrong:** CPU usage spikes, frame drops
**Why it happens:** Rebuilding scalar field or blob geometry every frame even when nothing changed
**How to avoid:** Cache results; only recompute when goop state actually changes
**Warning signs:** High CPU usage even when game is "idle"
</common_pitfalls>

<code_examples>
## Code Examples

### SVG Gooey Filter (Simplest - Start Here)

```tsx
// Source: CSS-Tricks "The Gooey Effect" + Codrops tutorials
// Add this SVG once to your app (can be in index.html or component)

function GooeyFilter() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <filter id="gooey">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 18 -7"
          />
        </filter>
      </defs>
    </svg>
  );
}

// Usage in your goop renderer:
function GoopLayer({ cells }: { cells: TankCell[] }) {
  return (
    <g filter="url(#gooey)">
      {cells.filter(c => c.color).map(cell => (
        <circle
          key={`${cell.x}-${cell.y}`}
          cx={cell.x * CELL_SIZE + CELL_SIZE/2}
          cy={cell.y * CELL_SIZE + CELL_SIZE/2}
          r={CELL_SIZE * 0.55}  // Slightly smaller than cell to allow merge room
          fill={cell.color}
        />
      ))}
    </g>
  );
}
```

### Simple Wobble Animation (CSS)

```css
/* Source: Animate.css patterns */
@keyframes goop-land {
  0% { transform: scale(1, 1); }
  30% { transform: scale(1.1, 0.9); }
  50% { transform: scale(0.95, 1.05); }
  70% { transform: scale(1.02, 0.98); }
  100% { transform: scale(1, 1); }
}

.goop-landed {
  animation: goop-land 0.4s ease-out;
}
```

### Simple Wobble Animation (JavaScript)

```typescript
// Source: Standard damped spring equation
class WobbleEffect {
  scaleX = 1;
  scaleY = 1;
  velocityX = 0;
  velocityY = 0;

  private stiffness = 300;
  private damping = 15;

  // Call when piece lands
  impact(impactStrength = 0.3) {
    this.velocityY = -impactStrength;  // Squish down
    this.velocityX = impactStrength * 0.5;  // Expand out
  }

  // Call every frame
  update(dt: number) {
    // Spring force toward 1.0
    const forceX = -this.stiffness * (this.scaleX - 1);
    const forceY = -this.stiffness * (this.scaleY - 1);

    // Damping
    const dampX = -this.damping * this.velocityX;
    const dampY = -this.damping * this.velocityY;

    this.velocityX += (forceX + dampX) * dt;
    this.velocityY += (forceY + dampY) * dt;

    this.scaleX += this.velocityX * dt;
    this.scaleY += this.velocityY * dt;
  }

  getTransform(): string {
    return `scale(${this.scaleX}, ${this.scaleY})`;
  }
}
```

### Marching Squares with marching-squares npm

```typescript
// Source: marching-squares npm documentation
import { isoLines } from 'marching-squares';

interface Blob { x: number; y: number; radius: number; color: string; }

function renderGoopToCanvas(
  ctx: CanvasRenderingContext2D,
  blobs: Blob[],
  width: number,
  height: number
) {
  const GRID_SIZE = 8;  // 8px cells for smooth curves
  const gridW = Math.ceil(width / GRID_SIZE) + 1;
  const gridH = Math.ceil(height / GRID_SIZE) + 1;

  // Build scalar field
  const field: number[][] = [];
  for (let gy = 0; gy < gridH; gy++) {
    field[gy] = [];
    for (let gx = 0; gx < gridW; gx++) {
      const px = gx * GRID_SIZE;
      const py = gy * GRID_SIZE;
      let sum = 0;
      for (const blob of blobs) {
        const dx = px - blob.x;
        const dy = py - blob.y;
        const distSq = dx * dx + dy * dy + 0.0001;
        sum += (blob.radius * blob.radius) / distSq;
      }
      field[gy][gx] = sum;
    }
  }

  // Extract contour at threshold 1.0
  const contours = isoLines(field, 1.0);

  // Render
  ctx.fillStyle = blobs[0]?.color || 'red';
  ctx.beginPath();
  for (const contour of contours) {
    if (contour.length < 3) continue;
    ctx.moveTo(contour[0][0] * GRID_SIZE, contour[0][1] * GRID_SIZE);
    for (let i = 1; i < contour.length; i++) {
      ctx.lineTo(contour[i][0] * GRID_SIZE, contour[i][1] * GRID_SIZE);
    }
    ctx.closePath();
  }
  ctx.fill();
}
```

### Mobile Performance Check

```typescript
// Source: Best practices from WebGL mobile optimization guides

function getOptimalRenderer(): 'svg' | 'canvas' | 'webgl' {
  // Check WebGL2 support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');

  if (!gl) {
    console.log('WebGL2 not supported, falling back to Canvas');
    return 'canvas';
  }

  // Check uniform limit (mobile bottleneck)
  const maxUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
  if (maxUniforms < 256) {
    console.log('Low uniform limit, using Canvas for safety');
    return 'canvas';
  }

  // Check if mobile (conservative approach)
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  if (isMobile) {
    // Mobile can use WebGL but with reduced blob count
    console.log('Mobile detected, using WebGL with reduced complexity');
    return 'webgl';
  }

  return 'webgl';
}
```
</code_examples>

<sota_updates>
## State of the Art (2024-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Canvas 2D marching squares | WebGL2 two-pass shaders | 2021-2023 | 10x+ performance for many blobs |
| Uniform arrays for blob positions | Instanced rendering or texture data | 2020+ | Removes mobile uniform limits |
| CSS blur filter | SVG feGaussianBlur | Always | SVG blur supports transparency, content |
| Three.js for 2D | Pixi.js v8 | 2024 | Pixi.js faster for pure 2D, smaller bundle |
| Matter.js for all physics | CSS/JS springs for visual-only | Always | Don't need physics engine for visuals |

**New tools/patterns to consider:**
- **Pixi.js v8** (2024): Rewritten renderer, better performance, cleaner API
- **WebGPU**: Coming but not production-ready yet (2025+); stick with WebGL2
- **OffscreenCanvas**: Run rendering in Web Worker, but complex setup

**Deprecated/outdated:**
- **WebGL1**: Use WebGL2 for instancing support
- **Canvas globalCompositeOperation "lighter"**: SVG filters give more control
- **Full physics engines for visual effects**: Overkill; simple springs suffice
</sota_updates>

<open_questions>
## Open Questions

1. **Color handling in merged blobs**
   - What we know: Single-color blobs merge cleanly with SVG filter or marching squares
   - What's unclear: How to handle multi-color goop groups (different colored cells in same group)?
   - Recommendation: Start with single-color prototype; research color interpolation in Phase 26

2. **Active goop (falling piece) rendering**
   - What we know: Locked goop stays in place; active goop moves every frame
   - What's unclear: Should active piece have same soft body treatment or stay as current cells?
   - Recommendation: Prototype both; may be simpler to keep active piece as cells until it locks

3. **Performance threshold**
   - What we know: SVG filter can be slow on mobile; WebGL is faster but more complex
   - What's unclear: Exactly how many blobs before SVG filter becomes too slow on target devices?
   - Recommendation: Build SVG prototype, test on actual iPhone; measure threshold
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [Drawing 2D Metaballs with WebGL2 | Codrops](https://tympanus.net/codrops/2021/01/19/drawing-2d-metaballs-with-webgl2/) - Two-pass technique, code examples
- [The Gooey Effect | CSS-Tricks](https://css-tricks.com/gooey-effect/) - SVG filter approach
- [Metaballs | Varun Vachhar](https://varun.ca/metaballs/) - SVG path-based approach, geometric method
- [Metaballs and Marching Squares | Jamie Wong](https://jamie-wong.com/2014/08/19/metaballs-and-marching-squares/) - Algorithm explanation
- [marching-squares npm](https://www.npmjs.com/package/marching-squares) - Library documentation
- [MDN WebGL Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) - Mobile optimization

### Secondary (MEDIUM confidence)
- [Creative Gooey Effects | Codrops](https://tympanus.net/codrops/2015/03/10/creative-gooey-effects/) - Verified with CSS-Tricks
- [WebGL vs Canvas Performance](https://digitaladblog.com/2025/05/21/comparing-canvas-vs-webgl-for-javascript-chart-performance/) - Performance numbers
- [Building 60FPS WebGL on Mobile | Airtight](https://www.airtightinteractive.com/2015/01/building-a-60fps-webgl-game-on-mobile/) - Mobile optimization verified
- [Pixi.js Performance](https://pixijs.com/) - Official site benchmarks

### Tertiary (LOW confidence - needs validation)
- metaballs-js npm - Claims good mobile support but notes uniform limit issues; test needed
- Matter.js soft bodies - May be useful for Phase 27 physics if visual-only isn't enough
</sources>

<hard_problems>
## Hard Problems (Identified During Prototyping)

After building v10 prototype with working soft body physics, these are the challenging integration problems:

### 1. SpinTank (Tank Cylinder Rotation)
**Challenge:** Tank spins left/right, all locked goops must rotate with it while maintaining soft body physics.
**Considerations:**
- Do we rotate the entire coordinate system and let physics settle?
- Or do we manually rotate all vertices around tank center?
- Spring rest lengths stay same, but relative positions change
- Need to coordinate with existing tank rotation animation timing

### 2. RotateGoop (Active Piece Rotation)
**Challenge:** Player taps to rotate the active goop 90° clockwise - soft body needs to visually rotate.
**Considerations:**
- Current game rotates cell positions in the grid
- Soft body needs to rotate all vertices 90° around piece centroid
- Springs and hub stay connected, just rotated
- Should feel snappy (not slow physics-based rotation)
- May need to "snap" to new orientation then let physics settle with wobble

### 3. Merging Them
**Challenge:** When two goop pieces connect, they become one unified soft body.
**Considerations:**
- Current prototype has 2 separate bodies with independent springs
- Merge = combine perimeter points, remove internal points at join
- Need to create new springs across the merge boundary
- Hub point(s) - keep both? Create new centroid?
- Merge animation: smooth transition from 2 bodies → 1

### 4. Popping Them
**Challenge:** When a goop group is popped, need satisfying dissolution animation.
**Considerations:**
- Pressure goes to zero instantly? Or rapid deflation?
- Vertices scatter outward? Or inward collapse then burst?
- Individual cells could become mini soft bodies briefly
- Color particles / splash effect overlay

### 5. LooseGoops Application
**Challenge:** When cells become loose (especially corrupted pieces splitting), each loose cell needs physics.
**Considerations:**
- Corrupted pieces are corner-connected, split on lock
- Each loose cell becomes its own mini soft body
- Many small soft bodies = performance concern
- Could simplify to rigid circles with bounce instead of full soft body
- Need to handle: spawn, fall, land, merge into existing goop below

### 6. Body-to-Body Collision
**Challenge:** Body-to-body collision (blue squishes against red, not just ground).
**Considerations:**
- Current prototype only has ground collision
- Need to detect perimeter-to-perimeter penetration
- Push penetrating vertices out along collision normal
- Both bodies should deform (not just one)
- Performance: O(n*m) vertex checks per frame

### Prototype Learnings (v10)

**What worked:**
- Hub & spoke spring structure maintains T-shape well
- Pressure-based volume preservation keeps shape from collapsing
- Dual opposing sinusoidal waves create organic movement
- Skip-2 and skip-4 cross springs prevent sag

**Physics constants that feel good:**
```typescript
GRAVITY = 600
SPRING_K = 500        // Stiffness
SPRING_DAMP = 18      // Damping
PRESSURE_K = 15000    // Volume preservation
GLOBAL_DAMP = 0.995
BOUNCE = 0.3
FRICTION = 0.85
```

**Wave constants that feel gloopy:**
```typescript
WAVE_AMPLITUDE = 2.25
WAVE1_SPEED = 1.275   // Slower wave, clockwise
WAVE2_SPEED = 1.05    // Even slower, counter-clockwise
```
</hard_problems>

<metadata>
## Metadata

**Research scope:**
- Core technology: Metaball/soft body rendering (SVG, Canvas, WebGL)
- Ecosystem: marching-squares, Pixi.js, TWGL, SVG filters
- Patterns: Visual layer separation, two-pass rendering, gooey filter
- Pitfalls: Mobile uniforms, filter performance, precision, DPR

**Confidence breakdown:**
- Standard stack: HIGH - multiple tutorials, verified npm packages
- Architecture: HIGH - clear separation pattern from game dev best practices
- Pitfalls: HIGH - documented in multiple sources, real-world mobile issues
- Code examples: HIGH - from Codrops tutorials, CSS-Tricks, npm docs

**Research date:** 2026-01-28
**Valid until:** 2026-02-28 (30 days - stable ecosystem)
</metadata>

---

*Phase: 25-research-prototype*
*Research completed: 2026-01-28*
*Ready for planning: yes*

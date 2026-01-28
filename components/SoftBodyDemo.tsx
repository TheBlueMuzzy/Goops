/**
 * Soft Body Demo v10 - Wavy Edges
 *
 * Improvements:
 * - Hub & spoke structure
 * - Extra cross springs for rigidity
 * - Subtle sinusoidal edge waves (async per vertex)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Constants ---
const CELL_SIZE = 50;
const GRID_W = 7;
const GRID_H = 10;
const PANEL_W = GRID_W * CELL_SIZE;
const PANEL_H = GRID_H * CELL_SIZE;

// Physics tuning
const GRAVITY = 600;
const SPRING_K = 500;        // Spring stiffness (increased)
const SPRING_DAMP = 18;      // Spring damping
const PRESSURE_K = 15000;    // Pressure strength (increased)
const GLOBAL_DAMP = 0.995;
const BOUNCE = 0.3;
const FRICTION = 0.85;

// Body-to-body collision tuning
const COLLISION_STIFFNESS = 800;   // How hard bodies push apart
const COLLISION_DAMPING = 15;      // Damping on collision response

// Wave effect - dual waves for gloopy undulation
const WAVE_AMPLITUDE = 2.25;   // Pixels of displacement
const WAVE1_SPEED = 1.275;     // Primary wave - cycles per second (reduced 25%)
const WAVE2_SPEED = 1.05;      // Secondary wave - slower, creates undulation
const WAVE1_PHASE_OFFSET = 0.7;   // Positive = travels one direction
const WAVE2_PHASE_OFFSET = -0.9;  // Negative = travels opposite direction

const COLOR_BOTTOM = '#e63946';
const COLOR_FALLING = '#457b9d';

// --- Types ---
interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isHub?: boolean;  // Center point flag
}

interface Spring {
  a: number;
  b: number;
  restLen: number;
}

interface Body {
  points: Point[];      // [0..n-1] = perimeter, [n] = hub
  perimeterCount: number;
  springs: Spring[];
  color: string;
  restVolume: number;
}

// --- Geometry ---

function createTPerimeter(offsetX: number, offsetY: number): Point[] {
  const cs = CELL_SIZE;
  const outline = [
    { x: -1 * cs, y: 0 },
    { x: 2 * cs, y: 0 },
    { x: 2 * cs, y: 1 * cs },
    { x: 1 * cs, y: 1 * cs },
    { x: 1 * cs, y: 2 * cs },
    { x: 0 * cs, y: 2 * cs },
    { x: 0 * cs, y: 1 * cs },
    { x: -1 * cs, y: 1 * cs },
  ];

  // Subdivide once (8 -> 16 points)
  let pts = outline;
  const next: { x: number; y: number }[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    next.push(p1);
    next.push({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
  }
  pts = next;

  return pts.map(p => ({
    x: p.x + offsetX,
    y: p.y + offsetY,
    vx: 0,
    vy: 0
  }));
}

// Calculate centroid
function calcCentroid(points: Point[]): { x: number; y: number } {
  let sx = 0, sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}

// Calculate polygon area (perimeter points only)
function calcVolume(points: Point[], count: number): number {
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    sum += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(sum) * 0.5;
}

// Create body with hub
function createBody(offsetX: number, offsetY: number, color: string): Body {
  const perimeter = createTPerimeter(offsetX, offsetY);
  const perimeterCount = perimeter.length;

  // Calculate centroid for hub
  const centroid = calcCentroid(perimeter);
  const hub: Point = {
    x: centroid.x,
    y: centroid.y,
    vx: 0,
    vy: 0,
    isHub: true
  };

  // All points: perimeter + hub
  const points = [...perimeter, hub];
  const hubIndex = perimeterCount;

  // Create springs
  const springs: Spring[] = [];

  // 1. Perimeter springs (adjacent points)
  for (let i = 0; i < perimeterCount; i++) {
    const j = (i + 1) % perimeterCount;
    const dx = points[j].x - points[i].x;
    const dy = points[j].y - points[i].y;
    springs.push({ a: i, b: j, restLen: Math.sqrt(dx * dx + dy * dy) });
  }

  // 2. Spoke springs (hub to each perimeter point)
  for (let i = 0; i < perimeterCount; i++) {
    const dx = points[i].x - hub.x;
    const dy = points[i].y - hub.y;
    springs.push({ a: hubIndex, b: i, restLen: Math.sqrt(dx * dx + dy * dy) });
  }

  // 3. Skip-one springs for more rigidity (connect every other perimeter point)
  for (let i = 0; i < perimeterCount; i++) {
    const j = (i + 2) % perimeterCount;
    const dx = points[j].x - points[i].x;
    const dy = points[j].y - points[i].y;
    springs.push({ a: i, b: j, restLen: Math.sqrt(dx * dx + dy * dy) });
  }

  // 4. Skip-three springs for extra structure
  for (let i = 0; i < perimeterCount; i++) {
    const j = (i + 4) % perimeterCount;
    const dx = points[j].x - points[i].x;
    const dy = points[j].y - points[i].y;
    springs.push({ a: i, b: j, restLen: Math.sqrt(dx * dx + dy * dy) });
  }

  const restVolume = calcVolume(points, perimeterCount);

  return { points, perimeterCount, springs, color, restVolume };
}

// --- Collision Detection ---

// Point-in-polygon test using ray casting (crossing number algorithm)
function isPointInPolygon(px: number, py: number, polygon: Point[], count: number): boolean {
  let crossings = 0;

  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    const yi = polygon[i].y;
    const yj = polygon[j].y;
    const xi = polygon[i].x;
    const xj = polygon[j].x;

    // Check if ray from point going right crosses this edge
    if ((yi <= py && yj > py) || (yj <= py && yi > py)) {
      // Compute x coordinate of intersection
      const t = (py - yi) / (yj - yi);
      const xIntersect = xi + t * (xj - xi);
      if (px < xIntersect) {
        crossings++;
      }
    }
  }

  return (crossings % 2) === 1;
}

// Find closest edge to a point and return penetration info
function findClosestEdge(
  px: number, py: number, pvx: number, pvy: number,
  polygon: Point[], count: number
): { edgeIdx: number; depth: number; nx: number; ny: number; t: number } | null {
  let minDist = Infinity;
  let result: { edgeIdx: number; depth: number; nx: number; ny: number; t: number } | null = null;

  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    const ax = polygon[i].x;
    const ay = polygon[i].y;
    const bx = polygon[j].x;
    const by = polygon[j].y;

    // Edge vector
    const ex = bx - ax;
    const ey = by - ay;
    const edgeLen = Math.sqrt(ex * ex + ey * ey);
    if (edgeLen < 0.001) continue;

    // Normalized edge direction
    const dx = ex / edgeLen;
    const dy = ey / edgeLen;

    // Project point onto edge line
    const t = ((px - ax) * dx + (py - ay) * dy) / edgeLen;

    // Clamp t to edge bounds
    const tClamped = Math.max(0, Math.min(1, t));

    // Closest point on edge
    const closestX = ax + tClamped * ex;
    const closestY = ay + tClamped * ey;

    // Distance to edge
    const distX = px - closestX;
    const distY = py - closestY;
    const dist = Math.sqrt(distX * distX + distY * distY);

    if (dist < minDist) {
      minDist = dist;

      // Outward normal (perpendicular to edge, pointing right when going from a to b)
      // For clockwise winding, this points outward
      let nx = dy;
      let ny = -dx;

      // Ensure normal points from polygon center toward the point
      // (the point is inside, so we need to push it out along this normal)
      const centerX = (ax + bx) / 2;
      const centerY = (ay + by) / 2;
      const toCenterX = polygon.reduce((s, p, idx) => idx < count ? s + p.x : s, 0) / count - centerX;
      const toCenterY = polygon.reduce((s, p, idx) => idx < count ? s + p.y : s, 0) / count - centerY;

      // If normal points toward center, flip it
      if (nx * toCenterX + ny * toCenterY > 0) {
        nx = -nx;
        ny = -ny;
      }

      result = {
        edgeIdx: i,
        depth: dist,
        nx,
        ny,
        t: tClamped
      };
    }
  }

  return result;
}

// Check and resolve collisions between two bodies
function checkBodyCollision(bodyA: Body, bodyB: Body): void {
  // Check if any perimeter vertex of B is inside A
  for (let i = 0; i < bodyB.perimeterCount; i++) {
    const pB = bodyB.points[i];

    if (isPointInPolygon(pB.x, pB.y, bodyA.points, bodyA.perimeterCount)) {
      // Point is inside - find closest edge and push out
      const edge = findClosestEdge(pB.x, pB.y, pB.vx, pB.vy, bodyA.points, bodyA.perimeterCount);

      if (edge && edge.depth > 0.1) {
        const { edgeIdx, depth, nx, ny, t } = edge;
        const j = (edgeIdx + 1) % bodyA.perimeterCount;
        const pA1 = bodyA.points[edgeIdx];
        const pA2 = bodyA.points[j];

        // Compute relative velocity at contact
        // Edge velocity is interpolated between the two endpoints
        const edgeVx = pA1.vx * (1 - t) + pA2.vx * t;
        const edgeVy = pA1.vy * (1 - t) + pA2.vy * t;
        const relVx = pB.vx - edgeVx;
        const relVy = pB.vy - edgeVy;
        const relVn = relVx * nx + relVy * ny; // Normal component of relative velocity

        // Collision response force (spring + damping)
        const springForce = COLLISION_STIFFNESS * depth;
        const dampForce = COLLISION_DAMPING * Math.min(0, relVn); // Only damp approaching velocity
        const totalForce = springForce + dampForce;

        // Apply impulse to penetrating vertex (push out)
        pB.vx += totalForce * nx * 0.016; // Approximate dt
        pB.vy += totalForce * ny * 0.016;

        // Apply equal-opposite force to edge endpoints (proportional to t)
        const forceToEdge = totalForce * 0.016;
        pA1.vx -= forceToEdge * nx * (1 - t);
        pA1.vy -= forceToEdge * ny * (1 - t);
        pA2.vx -= forceToEdge * nx * t;
        pA2.vy -= forceToEdge * ny * t;

        // Position correction (move vertex out by half penetration)
        const correction = depth * 0.3;
        pB.x += nx * correction;
        pB.y += ny * correction;
        // Push edge points the other way
        pA1.x -= nx * correction * (1 - t) * 0.5;
        pA1.y -= ny * correction * (1 - t) * 0.5;
        pA2.x -= nx * correction * t * 0.5;
        pA2.y -= ny * correction * t * 0.5;
      }
    }
  }

  // Check if any perimeter vertex of A is inside B (symmetric check)
  for (let i = 0; i < bodyA.perimeterCount; i++) {
    const pA = bodyA.points[i];

    if (isPointInPolygon(pA.x, pA.y, bodyB.points, bodyB.perimeterCount)) {
      const edge = findClosestEdge(pA.x, pA.y, pA.vx, pA.vy, bodyB.points, bodyB.perimeterCount);

      if (edge && edge.depth > 0.1) {
        const { edgeIdx, depth, nx, ny, t } = edge;
        const j = (edgeIdx + 1) % bodyB.perimeterCount;
        const pB1 = bodyB.points[edgeIdx];
        const pB2 = bodyB.points[j];

        const edgeVx = pB1.vx * (1 - t) + pB2.vx * t;
        const edgeVy = pB1.vy * (1 - t) + pB2.vy * t;
        const relVx = pA.vx - edgeVx;
        const relVy = pA.vy - edgeVy;
        const relVn = relVx * nx + relVy * ny;

        const springForce = COLLISION_STIFFNESS * depth;
        const dampForce = COLLISION_DAMPING * Math.min(0, relVn);
        const totalForce = springForce + dampForce;

        pA.vx += totalForce * nx * 0.016;
        pA.vy += totalForce * ny * 0.016;

        const forceToEdge = totalForce * 0.016;
        pB1.vx -= forceToEdge * nx * (1 - t);
        pB1.vy -= forceToEdge * ny * (1 - t);
        pB2.vx -= forceToEdge * nx * t;
        pB2.vy -= forceToEdge * ny * t;

        const correction = depth * 0.3;
        pA.x += nx * correction;
        pA.y += ny * correction;
        pB1.x -= nx * correction * (1 - t) * 0.5;
        pB1.y -= ny * correction * (1 - t) * 0.5;
        pB2.x -= nx * correction * t * 0.5;
        pB2.y -= ny * correction * t * 0.5;
      }
    }
  }
}

// --- Physics ---

function updateBody(body: Body, dt: number, groundY: number): void {
  const { points, perimeterCount, springs, restVolume } = body;
  const n = points.length;

  const fx: number[] = new Array(n).fill(0);
  const fy: number[] = new Array(n).fill(0);

  // 1. Gravity
  for (let i = 0; i < n; i++) {
    fy[i] += GRAVITY;
  }

  // 2. Spring forces
  for (const spring of springs) {
    const pa = points[spring.a];
    const pb = points[spring.b];

    const dx = pb.x - pa.x;
    const dy = pb.y - pa.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    const stretch = dist - spring.restLen;

    const nx = dx / dist;
    const ny = dy / dist;

    const springF = SPRING_K * stretch;
    const dvx = pb.vx - pa.vx;
    const dvy = pb.vy - pa.vy;
    const dampF = SPRING_DAMP * (dvx * nx + dvy * ny);

    const totalF = springF + dampF;

    fx[spring.a] += totalF * nx;
    fy[spring.a] += totalF * ny;
    fx[spring.b] -= totalF * nx;
    fy[spring.b] -= totalF * ny;
  }

  // 3. Pressure force (on perimeter points only)
  const currentVolume = calcVolume(points, perimeterCount);
  const volumeRatio = restVolume / Math.max(currentVolume, 100);
  const pressure = PRESSURE_K * (volumeRatio - 1);

  for (let i = 0; i < perimeterCount; i++) {
    const prev = (i - 1 + perimeterCount) % perimeterCount;
    const next = (i + 1) % perimeterCount;

    const e1x = points[i].x - points[prev].x;
    const e1y = points[i].y - points[prev].y;
    const e2x = points[next].x - points[i].x;
    const e2y = points[next].y - points[i].y;

    // Outward normals (for clockwise winding: rotate edge 90° right)
    const n1x = e1y, n1y = -e1x;
    const n2x = e2y, n2y = -e2x;

    let avgNx = n1x + n2x;
    let avgNy = n1y + n2y;
    const len = Math.sqrt(avgNx * avgNx + avgNy * avgNy) || 1;
    avgNx /= len;
    avgNy /= len;

    fx[i] += pressure * avgNx;
    fy[i] += pressure * avgNy;
  }

  // 4. Integrate
  for (let i = 0; i < n; i++) {
    const p = points[i];

    p.vx += fx[i] * dt;
    p.vy += fy[i] * dt;

    p.vx *= GLOBAL_DAMP;
    p.vy *= GLOBAL_DAMP;

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Ground collision
    if (p.y > groundY) {
      p.y = groundY;
      if (p.vy > 0) p.vy = -p.vy * BOUNCE;
      p.vx *= FRICTION;
    }
  }
}

// --- Rendering ---

// Apply wave displacement to points - dual waves for gloopy feel
function getWavyPoints(points: Point[], count: number, time: number): { x: number; y: number }[] {
  const result: { x: number; y: number }[] = [];

  for (let i = 0; i < count; i++) {
    const prev = (i - 1 + count) % count;
    const next = (i + 1) % count;

    // Calculate outward normal at this vertex
    const e1x = points[i].x - points[prev].x;
    const e1y = points[i].y - points[prev].y;
    const e2x = points[next].x - points[i].x;
    const e2y = points[next].y - points[i].y;

    // Average normal
    let nx = e1y + e2y;
    let ny = -(e1x + e2x);
    const len = Math.sqrt(nx * nx + ny * ny) || 1;
    nx /= len;
    ny /= len;

    // Dual sinusoidal waves with different frequencies for undulation
    const phase1 = i * WAVE1_PHASE_OFFSET;
    const phase2 = i * WAVE2_PHASE_OFFSET;
    const wave1 = Math.sin(time * WAVE1_SPEED * Math.PI * 2 + phase1);
    const wave2 = Math.sin(time * WAVE2_SPEED * Math.PI * 2 + phase2);

    // Combine waves (average them for smoother undulation)
    const wave = (wave1 * 0.6 + wave2 * 0.4) * WAVE_AMPLITUDE;

    result.push({
      x: points[i].x + nx * wave,
      y: points[i].y + ny * wave
    });
  }

  return result;
}

function createPath(points: { x: number; y: number }[], count: number): string {
  if (count < 3) return '';

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < count; i++) {
    const p0 = points[(i - 1 + count) % count];
    const p1 = points[i];
    const p2 = points[(i + 1) % count];
    const p3 = points[(i + 2) % count];

    const t = 0.5;
    const cp1x = p1.x + (p2.x - p0.x) * t / 3;
    const cp1y = p1.y + (p2.y - p0.y) * t / 3;
    const cp2x = p2.x - (p3.x - p1.x) * t / 3;
    const cp2y = p2.y - (p3.y - p1.y) * t / 3;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d + ' Z';
}

// --- Component ---
export const SoftBodyDemo: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showVerts, setShowVerts] = useState(false);
  const [showSprings, setShowSprings] = useState(false);

  const bodiesRef = useRef<{ bottom: Body; falling: Body } | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  if (!bodiesRef.current) {
    const centerX = 3 * CELL_SIZE;
    bodiesRef.current = {
      bottom: createBody(centerX, 7 * CELL_SIZE, COLOR_BOTTOM),
      falling: createBody(centerX, 0, COLOR_FALLING)
    };
  }

  const reset = useCallback(() => {
    const centerX = 3 * CELL_SIZE;
    bodiesRef.current = {
      bottom: createBody(centerX, 7 * CELL_SIZE, COLOR_BOTTOM),
      falling: createBody(centerX, 0, COLOR_FALLING)
    };
    lastTimeRef.current = 0;
    timeRef.current = 0;
    setTick(0);
  }, []);

  useEffect(() => {
    if (paused) return;

    let rafId: number;

    const loop = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.033);
      lastTimeRef.current = timestamp;

      if (bodiesRef.current && dt > 0) {
        const subSteps = 4;
        const subDt = dt / subSteps;

        for (let s = 0; s < subSteps; s++) {
          // Both bodies use real ground at bottom of panel
          updateBody(bodiesRef.current.falling, subDt, PANEL_H);
          updateBody(bodiesRef.current.bottom, subDt, PANEL_H);

          // Body-to-body collision
          checkBodyCollision(bodiesRef.current.bottom, bodiesRef.current.falling);
        }

        timeRef.current += dt;
        setTick(t => t + 1);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [paused]);

  const bodies = bodiesRef.current;
  const fallingVol = bodies ? (calcVolume(bodies.falling.points, bodies.falling.perimeterCount) / bodies.falling.restVolume * 100).toFixed(0) : '?';

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-200 flex flex-col items-center p-4">
      <div className="flex items-center gap-2 mb-4 flex-wrap justify-center">
        <button onClick={onBack} className="px-3 py-1.5 bg-slate-800 rounded text-sm">← Back</button>
        <h1 className="text-lg font-bold">Soft Body v10</h1>
        <button onClick={() => setShowVerts(v => !v)} className="px-2 py-1 bg-slate-700 rounded text-xs">
          verts {showVerts ? 'ON' : 'OFF'}
        </button>
        <button onClick={() => setShowSprings(v => !v)} className="px-2 py-1 bg-slate-700 rounded text-xs">
          springs {showSprings ? 'ON' : 'OFF'}
        </button>
        <button onClick={() => setPaused(p => !p)} className="px-3 py-1.5 bg-slate-800 rounded text-sm">
          {paused ? '▶' : '⏸'}
        </button>
        <button onClick={reset} className="px-3 py-1.5 bg-slate-800 rounded text-sm">↺</button>
      </div>

      <svg width={PANEL_W} height={PANEL_H} style={{ background: '#1e293b', borderRadius: 8 }}>
        {/* Grid */}
        <g opacity={0.08}>
          {Array.from({ length: GRID_W + 1 }).map((_, i) => (
            <line key={`v${i}`} x1={i * CELL_SIZE} y1={0} x2={i * CELL_SIZE} y2={PANEL_H} stroke="#fff" />
          ))}
          {Array.from({ length: GRID_H + 1 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * CELL_SIZE} x2={PANEL_W} y2={i * CELL_SIZE} stroke="#fff" />
          ))}
        </g>

        {/* Bodies */}
        {bodies && [bodies.bottom, bodies.falling].map((body, bi) => {
          const wavyPts = getWavyPoints(body.points, body.perimeterCount, timeRef.current + bi * 0.5);
          return (
            <g key={bi}>
              {/* Springs visualization */}
              {showSprings && body.springs.map((spring, si) => (
                <line
                  key={si}
                  x1={body.points[spring.a].x}
                  y1={body.points[spring.a].y}
                  x2={body.points[spring.b].x}
                  y2={body.points[spring.b].y}
                  stroke="rgba(0,255,0,0.3)"
                  strokeWidth={1}
                />
              ))}
              {/* Shape with wavy edges */}
              <path d={createPath(wavyPts, body.perimeterCount)} fill={body.color} opacity={0.85} />
              {/* Vertices (physics positions, not wavy) */}
              {showVerts && body.points.map((p, pi) => (
                <circle
                  key={pi}
                  cx={p.x}
                  cy={p.y}
                  r={p.isHub ? 5 : 3}
                  fill={p.isHub ? 'cyan' : 'yellow'}
                  stroke="#000"
                  strokeWidth={0.5}
                />
              ))}
            </g>
          );
        })}
      </svg>

      <div className="mt-3 text-sm text-yellow-400 font-mono">
        Volume: {fallingVol}% | Springs: {bodies?.falling.springs.length} | Tick: {tick}
      </div>

      <div className="mt-2 text-xs text-slate-400 text-center max-w-md">
        <p><strong>v10:</strong> Gloopy dual-wave undulation.</p>
        <p>Two overlapping waves at different speeds = organic, gross movement.</p>
      </div>
    </div>
  );
};

export default SoftBodyDemo;

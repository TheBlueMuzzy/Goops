/**
 * Soft Body Demo v16 - Using SoftBodyRenderer Module
 *
 * Simulates actual game mechanics:
 * - Locked Goop: Anchored to grid, jiggles on impact, springs back
 * - Active Goop: Falls in column (no horizontal drift), lands and locks
 * - Collision: Both bodies squish on impact
 * - Tank rotation would move the column (not implemented in demo yet)
 *
 * Key difference from free physics:
 * - Bodies stay upright (no rotation/tumbling)
 * - X position locked to column
 * - Y position: locked=fixed, active=falling
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Point,
  Spring,
  Body,
  extractPerimeter,
  createBodyFromPerimeter,
  checkBodyCollision,
  updateBodyGameAccurate,
  updateBodyFreePhysics,
  applyImpulse,
  getWavyPoints,
  createBezierPath
} from '../rendering/SoftBodyRenderer';

// --- Constants ---
const CELL_SIZE = 50;
const GRID_W = 7;
const GRID_H = 10;
const PANEL_W = GRID_W * CELL_SIZE;
const PANEL_H = GRID_H * CELL_SIZE;

// Physics tuning for free physics mode (demo-specific)
const GRAVITY = 600;
const SPRING_K = 500;
const SPRING_DAMP = 18;
const PRESSURE_K = 15000;
const GLOBAL_DAMP = 0.995;
const BOUNCE = 0.3;
const FRICTION = 0.85;

const COLOR_BOTTOM = '#e63946';
const COLOR_FALLING = '#457b9d';

// --- Demo-specific types (extends module types with optional fields) ---
// Demo bodies may lack groupId for legacy shapes
interface DemoBody extends Omit<Body, 'groupId'> {
  groupId?: string;
}

// --- Helper: Create test cell sets ---
function createTestCells(shape: 'T' | 'L' | 'square' | 'line'): Set<string> {
  const cells = new Set<string>();

  switch (shape) {
    case 'T':
      cells.add('0,0');
      cells.add('1,0');
      cells.add('2,0');
      cells.add('1,1');
      break;
    case 'L':
      cells.add('0,0');
      cells.add('0,1');
      cells.add('0,2');
      cells.add('1,2');
      break;
    case 'square':
      cells.add('0,0');
      cells.add('1,0');
      cells.add('0,1');
      cells.add('1,1');
      break;
    case 'line':
      cells.add('0,0');
      cells.add('0,1');
      cells.add('0,2');
      cells.add('0,3');
      break;
  }

  return cells;
}

// --- Legacy T-perimeter (for comparison mode) ---
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

// Calculate polygon area (perimeter points only)
function calcVolume(points: Point[], count: number): number {
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    sum += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(sum) * 0.5;
}

// Create legacy body with hub (for comparison mode)
function createLegacyBody(offsetX: number, offsetY: number, color: string): DemoBody {
  const perimeter = createTPerimeter(offsetX, offsetY);
  const perimeterCount = perimeter.length;

  // Calculate centroid for hub
  let cx = 0, cy = 0;
  for (const p of perimeter) {
    cx += p.x;
    cy += p.y;
  }
  cx /= perimeterCount;
  cy /= perimeterCount;

  const hub: Point = {
    x: cx,
    y: cy,
    vx: 0,
    vy: 0,
    isHub: true
  };

  const points = [...perimeter, hub];
  const hubIndex = perimeterCount;

  const springs: Spring[] = [];

  // Helper distance function
  const dist = (i: number, j: number) => {
    const dx = points[j].x - points[i].x;
    const dy = points[j].y - points[i].y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 1. Perimeter springs (adjacent points)
  for (let i = 0; i < perimeterCount; i++) {
    const j = (i + 1) % perimeterCount;
    springs.push({ a: i, b: j, restLen: dist(i, j) });
  }

  // 2. Spoke springs (hub to each perimeter point)
  for (let i = 0; i < perimeterCount; i++) {
    springs.push({ a: hubIndex, b: i, restLen: dist(hubIndex, i) });
  }

  // 3. Skip-one springs
  for (let i = 0; i < perimeterCount; i++) {
    const j = (i + 2) % perimeterCount;
    springs.push({ a: i, b: j, restLen: dist(i, j) });
  }

  // 4. Skip-three springs
  for (let i = 0; i < perimeterCount; i++) {
    const j = (i + 4) % perimeterCount;
    springs.push({ a: i, b: j, restLen: dist(i, j) });
  }

  const restVolume = calcVolume(points, perimeterCount);

  return {
    points,
    perimeterCount,
    springs,
    color,
    restVolume,
    restOffsets: points.map(p => ({ x: p.x - cx, y: p.y - cy })),
    gridX: cx,
    gridY: cy,
    isLocked: true,
    fallSpeed: 0
  };
}

// --- Free physics update (demo-specific, allows tumbling) ---
function updateBodyFree(body: DemoBody, dt: number, groundY: number): void {
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

  // 3. Pressure force
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

// --- Landing detection ---
function checkLanding(falling: DemoBody, locked: DemoBody, groundY: number): boolean {
  let fallingBottom = 0;
  for (let i = 0; i < falling.perimeterCount; i++) {
    fallingBottom = Math.max(fallingBottom, falling.points[i].y);
  }

  let lockedTop = groundY;
  for (let i = 0; i < locked.perimeterCount; i++) {
    lockedTop = Math.min(lockedTop, locked.points[i].y);
  }

  return fallingBottom >= lockedTop - 5 || fallingBottom >= groundY - 5;
}

// --- Lock a falling body ---
function lockBody(body: DemoBody): void {
  body.isLocked = true;
  body.fallSpeed = 0;
  const cx = body.gridX;
  const cy = body.gridY;
  for (let i = 0; i < body.points.length; i++) {
    body.restOffsets[i] = {
      x: body.points[i].x - cx,
      y: body.points[i].y - cy
    };
  }
}

// Shape types for the demo
type ShapeType = 'T' | 'L' | 'square' | 'line' | 'legacy';

/**
 * Create a body from a shape type using the new grid-to-mesh generation
 */
function createGeneratedBody(shape: ShapeType, offsetX: number, offsetY: number, color: string, isLocked: boolean = true): DemoBody {
  if (shape === 'legacy') {
    const body = createLegacyBody(offsetX, offsetY, color);
    body.isLocked = isLocked;
    body.fallSpeed = isLocked ? 0 : 150;
    return body;
  }

  const cells = createTestCells(shape as 'T' | 'L' | 'square' | 'line');
  const perimeter = extractPerimeter(cells, CELL_SIZE, offsetX, offsetY);
  const body = createBodyFromPerimeter(perimeter, color, `demo-${shape}`, isLocked);
  return body as DemoBody;
}

// --- Component ---
export const SoftBodyDemo: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showVerts, setShowVerts] = useState(false);
  const [showSprings, setShowSprings] = useState(false);
  const [bottomShape, setBottomShape] = useState<ShapeType>('T');
  const [fallingShape, setFallingShape] = useState<ShapeType>('L');
  const [useGamePhysics, setUseGamePhysics] = useState(true);

  const bodiesRef = useRef<{ bottom: DemoBody; falling: DemoBody } | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Create bodies with current shapes
  const createBodies = useCallback((bShape: ShapeType, fShape: ShapeType) => {
    const centerX = 3 * CELL_SIZE;
    return {
      bottom: createGeneratedBody(bShape, centerX, 7 * CELL_SIZE, COLOR_BOTTOM, true),
      falling: createGeneratedBody(fShape, centerX, 1 * CELL_SIZE, COLOR_FALLING, false)
    };
  }, []);

  if (!bodiesRef.current) {
    bodiesRef.current = createBodies(bottomShape, fallingShape);
  }

  const reset = useCallback(() => {
    bodiesRef.current = createBodies(bottomShape, fallingShape);
    lastTimeRef.current = 0;
    timeRef.current = 0;
    setTick(0);
  }, [bottomShape, fallingShape, createBodies]);

  const changeBottomShape = useCallback((shape: ShapeType) => {
    setBottomShape(shape);
    const centerX = 3 * CELL_SIZE;
    if (bodiesRef.current) {
      bodiesRef.current.bottom = createGeneratedBody(shape, centerX, 7 * CELL_SIZE, COLOR_BOTTOM, true);
    }
    setTick(t => t + 1);
  }, []);

  const changeFallingShape = useCallback((shape: ShapeType) => {
    setFallingShape(shape);
    const centerX = 3 * CELL_SIZE;
    if (bodiesRef.current) {
      bodiesRef.current.falling = createGeneratedBody(shape, centerX, 1 * CELL_SIZE, COLOR_FALLING, false);
    }
    setTick(t => t + 1);
  }, []);

  const pokeBodies = useCallback(() => {
    if (bodiesRef.current) {
      applyImpulse(bodiesRef.current.bottom as Body, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
      applyImpulse(bodiesRef.current.falling as Body, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
    }
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
          if (useGamePhysics) {
            // Game-accurate mode: use module function
            updateBodyGameAccurate(bodiesRef.current.falling as Body, subDt);
            updateBodyGameAccurate(bodiesRef.current.bottom as Body, subDt);

            checkBodyCollision(bodiesRef.current.bottom as Body, bodiesRef.current.falling as Body);

            if (!bodiesRef.current.falling.isLocked) {
              if (checkLanding(bodiesRef.current.falling, bodiesRef.current.bottom, PANEL_H)) {
                lockBody(bodiesRef.current.falling);
              }
            }
          } else {
            // Free physics mode: local function (allows tumbling with ground)
            updateBodyFree(bodiesRef.current.falling, subDt, PANEL_H);
            updateBodyFree(bodiesRef.current.bottom, subDt, PANEL_H);
            checkBodyCollision(bodiesRef.current.bottom as Body, bodiesRef.current.falling as Body);
          }
        }

        timeRef.current += dt;
        setTick(t => t + 1);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [paused, useGamePhysics]);

  const bodies = bodiesRef.current;
  const fallingVol = bodies ? (calcVolume(bodies.falling.points, bodies.falling.perimeterCount) / bodies.falling.restVolume * 100).toFixed(0) : '?';

  const shapes: ShapeType[] = ['T', 'L', 'square', 'line', 'legacy'];

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-200 flex flex-col items-center p-4">
      <div className="flex items-center gap-2 mb-2 flex-wrap justify-center">
        <button onClick={onBack} className="px-3 py-1.5 bg-slate-800 rounded text-sm">← Back</button>
        <h1 className="text-lg font-bold">Soft Body v16</h1>
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
        <button
          onClick={() => setUseGamePhysics(g => !g)}
          className={`px-2 py-1 rounded text-xs ${useGamePhysics ? 'bg-green-700' : 'bg-orange-700'}`}
        >
          {useGamePhysics ? 'Game Mode' : 'Free Physics'}
        </button>
        <button onClick={pokeBodies} className="px-2 py-1 bg-purple-700 rounded text-xs">
          Poke!
        </button>
      </div>

      {/* Shape selection */}
      <div className="flex items-center gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-red-400">Red:</span>
          {shapes.map(s => (
            <button
              key={`b-${s}`}
              onClick={() => changeBottomShape(s)}
              className={`px-2 py-0.5 rounded ${bottomShape === s ? 'bg-red-700' : 'bg-slate-700'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-blue-400">Blue:</span>
          {shapes.map(s => (
            <button
              key={`f-${s}`}
              onClick={() => changeFallingShape(s)}
              className={`px-2 py-0.5 rounded ${fallingShape === s ? 'bg-blue-700' : 'bg-slate-700'}`}
            >
              {s}
            </button>
          ))}
        </div>
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
              <path d={createBezierPath(wavyPts, body.perimeterCount)} fill={body.color} opacity={0.85} />
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
        <p><strong>v16:</strong> Using SoftBodyRenderer module.</p>
        <p><span className="text-green-400">Game Mode:</span> Blue falls down (column-locked), red is locked. Both squish on impact.</p>
        <p><span className="text-orange-400">Free Physics:</span> Bodies tumble freely (for comparison).</p>
        <p className="text-slate-500">Reset to drop blue again. Poke to test jiggle.</p>
      </div>
    </div>
  );
};

export default SoftBodyDemo;

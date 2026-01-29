/**
 * SoftBodyRenderer - Soft body physics and mesh generation module
 *
 * Extracted from SoftBodyDemo.tsx for reuse across the game.
 * Handles:
 * - Grid-to-mesh generation (extractPerimeter, createBodyFromPerimeter)
 * - Physics simulation (springs, pressure, collision)
 * - Path generation for rendering (Bezier curves)
 *
 * NOTE: This is VISUAL ONLY. Game logic (goop groups, collisions, clearing)
 * remains in GameEngine. This module just makes locked goop look "soft".
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isHub?: boolean;
}

export interface Spring {
  a: number;
  b: number;
  restLen: number;
}

export interface Body {
  points: Point[];
  perimeterCount: number;
  springs: Spring[];
  color: string;
  restVolume: number;
  restOffsets: { x: number; y: number }[];
  gridX: number;
  gridY: number;
  isLocked: boolean;
  fallSpeed: number;
  groupId: string;
  // Anchor for rotation-independent positioning
  anchorGridX?: number;  // Stable grid X (0 to TANK_WIDTH-1), doesn't change with rotation
  anchorRow?: number;    // Grid row (also stable)
  // Original perimeter in GRID coordinates (relative to anchor)
  // Used at render time for correct cylindrical projection
  perimeterGridCoords?: { gx: number; gy: number }[];
}

// GoopGroup-like structure for updateFromGroups
export interface GoopGroupInfo {
  cells: Set<string>;  // "x,y" coordinates
  color: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Physics tuning
const GRAVITY = 600;
const SPRING_K = 500;
const SPRING_DAMP = 18;
const PRESSURE_K = 15000;
const GLOBAL_DAMP = 0.995;
const BOUNCE = 0.3;
const FRICTION = 0.85;

// Body-to-body collision
const COLLISION_RADIUS = 5;
const COLLISION_PUSH = 0.35;

// Wave effect for ambient undulation
const WAVE_AMPLITUDE = 2.25;
const WAVE1_SPEED = 0.6375;
const WAVE2_SPEED = 0.525;
const WAVE1_PHASE_OFFSET = 0.7;
const WAVE2_PHASE_OFFSET = -0.9;

// Game-accurate physics
const ANCHOR_STIFFNESS = 600;
const ANCHOR_DAMP = 20;
const FALL_GRAVITY = 200;
const MAX_FALL_SPEED = 400;

// ============================================================================
// GRID-TO-MESH GENERATION
// ============================================================================

/**
 * Extract perimeter vertices from a set of grid cells.
 * Algorithm:
 * 1. Find all edges that are on the perimeter (adjacent cell not in set)
 * 2. Order edges into a continuous polygon
 * 3. Subdivide long edges for smooth curves
 *
 * @param cells Set of "x,y" cell coordinates
 * @param cellSize Size of each cell in pixels
 * @param offsetX X offset for positioning
 * @param offsetY Y offset for positioning
 * @returns Ordered perimeter vertices (clockwise)
 */
export function extractPerimeter(
  cells: Set<string>,
  cellSize: number,
  offsetX: number = 0,
  offsetY: number = 0
): Point[] {
  if (cells.size === 0) return [];

  interface Edge {
    x1: number; y1: number;
    x2: number; y2: number;
  }

  const perimeterEdges: Edge[] = [];

  for (const cellKey of cells) {
    const [cx, cy] = cellKey.split(',').map(Number);

    const left = cx * cellSize + offsetX;
    const right = (cx + 1) * cellSize + offsetX;
    const top = cy * cellSize + offsetY;
    const bottom = (cy + 1) * cellSize + offsetY;

    // Top edge
    if (!cells.has(`${cx},${cy - 1}`)) {
      perimeterEdges.push({ x1: left, y1: top, x2: right, y2: top });
    }
    // Right edge
    if (!cells.has(`${cx + 1},${cy}`)) {
      perimeterEdges.push({ x1: right, y1: top, x2: right, y2: bottom });
    }
    // Bottom edge
    if (!cells.has(`${cx},${cy + 1}`)) {
      perimeterEdges.push({ x1: right, y1: bottom, x2: left, y2: bottom });
    }
    // Left edge
    if (!cells.has(`${cx - 1},${cy}`)) {
      perimeterEdges.push({ x1: left, y1: bottom, x2: left, y2: top });
    }
  }

  if (perimeterEdges.length === 0) return [];

  // Order edges into a continuous polygon
  const orderedEdges: Edge[] = [];
  const usedEdges = new Set<number>();

  orderedEdges.push(perimeterEdges[0]);
  usedEdges.add(0);

  while (orderedEdges.length < perimeterEdges.length) {
    const lastEdge = orderedEdges[orderedEdges.length - 1];
    let foundNext = false;

    for (let i = 0; i < perimeterEdges.length; i++) {
      if (usedEdges.has(i)) continue;
      const candidate = perimeterEdges[i];

      if (Math.abs(candidate.x1 - lastEdge.x2) < 0.01 &&
          Math.abs(candidate.y1 - lastEdge.y2) < 0.01) {
        orderedEdges.push(candidate);
        usedEdges.add(i);
        foundNext = true;
        break;
      }
    }

    if (!foundNext) break;
  }

  const vertices: { x: number; y: number }[] = orderedEdges.map(e => ({ x: e.x1, y: e.y1 }));

  // Subdivide long edges
  const TARGET_SPACING = 18;
  const subdividedVertices: { x: number; y: number }[] = [];

  for (let i = 0; i < vertices.length; i++) {
    const curr = vertices[i];
    const next = vertices[(i + 1) % vertices.length];

    subdividedVertices.push(curr);

    const dx = next.x - curr.x;
    const dy = next.y - curr.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const subdivisions = Math.floor(dist / TARGET_SPACING);

    for (let s = 1; s <= subdivisions; s++) {
      const t = s / (subdivisions + 1);
      subdividedVertices.push({
        x: curr.x + dx * t,
        y: curr.y + dy * t
      });
    }
  }

  return subdividedVertices.map(v => ({
    x: v.x,
    y: v.y,
    vx: 0,
    vy: 0
  }));
}

/**
 * Create a complete Body from perimeter vertices.
 */
export function createBodyFromPerimeter(
  perimeter: Point[],
  color: string,
  groupId: string,
  isLocked: boolean = true
): Body {
  if (perimeter.length < 3) {
    throw new Error('Need at least 3 perimeter points to create a body');
  }

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

  const dist = (i: number, j: number) => {
    const dx = points[j].x - points[i].x;
    const dy = points[j].y - points[i].y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Adjacent perimeter springs
  for (let i = 0; i < perimeterCount; i++) {
    const j = (i + 1) % perimeterCount;
    const d = dist(i, j);
    if (d > 5) springs.push({ a: i, b: j, restLen: d });
  }

  // Spoke springs (hub to perimeter)
  for (let i = 0; i < perimeterCount; i++) {
    const d = dist(hubIndex, i);
    if (d > 5) springs.push({ a: hubIndex, b: i, restLen: d });
  }

  // Skip-2 springs
  for (let i = 0; i < perimeterCount; i++) {
    const j = (i + 2) % perimeterCount;
    const d = dist(i, j);
    if (d > 5) springs.push({ a: i, b: j, restLen: d });
  }

  // Skip-4 springs (extra rigidity)
  if (perimeterCount > 8) {
    for (let i = 0; i < perimeterCount; i++) {
      const j = (i + 4) % perimeterCount;
      const d = dist(i, j);
      if (d > 5) springs.push({ a: i, b: j, restLen: d });
    }
  }

  const restVolume = calcVolume(points, perimeterCount);
  const restOffsets = points.map(p => ({ x: p.x - cx, y: p.y - cy }));

  return {
    points,
    perimeterCount,
    springs,
    color,
    restVolume,
    restOffsets,
    gridX: cx,
    gridY: cy,
    isLocked,
    fallSpeed: isLocked ? 0 : 150,
    groupId
  };
}

// ============================================================================
// VOLUME CALCULATION
// ============================================================================

function calcVolume(points: Point[], count: number): number {
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    sum += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(sum) * 0.5;
}

// ============================================================================
// COLLISION DETECTION
// ============================================================================

function pointToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): {
  dist: number;
  closestX: number;
  closestY: number;
  t: number;
} {
  const ex = bx - ax;
  const ey = by - ay;
  const lenSq = ex * ex + ey * ey;

  if (lenSq < 0.0001) {
    const dx = px - ax;
    const dy = py - ay;
    return { dist: Math.sqrt(dx * dx + dy * dy), closestX: ax, closestY: ay, t: 0 };
  }

  let t = ((px - ax) * ex + (py - ay) * ey) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = ax + t * ex;
  const closestY = ay + t * ey;
  const dx = px - closestX;
  const dy = py - closestY;

  return { dist: Math.sqrt(dx * dx + dy * dy), closestX, closestY, t };
}

export function checkBodyCollision(bodyA: Body, bodyB: Body): void {
  const radius = COLLISION_RADIUS;
  const push = COLLISION_PUSH;

  // Check vertices of B against edges of A
  for (let vi = 0; vi < bodyB.perimeterCount; vi++) {
    const v = bodyB.points[vi];

    for (let ei = 0; ei < bodyA.perimeterCount; ei++) {
      const ej = (ei + 1) % bodyA.perimeterCount;
      const e1 = bodyA.points[ei];
      const e2 = bodyA.points[ej];

      const { dist, closestX, closestY, t } = pointToSegment(v.x, v.y, e1.x, e1.y, e2.x, e2.y);

      if (dist < radius && dist > 0.001) {
        const nx = (v.x - closestX) / dist;
        const ny = (v.y - closestY) / dist;
        const overlap = radius - dist;
        const pushDist = overlap * push;

        v.x += nx * pushDist * 0.6;
        v.y += ny * pushDist * 0.6;
        e1.x -= nx * pushDist * 0.4 * (1 - t);
        e1.y -= ny * pushDist * 0.4 * (1 - t);
        e2.x -= nx * pushDist * 0.4 * t;
        e2.y -= ny * pushDist * 0.4 * t;

        const relVn = (v.vx - (e1.vx * (1-t) + e2.vx * t)) * nx +
                      (v.vy - (e1.vy * (1-t) + e2.vy * t)) * ny;

        if (relVn < 0) {
          const dampFactor = 0.3;
          v.vx -= relVn * nx * dampFactor;
          v.vy -= relVn * ny * dampFactor;
          e1.vx += relVn * nx * dampFactor * (1 - t) * 0.5;
          e1.vy += relVn * ny * dampFactor * (1 - t) * 0.5;
          e2.vx += relVn * nx * dampFactor * t * 0.5;
          e2.vy += relVn * ny * dampFactor * t * 0.5;
        }
      }
    }
  }

  // Symmetric: check vertices of A against edges of B
  for (let vi = 0; vi < bodyA.perimeterCount; vi++) {
    const v = bodyA.points[vi];

    for (let ei = 0; ei < bodyB.perimeterCount; ei++) {
      const ej = (ei + 1) % bodyB.perimeterCount;
      const e1 = bodyB.points[ei];
      const e2 = bodyB.points[ej];

      const { dist, closestX, closestY, t } = pointToSegment(v.x, v.y, e1.x, e1.y, e2.x, e2.y);

      if (dist < radius && dist > 0.001) {
        const nx = (v.x - closestX) / dist;
        const ny = (v.y - closestY) / dist;
        const overlap = radius - dist;
        const pushDist = overlap * push;

        v.x += nx * pushDist * 0.6;
        v.y += ny * pushDist * 0.6;
        e1.x -= nx * pushDist * 0.4 * (1 - t);
        e1.y -= ny * pushDist * 0.4 * (1 - t);
        e2.x -= nx * pushDist * 0.4 * t;
        e2.y -= ny * pushDist * 0.4 * t;

        const relVn = (v.vx - (e1.vx * (1-t) + e2.vx * t)) * nx +
                      (v.vy - (e1.vy * (1-t) + e2.vy * t)) * ny;

        if (relVn < 0) {
          const dampFactor = 0.3;
          v.vx -= relVn * nx * dampFactor;
          v.vy -= relVn * ny * dampFactor;
          e1.vx += relVn * nx * dampFactor * (1 - t) * 0.5;
          e1.vy += relVn * ny * dampFactor * (1 - t) * 0.5;
          e2.vx += relVn * nx * dampFactor * t * 0.5;
          e2.vy += relVn * ny * dampFactor * t * 0.5;
        }
      }
    }
  }
}

// ============================================================================
// PHYSICS SIMULATION
// ============================================================================

/**
 * Free physics mode (for demo comparison)
 */
export function updateBodyFreePhysics(body: Body, dt: number, groundY: number): void {
  const { points, perimeterCount, springs, restVolume } = body;
  const n = points.length;

  const fx: number[] = new Array(n).fill(0);
  const fy: number[] = new Array(n).fill(0);

  // Gravity
  for (let i = 0; i < n; i++) {
    fy[i] += GRAVITY;
  }

  // Spring forces
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

  // Pressure force
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

  // Integrate
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

/**
 * Game-accurate physics:
 * - Locked bodies: anchored to gridPos, vertices jiggle but spring back
 * - X position is fixed (tank rotation handles horizontal movement)
 */
export function updateBodyGameAccurate(body: Body, dt: number): void {
  const { points, perimeterCount, springs, restVolume, restOffsets, isLocked } = body;
  const n = points.length;

  // Update grid position for falling bodies
  if (!isLocked) {
    body.fallSpeed = Math.min(body.fallSpeed + FALL_GRAVITY * dt, MAX_FALL_SPEED);
    body.gridY += body.fallSpeed * dt;
  }

  // Calculate target positions
  const targets = restOffsets.map(off => ({
    x: body.gridX + off.x,
    y: body.gridY + off.y
  }));

  const fx: number[] = new Array(n).fill(0);
  const fy: number[] = new Array(n).fill(0);

  // Anchor forces
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const target = targets[i];

    const dx = target.x - p.x;
    const dy = target.y - p.y;

    const stiffness = isLocked ? ANCHOR_STIFFNESS : ANCHOR_STIFFNESS * 0.5;

    fx[i] += stiffness * dx;
    fy[i] += stiffness * dy;
    fx[i] -= ANCHOR_DAMP * p.vx;
    fy[i] -= ANCHOR_DAMP * p.vy;
  }

  // Internal spring forces
  for (const spring of springs) {
    const pa = points[spring.a];
    const pb = points[spring.b];

    const dx = pb.x - pa.x;
    const dy = pb.y - pa.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    const stretch = dist - spring.restLen;

    const nx = dx / dist;
    const ny = dy / dist;

    const springF = (SPRING_K * 0.4) * stretch;
    const dvx = pb.vx - pa.vx;
    const dvy = pb.vy - pa.vy;
    const dampF = (SPRING_DAMP * 0.5) * (dvx * nx + dvy * ny);

    const totalF = springF + dampF;

    fx[spring.a] += totalF * nx;
    fy[spring.a] += totalF * ny;
    fx[spring.b] -= totalF * nx;
    fy[spring.b] -= totalF * ny;
  }

  // Pressure force
  const currentVolume = calcVolume(points, perimeterCount);
  const volumeRatio = restVolume / Math.max(currentVolume, 100);
  const pressure = (PRESSURE_K * 0.15) * (volumeRatio - 1);

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

  // Integrate
  for (let i = 0; i < n; i++) {
    const p = points[i];

    p.vx += fx[i] * dt;
    p.vy += fy[i] * dt;

    p.vx *= GLOBAL_DAMP;
    p.vy *= GLOBAL_DAMP;

    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

/**
 * Apply impulse to a body (for testing jiggle response)
 */
export function applyImpulse(body: Body, ix: number, iy: number): void {
  for (const p of body.points) {
    p.vx += ix;
    p.vy += iy;
  }
}

// ============================================================================
// RENDERING HELPERS
// ============================================================================

/**
 * Get wavy points for rendering (dual-wave undulation effect)
 */
export function getWavyPoints(
  points: Point[],
  count: number,
  time: number
): { x: number; y: number }[] {
  const result: { x: number; y: number }[] = [];

  for (let i = 0; i < count; i++) {
    const prev = (i - 1 + count) % count;
    const next = (i + 1) % count;

    // Calculate outward normal
    const e1x = points[i].x - points[prev].x;
    const e1y = points[i].y - points[prev].y;
    const e2x = points[next].x - points[i].x;
    const e2y = points[next].y - points[i].y;

    let nx = e1y + e2y;
    let ny = -(e1x + e2x);
    const len = Math.sqrt(nx * nx + ny * ny) || 1;
    nx /= len;
    ny /= len;

    // Dual sinusoidal waves
    const phase1 = i * WAVE1_PHASE_OFFSET;
    const phase2 = i * WAVE2_PHASE_OFFSET;
    const wave1 = Math.sin(time * WAVE1_SPEED * Math.PI * 2 + phase1);
    const wave2 = Math.sin(time * WAVE2_SPEED * Math.PI * 2 + phase2);
    const wave = (wave1 * 0.6 + wave2 * 0.4) * WAVE_AMPLITUDE;

    result.push({
      x: points[i].x + nx * wave,
      y: points[i].y + ny * wave
    });
  }

  return result;
}

/**
 * Create Bezier curve path from points
 */
export function createBezierPath(points: { x: number; y: number }[], count: number): string {
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

// ============================================================================
// MAIN RENDERER CLASS
// ============================================================================

export class SoftBodyRenderer {
  private bodies: Map<string, Body> = new Map();
  private time: number = 0;

  /**
   * Create/update bodies from game goop groups
   * @param groups Map of groupId -> group info
   * @param cellSize Size of each cell in pixels
   * @param offsetX X offset for positioning
   * @param offsetY Y offset for positioning
   */
  updateFromGroups(
    groups: Map<string, GoopGroupInfo>,
    cellSize: number,
    offsetX: number = 0,
    offsetY: number = 0
  ): void {
    // Remove bodies for groups that no longer exist
    for (const groupId of this.bodies.keys()) {
      if (!groups.has(groupId)) {
        this.bodies.delete(groupId);
      }
    }

    // Add/update bodies for current groups
    for (const [groupId, group] of groups) {
      if (!this.bodies.has(groupId)) {
        // Create new body
        try {
          const perimeter = extractPerimeter(group.cells, cellSize, offsetX, offsetY);
          if (perimeter.length >= 3) {
            const body = createBodyFromPerimeter(perimeter, group.color, groupId, true);
            this.bodies.set(groupId, body);
          }
        } catch {
          // Skip invalid groups (too few cells, etc.)
        }
      } else {
        // Update existing body's color if changed
        const body = this.bodies.get(groupId)!;
        body.color = group.color;
      }
    }
  }

  /**
   * Physics tick - call from game loop
   */
  tick(dt: number): void {
    this.time += dt;

    // Update all bodies
    for (const body of this.bodies.values()) {
      updateBodyGameAccurate(body, dt);
    }

    // Body-to-body collisions (optional, expensive for many bodies)
    const bodyArray = Array.from(this.bodies.values());
    for (let i = 0; i < bodyArray.length; i++) {
      for (let j = i + 1; j < bodyArray.length; j++) {
        checkBodyCollision(bodyArray[i], bodyArray[j]);
      }
    }
  }

  /**
   * Get SVG path data for a body
   */
  getBodyPath(body: Body): string {
    const wavyPts = getWavyPoints(body.points, body.perimeterCount, this.time);
    return createBezierPath(wavyPts, body.perimeterCount);
  }

  /**
   * Get all bodies for iteration
   */
  getBodies(): Body[] {
    return Array.from(this.bodies.values());
  }

  /**
   * Get a specific body by group ID
   */
  getBody(groupId: string): Body | undefined {
    return this.bodies.get(groupId);
  }

  /**
   * Apply impulse to a specific body
   */
  impulseBody(groupId: string, ix: number, iy: number): void {
    const body = this.bodies.get(groupId);
    if (body) {
      applyImpulse(body, ix, iy);
    }
  }

  /**
   * Apply impulse to all bodies (e.g., on tank rotation)
   */
  impulseAll(ix: number, iy: number): void {
    for (const body of this.bodies.values()) {
      applyImpulse(body, ix, iy);
    }
  }

  /**
   * Clear all bodies
   */
  clear(): void {
    this.bodies.clear();
    this.time = 0;
  }

  /**
   * Get current time (for external wave sync)
   */
  getTime(): number {
    return this.time;
  }
}

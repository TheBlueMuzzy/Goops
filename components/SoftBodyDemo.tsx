/**
 * Soft Body Demo v14 - Grid-Locked Mode
 *
 * Features:
 * - Hub & spoke structure with cross springs
 * - Dual-wave edge undulation for gloopy feel
 * - Grid-to-mesh generation (extractPerimeter, createBodyFromPerimeter)
 * - Test shapes: T, L, square, line
 * - NEW: Grid-locked mode (bodies stay anchored, only jiggle)
 * - NEW: Free physics mode (bodies fall, collide, tumble)
 * - NEW: Poke button to test jiggle response
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

// Body-to-body collision tuning (gentle values to prevent explosion)
const COLLISION_RADIUS = 5;        // Proximity threshold - vertices closer than this collide
const COLLISION_PUSH = 0.35;       // How much to push apart (0-1, lower = softer)

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
  // Grid-locked mode: store rest positions to anchor shape
  restPositions?: { x: number; y: number }[];
  anchorY?: number;     // Y position where body is "locked" to grid
}

// --- Grid-to-Mesh Generation ---

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
function extractPerimeter(
  cells: Set<string>,
  cellSize: number,
  offsetX: number = 0,
  offsetY: number = 0
): Point[] {
  if (cells.size === 0) return [];

  // Edge representation: "x1,y1-x2,y2" where (x1,y1) and (x2,y2) are corners
  // We'll store edges as start→end in clockwise order around cells
  interface Edge {
    x1: number; y1: number;
    x2: number; y2: number;
  }

  const perimeterEdges: Edge[] = [];

  // For each cell, check each of the 4 edges
  // If the adjacent cell in that direction is NOT in the set, it's a perimeter edge
  for (const cellKey of cells) {
    const [cx, cy] = cellKey.split(',').map(Number);

    // Cell corners (in pixel space):
    // topLeft = (cx * cellSize, cy * cellSize)
    // topRight = ((cx+1) * cellSize, cy * cellSize)
    // bottomRight = ((cx+1) * cellSize, (cy+1) * cellSize)
    // bottomLeft = (cx * cellSize, (cy+1) * cellSize)

    const left = cx * cellSize + offsetX;
    const right = (cx + 1) * cellSize + offsetX;
    const top = cy * cellSize + offsetY;
    const bottom = (cy + 1) * cellSize + offsetY;

    // Top edge: if cell above (cx, cy-1) is not in set
    if (!cells.has(`${cx},${cy - 1}`)) {
      // Clockwise around cell: top edge goes left→right
      perimeterEdges.push({ x1: left, y1: top, x2: right, y2: top });
    }

    // Right edge: if cell to right (cx+1, cy) is not in set
    if (!cells.has(`${cx + 1},${cy}`)) {
      // Clockwise: right edge goes top→bottom
      perimeterEdges.push({ x1: right, y1: top, x2: right, y2: bottom });
    }

    // Bottom edge: if cell below (cx, cy+1) is not in set
    if (!cells.has(`${cx},${cy + 1}`)) {
      // Clockwise: bottom edge goes right→left
      perimeterEdges.push({ x1: right, y1: bottom, x2: left, y2: bottom });
    }

    // Left edge: if cell to left (cx-1, cy) is not in set
    if (!cells.has(`${cx - 1},${cy}`)) {
      // Clockwise: left edge goes bottom→top
      perimeterEdges.push({ x1: left, y1: bottom, x2: left, y2: top });
    }
  }

  if (perimeterEdges.length === 0) return [];

  // Order edges into a continuous polygon by chaining end→start
  const orderedEdges: Edge[] = [];
  const usedEdges = new Set<number>();

  // Start with the first edge
  orderedEdges.push(perimeterEdges[0]);
  usedEdges.add(0);

  while (orderedEdges.length < perimeterEdges.length) {
    const lastEdge = orderedEdges[orderedEdges.length - 1];
    let foundNext = false;

    // Find an edge that starts where the last edge ends
    for (let i = 0; i < perimeterEdges.length; i++) {
      if (usedEdges.has(i)) continue;
      const candidate = perimeterEdges[i];

      // Check if this edge starts where last edge ends (with small tolerance for floating point)
      if (Math.abs(candidate.x1 - lastEdge.x2) < 0.01 &&
          Math.abs(candidate.y1 - lastEdge.y2) < 0.01) {
        orderedEdges.push(candidate);
        usedEdges.add(i);
        foundNext = true;
        break;
      }
    }

    if (!foundNext) {
      // If we can't find a continuing edge, the shape might have holes or be disconnected
      // For now, just break and use what we have
      break;
    }
  }

  // Extract vertices from ordered edges (just the start points, since end of one = start of next)
  const vertices: { x: number; y: number }[] = orderedEdges.map(e => ({ x: e.x1, y: e.y1 }));

  // Subdivide long edges to get smoother curves
  // Target ~15-20px spacing between vertices
  const TARGET_SPACING = 18;
  const subdividedVertices: { x: number; y: number }[] = [];

  for (let i = 0; i < vertices.length; i++) {
    const curr = vertices[i];
    const next = vertices[(i + 1) % vertices.length];

    subdividedVertices.push(curr);

    const dx = next.x - curr.x;
    const dy = next.y - curr.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // How many subdivisions needed?
    const subdivisions = Math.floor(dist / TARGET_SPACING);

    for (let s = 1; s <= subdivisions; s++) {
      const t = s / (subdivisions + 1);
      subdividedVertices.push({
        x: curr.x + dx * t,
        y: curr.y + dy * t
      });
    }
  }

  // Convert to Point format with zero velocity
  return subdividedVertices.map(v => ({
    x: v.x,
    y: v.y,
    vx: 0,
    vy: 0
  }));
}

/**
 * Create a complete Body from perimeter vertices.
 * Adds hub point at centroid, creates all spring connections.
 *
 * @param perimeter Array of perimeter points
 * @param color Body color
 * @returns Complete Body with physics springs
 */
function createBodyFromPerimeter(perimeter: Point[], color: string): Body {
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

  // All points: perimeter + hub
  const points = [...perimeter, hub];
  const hubIndex = perimeterCount;

  // Create springs
  const springs: Spring[] = [];

  // Helper to calculate distance between two points
  const dist = (i: number, j: number) => {
    const dx = points[j].x - points[i].x;
    const dy = points[j].y - points[i].y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 1. Adjacent perimeter springs (connect consecutive points)
  for (let i = 0; i < perimeterCount; i++) {
    const j = (i + 1) % perimeterCount;
    const d = dist(i, j);
    if (d > 5) { // Skip very short springs that cause instability
      springs.push({ a: i, b: j, restLen: d });
    }
  }

  // 2. Spoke springs (hub to each perimeter point)
  for (let i = 0; i < perimeterCount; i++) {
    const d = dist(hubIndex, i);
    if (d > 5) {
      springs.push({ a: hubIndex, b: i, restLen: d });
    }
  }

  // 3. Skip-2 springs (structural cross-bracing)
  for (let i = 0; i < perimeterCount; i++) {
    const j = (i + 2) % perimeterCount;
    const d = dist(i, j);
    if (d > 5) {
      springs.push({ a: i, b: j, restLen: d });
    }
  }

  // 4. Skip-4 springs for extra rigidity (only if enough points)
  if (perimeterCount > 8) {
    for (let i = 0; i < perimeterCount; i++) {
      const j = (i + 4) % perimeterCount;
      const d = dist(i, j);
      if (d > 5) {
        springs.push({ a: i, b: j, restLen: d });
      }
    }
  }

  // Calculate rest volume using shoelace formula
  const restVolume = calcVolume(points, perimeterCount);

  // Store rest positions for grid-locked mode
  const restPositions = points.map(p => ({ x: p.x, y: p.y }));

  return { points, perimeterCount, springs, color, restVolume, restPositions };
}

/**
 * Helper: Create a cell set for common test shapes
 */
function createTestCells(shape: 'T' | 'L' | 'square' | 'line'): Set<string> {
  const cells = new Set<string>();

  switch (shape) {
    case 'T':
      // T-shape:
      //  XXX
      //   X
      cells.add('0,0');
      cells.add('1,0');
      cells.add('2,0');
      cells.add('1,1');
      break;
    case 'L':
      // L-shape:
      //  X
      //  X
      //  XX
      cells.add('0,0');
      cells.add('0,1');
      cells.add('0,2');
      cells.add('1,2');
      break;
    case 'square':
      // 2x2 square
      cells.add('0,0');
      cells.add('1,0');
      cells.add('0,1');
      cells.add('1,1');
      break;
    case 'line':
      // Vertical line
      cells.add('0,0');
      cells.add('0,1');
      cells.add('0,2');
      cells.add('0,3');
      break;
  }

  return cells;
}

// --- Legacy Geometry (for comparison) ---

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

// --- Collision Detection (Simple proximity-based) ---

// Check distance from point to line segment, return closest point info
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
    // Degenerate edge
    const dx = px - ax;
    const dy = py - ay;
    return { dist: Math.sqrt(dx * dx + dy * dy), closestX: ax, closestY: ay, t: 0 };
  }

  // Project point onto line, clamp to segment
  let t = ((px - ax) * ex + (py - ay) * ey) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = ax + t * ex;
  const closestY = ay + t * ey;
  const dx = px - closestX;
  const dy = py - closestY;

  return { dist: Math.sqrt(dx * dx + dy * dy), closestX, closestY, t };
}

// Simple proximity collision: push vertices apart if they get too close to edges
function checkBodyCollision(bodyA: Body, bodyB: Body): void {
  const radius = COLLISION_RADIUS;
  const push = COLLISION_PUSH;

  // Check each vertex of B against each edge of A
  for (let vi = 0; vi < bodyB.perimeterCount; vi++) {
    const v = bodyB.points[vi];

    for (let ei = 0; ei < bodyA.perimeterCount; ei++) {
      const ej = (ei + 1) % bodyA.perimeterCount;
      const e1 = bodyA.points[ei];
      const e2 = bodyA.points[ej];

      const { dist, closestX, closestY, t } = pointToSegment(v.x, v.y, e1.x, e1.y, e2.x, e2.y);

      if (dist < radius && dist > 0.001) {
        // Compute push direction (from edge toward vertex)
        const nx = (v.x - closestX) / dist;
        const ny = (v.y - closestY) / dist;

        // How much penetration
        const overlap = radius - dist;
        const pushDist = overlap * push;

        // Push vertex out
        v.x += nx * pushDist * 0.6;
        v.y += ny * pushDist * 0.6;

        // Push edge points in (opposite direction), weighted by t
        e1.x -= nx * pushDist * 0.4 * (1 - t);
        e1.y -= ny * pushDist * 0.4 * (1 - t);
        e2.x -= nx * pushDist * 0.4 * t;
        e2.y -= ny * pushDist * 0.4 * t;

        // Also dampen relative velocity to prevent bouncing
        const relVn = (v.vx - (e1.vx * (1-t) + e2.vx * t)) * nx +
                      (v.vy - (e1.vy * (1-t) + e2.vy * t)) * ny;

        if (relVn < 0) {
          // Approaching - dampen
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

  // Check each vertex of A against each edge of B (symmetric)
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

// Grid-locked physics: body stays anchored, only jiggle allowed
const ANCHOR_STIFFNESS = 800;   // How strongly vertices are pulled to rest position
const ANCHOR_DAMP = 25;         // Damping on anchor springs

function updateBodyGridLocked(body: Body, dt: number): void {
  const { points, perimeterCount, springs, restVolume, restPositions } = body;
  if (!restPositions) return; // Need rest positions for grid-locked mode

  const n = points.length;
  const fx: number[] = new Array(n).fill(0);
  const fy: number[] = new Array(n).fill(0);

  // 1. Anchor forces - pull each point toward its rest position
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const rest = restPositions[i];

    const dx = rest.x - p.x;
    const dy = rest.y - p.y;

    // Spring force toward rest position
    fx[i] += ANCHOR_STIFFNESS * dx;
    fy[i] += ANCHOR_STIFFNESS * dy;

    // Damping
    fx[i] -= ANCHOR_DAMP * p.vx;
    fy[i] -= ANCHOR_DAMP * p.vy;
  }

  // 2. Internal spring forces (for soft body deformation)
  for (const spring of springs) {
    const pa = points[spring.a];
    const pb = points[spring.b];

    const dx = pb.x - pa.x;
    const dy = pb.y - pa.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    const stretch = dist - spring.restLen;

    const nx = dx / dist;
    const ny = dy / dist;

    // Softer springs for grid-locked mode (let anchor do most work)
    const springF = (SPRING_K * 0.3) * stretch;
    const dvx = pb.vx - pa.vx;
    const dvy = pb.vy - pa.vy;
    const dampF = (SPRING_DAMP * 0.5) * (dvx * nx + dvy * ny);

    const totalF = springF + dampF;

    fx[spring.a] += totalF * nx;
    fy[spring.a] += totalF * ny;
    fx[spring.b] -= totalF * nx;
    fy[spring.b] -= totalF * ny;
  }

  // 3. Pressure force (reduced for grid-locked, just for subtle puffiness)
  const currentVolume = calcVolume(points, perimeterCount);
  const volumeRatio = restVolume / Math.max(currentVolume, 100);
  const pressure = (PRESSURE_K * 0.2) * (volumeRatio - 1);

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
  }
}

// Apply an impulse to a body (for testing jiggle response)
function applyImpulse(body: Body, ix: number, iy: number): void {
  for (const p of body.points) {
    p.vx += ix;
    p.vy += iy;
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

// Shape types for the demo
type ShapeType = 'T' | 'L' | 'square' | 'line' | 'legacy';

/**
 * Create a body from a shape type using the new grid-to-mesh generation
 */
function createGeneratedBody(shape: ShapeType, offsetX: number, offsetY: number, color: string): Body {
  if (shape === 'legacy') {
    // Use original hardcoded T-shape for comparison
    return createBody(offsetX, offsetY, color);
  }

  const cells = createTestCells(shape as 'T' | 'L' | 'square' | 'line');
  const perimeter = extractPerimeter(cells, CELL_SIZE, offsetX, offsetY);
  return createBodyFromPerimeter(perimeter, color);
}

// --- Component ---
export const SoftBodyDemo: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showVerts, setShowVerts] = useState(false);
  const [showSprings, setShowSprings] = useState(false);
  const [bottomShape, setBottomShape] = useState<ShapeType>('T');
  const [fallingShape, setFallingShape] = useState<ShapeType>('L');
  const [gridLocked, setGridLocked] = useState(true); // Default to grid-locked mode

  const bodiesRef = useRef<{ bottom: Body; falling: Body } | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Create bodies with current shapes
  const createBodies = useCallback((bShape: ShapeType, fShape: ShapeType) => {
    const centerX = 3 * CELL_SIZE;
    // Position bodies so they don't overlap (especially important for grid-locked mode)
    // Bottom body at row 6-7, falling body at row 2-3
    return {
      bottom: createGeneratedBody(bShape, centerX, 6 * CELL_SIZE, COLOR_BOTTOM),
      falling: createGeneratedBody(fShape, centerX, 2 * CELL_SIZE, COLOR_FALLING)
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

  // Change bottom shape
  const changeBottomShape = useCallback((shape: ShapeType) => {
    setBottomShape(shape);
    const centerX = 3 * CELL_SIZE;
    if (bodiesRef.current) {
      bodiesRef.current.bottom = createGeneratedBody(shape, centerX, 6 * CELL_SIZE, COLOR_BOTTOM);
    }
    setTick(t => t + 1);
  }, []);

  // Change falling shape
  const changeFallingShape = useCallback((shape: ShapeType) => {
    setFallingShape(shape);
    const centerX = 3 * CELL_SIZE;
    if (bodiesRef.current) {
      bodiesRef.current.falling = createGeneratedBody(shape, centerX, 2 * CELL_SIZE, COLOR_FALLING);
    }
    setTick(t => t + 1);
  }, []);

  // Poke bodies to test jiggle
  const pokeBodies = useCallback(() => {
    if (bodiesRef.current) {
      // Apply random impulse to both bodies
      applyImpulse(bodiesRef.current.bottom, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
      applyImpulse(bodiesRef.current.falling, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
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
          if (gridLocked) {
            // Grid-locked mode: bodies stay anchored, only jiggle
            updateBodyGridLocked(bodiesRef.current.falling, subDt);
            updateBodyGridLocked(bodiesRef.current.bottom, subDt);
            // No body-to-body collision in grid-locked (grid handles that)
          } else {
            // Free physics mode: full simulation
            updateBody(bodiesRef.current.falling, subDt, PANEL_H);
            updateBody(bodiesRef.current.bottom, subDt, PANEL_H);
            checkBodyCollision(bodiesRef.current.bottom, bodiesRef.current.falling);
          }
        }

        timeRef.current += dt;
        setTick(t => t + 1);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [paused, gridLocked]);

  const bodies = bodiesRef.current;
  const fallingVol = bodies ? (calcVolume(bodies.falling.points, bodies.falling.perimeterCount) / bodies.falling.restVolume * 100).toFixed(0) : '?';

  const shapes: ShapeType[] = ['T', 'L', 'square', 'line', 'legacy'];

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-200 flex flex-col items-center p-4">
      <div className="flex items-center gap-2 mb-2 flex-wrap justify-center">
        <button onClick={onBack} className="px-3 py-1.5 bg-slate-800 rounded text-sm">← Back</button>
        <h1 className="text-lg font-bold">Soft Body v14</h1>
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
          onClick={() => setGridLocked(g => !g)}
          className={`px-2 py-1 rounded text-xs ${gridLocked ? 'bg-green-700' : 'bg-orange-700'}`}
        >
          {gridLocked ? 'Grid-Locked' : 'Free Physics'}
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
        <p><strong>v14:</strong> Grid-locked mode for game integration.</p>
        <p><span className="text-green-400">Grid-Locked:</span> Bodies stay anchored, only jiggle (like actual game).</p>
        <p><span className="text-orange-400">Free Physics:</span> Bodies fall, tumble, collide (for testing).</p>
        <p className="text-slate-500">Click "Poke!" to test jiggle response.</p>
      </div>
    </div>
  );
};

export default SoftBodyDemo;

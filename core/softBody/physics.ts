// ============================================================================
// Soft-Body Verlet Physics Engine
// Ported from prototypes/SoftBodyProto9.tsx (lines 750-950)
// ============================================================================

import {
  SoftBlob,
  PhysicsParams,
  Vertex,
  Spring,
  Vec2,
  rotatePoint,
  vecLength,
} from './types';

// =============================================================================
// Integration (Verlet)
// =============================================================================

/**
 * Verlet integration step - updates positions based on velocity and gravity.
 * Applies different damping for locked vs falling blobs.
 */
export function integrate(
  blobs: SoftBlob[],
  dt: number,
  params: PhysicsParams
): void {
  // Cap dt at 33ms for stability (prevents explosion on lag spikes)
  const cappedDt = Math.min(dt, 0.033);

  for (const blob of blobs) {
    // Locked blobs are more viscous (slower, honey-like)
    const effectiveDamping = blob.isLocked
      ? params.damping / params.viscosity
      : params.damping;

    // Update outer vertices
    for (const v of blob.vertices) {
      const vx = (v.pos.x - v.oldPos.x) * effectiveDamping;
      const vy = (v.pos.y - v.oldPos.y) * effectiveDamping;

      v.oldPos.x = v.pos.x;
      v.oldPos.y = v.pos.y;

      v.pos.x += vx;
      v.pos.y += vy + params.gravity * cappedDt * cappedDt;
    }

    // Update inner vertices (same logic)
    for (const v of blob.innerVertices) {
      const vx = (v.pos.x - v.oldPos.x) * effectiveDamping;
      const vy = (v.pos.y - v.oldPos.y) * effectiveDamping;

      v.oldPos.x = v.pos.x;
      v.oldPos.y = v.pos.y;

      v.pos.x += vx;
      v.pos.y += vy + params.gravity * cappedDt * cappedDt;
    }
  }
}

// =============================================================================
// Home Force (Shape Retention)
// =============================================================================

/**
 * Applies force pulling vertices toward their home positions.
 * Locked blobs use viscosity for honey-like movement, falling blobs snap back quickly.
 */
export function applyHomeForce(
  blobs: SoftBlob[],
  params: PhysicsParams
): void {
  for (const blob of blobs) {
    // Speed multiplier: locked blobs return slower (squared for finer control at low values)
    // Falling blobs use full speed to keep up with grid position changes
    const speedMult = blob.isLocked
      ? params.returnSpeed * params.returnSpeed
      : 1.0;

    // Viscosity: converts instant position correction into gradual velocity-based movement
    // 0 = normal (position-based, snappy)
    // 1+ = full viscosity (velocity-based, honey-like slow return)
    const viscosity = blob.isLocked ? params.viscosity : 0;
    const positionFactor = Math.max(0, 1 - viscosity);
    const velocityFactor = viscosity > 0 ? 0.03 / Math.max(1, viscosity) : 0;

    // Apply to outer vertices
    for (const v of blob.vertices) {
      const rotatedHome = rotatePoint(v.homeOffset, blob.rotation);
      const targetX = blob.targetX + rotatedHome.x;
      const targetY = blob.targetY + rotatedHome.y;

      const dx = targetX - v.pos.x;
      const dy = targetY - v.pos.y;

      const forceX = dx * params.homeStiffness * speedMult;
      const forceY = dy * params.homeStiffness * speedMult;

      // Position correction (instant, jello-like)
      v.pos.x += forceX * positionFactor;
      v.pos.y += forceY * positionFactor;

      // Velocity correction (gradual, honey-like) - adjusting oldPos adds velocity
      if (viscosity > 0) {
        v.oldPos.x -= forceX * velocityFactor;
        v.oldPos.y -= forceY * velocityFactor;
      }
    }

    // Apply to inner vertices (with higher stiffness for stability)
    const innerStiffness = params.homeStiffness * 10; // Inner vertices are more stable
    for (const v of blob.innerVertices) {
      const rotatedHome = rotatePoint(v.homeOffset, blob.rotation);
      const targetX = blob.targetX + rotatedHome.x;
      const targetY = blob.targetY + rotatedHome.y;

      const dx = targetX - v.pos.x;
      const dy = targetY - v.pos.y;

      const forceX = dx * innerStiffness * speedMult;
      const forceY = dy * innerStiffness * speedMult;

      v.pos.x += forceX * positionFactor;
      v.pos.y += forceY * positionFactor;

      if (viscosity > 0) {
        v.oldPos.x -= forceX * velocityFactor;
        v.oldPos.y -= forceY * velocityFactor;
      }
    }
  }
}

// =============================================================================
// Spring Constraint Solving
// =============================================================================

/**
 * Solves a single spring constraint between two vertices.
 * Moves vertices toward satisfying the rest length.
 */
function solveSpring(
  vertices: Vertex[],
  spring: Spring,
  strength: number
): void {
  const a = vertices[spring.a];
  const b = vertices[spring.b];

  const dx = b.pos.x - a.pos.x;
  const dy = b.pos.y - a.pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Avoid division by zero
  if (dist < 0.0001) return;

  const error = (dist - spring.restLength) / dist;
  const correction = error * strength * 0.5;

  a.pos.x += dx * correction;
  a.pos.y += dy * correction;
  b.pos.x -= dx * correction;
  b.pos.y -= dy * correction;
}

/**
 * Iteratively solves all spring constraints.
 * Ring springs (perimeter) are stiffer than cross springs (structural).
 */
export function solveConstraints(
  blobs: SoftBlob[],
  params: PhysicsParams
): void {
  for (let iter = 0; iter < params.iterations; iter++) {
    for (const blob of blobs) {
      // Ring springs (perimeter) - stiffness * 0.01
      for (const spring of blob.ringsprings) {
        solveSpring(blob.vertices, spring, params.stiffness * 0.01);
      }
      // Cross springs (structural) - stiffness * 0.005
      for (const spring of blob.crossSprings) {
        solveSpring(blob.vertices, spring, params.stiffness * 0.005);
      }
    }
  }
}

// =============================================================================
// Pressure (Volume Maintenance)
// =============================================================================

/**
 * Applies radial pressure to maintain blob shape.
 * Only applies to locked blobs - falling blobs don't need pressure.
 */
export function applyPressure(
  blobs: SoftBlob[],
  params: PhysicsParams
): void {
  for (const blob of blobs) {
    // Only locked blobs get pressure
    if (!blob.isLocked) continue;

    // Calculate current centroid
    let cx = 0;
    let cy = 0;
    for (const v of blob.vertices) {
      cx += v.pos.x;
      cy += v.pos.y;
    }
    cx /= blob.vertices.length;
    cy /= blob.vertices.length;

    // Calculate average rest distance from home offsets
    const restDist =
      blob.vertices.reduce((sum, v) => sum + vecLength(v.homeOffset), 0) /
      blob.vertices.length;

    const pressureStrength = params.pressure * 0.002;

    // Apply radial pressure to each vertex
    for (const v of blob.vertices) {
      const dx = v.pos.x - cx;
      const dy = v.pos.y - cy;
      const currentDist = Math.sqrt(dx * dx + dy * dy);

      if (currentDist > 0.0001 && restDist > 0.0001) {
        // Error: positive if compressed (need to push out), negative if stretched
        const error = restDist - currentDist;
        const force = error * pressureStrength;

        v.pos.x += (dx / currentDist) * force;
        v.pos.y += (dy / currentDist) * force;
      }
    }
  }
}

// =============================================================================
// Boundary Constraints
// =============================================================================

/**
 * Boundary configuration for the physics simulation
 */
export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Keeps vertices inside the specified boundaries.
 * Vertices are clamped and their velocity is dampened on contact.
 */
export function applyBoundaryConstraints(
  blobs: SoftBlob[],
  bounds: Bounds
): void {
  const MARGIN = 2; // Small margin so vertices don't sit exactly on the edge
  const BOUNDARY_DAMPING = 0.3; // How much to dampen velocity on contact

  for (const blob of blobs) {
    // Constrain outer vertices
    for (const v of blob.vertices) {
      constrainVertex(v, bounds, MARGIN, BOUNDARY_DAMPING);
    }

    // Constrain inner vertices
    for (const v of blob.innerVertices) {
      constrainVertex(v, bounds, MARGIN, BOUNDARY_DAMPING);
    }
  }
}

/**
 * Helper function to constrain a single vertex to bounds
 */
function constrainVertex(
  v: Vertex,
  bounds: Bounds,
  margin: number,
  damping: number
): void {
  // Left wall
  if (v.pos.x < bounds.minX + margin) {
    v.pos.x = bounds.minX + margin;
    const vx = v.pos.x - v.oldPos.x;
    v.oldPos.x = v.pos.x - vx * damping;
  }
  // Right wall
  if (v.pos.x > bounds.maxX - margin) {
    v.pos.x = bounds.maxX - margin;
    const vx = v.pos.x - v.oldPos.x;
    v.oldPos.x = v.pos.x - vx * damping;
  }
  // Top wall
  if (v.pos.y < bounds.minY + margin) {
    v.pos.y = bounds.minY + margin;
    const vy = v.pos.y - v.oldPos.y;
    v.oldPos.y = v.pos.y - vy * damping;
  }
  // Floor
  if (v.pos.y > bounds.maxY - margin) {
    v.pos.y = bounds.maxY - margin;
    const vy = v.pos.y - v.oldPos.y;
    v.oldPos.y = v.pos.y - vy * damping;
  }
}

// =============================================================================
// Main Physics Step
// =============================================================================

/**
 * Runs one complete physics step:
 * 1. Integration (Verlet with gravity)
 * 2. Home force (shape retention)
 * 3. Spring constraints (structural integrity)
 * 4. Pressure (volume maintenance for locked blobs)
 * 5. Boundary constraints (keep inside container)
 */
export function stepPhysics(
  blobs: SoftBlob[],
  dt: number,
  params: PhysicsParams,
  bounds: Bounds
): void {
  integrate(blobs, dt, params);
  applyHomeForce(blobs, params);
  solveConstraints(blobs, params);
  applyPressure(blobs, params);
  applyBoundaryConstraints(blobs, bounds);
}

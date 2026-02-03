// ============================================================================
// Soft-Body Physics Hook
// Manages blob lifecycle and physics integration for game use
// ============================================================================

import { useRef, useCallback, useEffect } from 'react';
import {
  SoftBlob,
  PhysicsParams,
  DEFAULT_PHYSICS,
  Vec2,
} from '../core/softBody/types';
import { stepPhysics, Bounds } from '../core/softBody/physics';
import {
  createBlobFromCells,
  PHYSICS_GRID_OFFSET,
  PHYSICS_CELL_SIZE,
} from '../core/softBody/blobFactory';

// =============================================================================
// Types
// =============================================================================

export interface UseSoftBodyPhysicsOptions {
  /** Whether physics simulation is active */
  enabled: boolean;
  /** Optional physics parameter overrides */
  params?: Partial<PhysicsParams>;
  /** Optional boundary constraints */
  bounds?: Bounds;
}

export interface UseSoftBodyPhysicsReturn {
  /** Current array of blobs (mutable ref - read-only for rendering) */
  blobs: SoftBlob[];
  /** Create a new blob from grid cells */
  createBlob: (
    cells: Vec2[],
    color: string,
    id: string,
    isLocked: boolean
  ) => SoftBlob;
  /** Remove a blob by ID */
  removeBlob: (id: string) => void;
  /** Update a blob's target position */
  updateBlobTarget: (id: string, targetX: number, targetY: number) => void;
  /** Lock a blob in place (transitions from falling to locked state) */
  lockBlob: (id: string) => void;
  /** Run one physics step (call from game loop) */
  step: (dt: number) => void;
  /** Clear all blobs */
  clearBlobs: () => void;
  /** Get a blob by ID */
  getBlob: (id: string) => SoftBlob | undefined;
}

// =============================================================================
// Default Bounds
// =============================================================================

/**
 * Default physics bounds based on game grid dimensions.
 * Viewport is 12 columns x 16 rows.
 */
function getDefaultBounds(): Bounds {
  return {
    minX: PHYSICS_GRID_OFFSET.x,
    maxX: PHYSICS_GRID_OFFSET.x + 12 * PHYSICS_CELL_SIZE,
    minY: PHYSICS_GRID_OFFSET.y,
    maxY: PHYSICS_GRID_OFFSET.y + 16 * PHYSICS_CELL_SIZE,
  };
}

// =============================================================================
// Hook
// =============================================================================

/**
 * React hook for managing soft-body physics simulation.
 *
 * Uses refs for mutable state to avoid re-renders on every physics tick.
 * The step() function should be called from the game's animation loop.
 *
 * @example
 * ```tsx
 * const { blobs, createBlob, step } = useSoftBodyPhysics({ enabled: true });
 *
 * // In game loop:
 * useEffect(() => {
 *   const animate = () => {
 *     step(0.016);
 *     requestAnimationFrame(animate);
 *   };
 *   requestAnimationFrame(animate);
 * }, [step]);
 *
 * // Create a blob:
 * createBlob([{x: 0, y: 0}], '#ff0000', 'blob-1', false);
 * ```
 */
export function useSoftBodyPhysics(
  options: UseSoftBodyPhysicsOptions
): UseSoftBodyPhysicsReturn {
  const { enabled, params: paramOverrides, bounds } = options;

  // Mutable blob array (avoids re-renders on physics ticks)
  const blobsRef = useRef<SoftBlob[]>([]);

  // Physics parameters (merged with defaults)
  const paramsRef = useRef<PhysicsParams>({
    ...DEFAULT_PHYSICS,
    ...paramOverrides,
  });

  // Boundary constraints
  const boundsRef = useRef<Bounds>(bounds ?? getDefaultBounds());

  // Update params if they change
  useEffect(() => {
    paramsRef.current = { ...DEFAULT_PHYSICS, ...paramOverrides };
  }, [paramOverrides]);

  // Update bounds if they change
  useEffect(() => {
    if (bounds) {
      boundsRef.current = bounds;
    }
  }, [bounds]);

  /**
   * Create a new blob from grid cells and add to simulation.
   */
  const createBlob = useCallback(
    (
      cells: Vec2[],
      color: string,
      id: string,
      isLocked: boolean
    ): SoftBlob => {
      const blob = createBlobFromCells(cells, color, id, isLocked);
      blobsRef.current = [...blobsRef.current, blob];
      return blob;
    },
    []
  );

  /**
   * Remove a blob by ID.
   */
  const removeBlob = useCallback((id: string) => {
    blobsRef.current = blobsRef.current.filter((b) => b.id !== id);
  }, []);

  /**
   * Update a blob's target position (for following game state).
   */
  const updateBlobTarget = useCallback(
    (id: string, targetX: number, targetY: number) => {
      const blob = blobsRef.current.find((b) => b.id === id);
      if (blob) {
        blob.targetX = targetX;
        blob.targetY = targetY;
      }
    },
    []
  );

  /**
   * Lock a blob in place (transition from falling to locked state).
   * Starts the fill animation.
   */
  const lockBlob = useCallback((id: string) => {
    const blob = blobsRef.current.find((b) => b.id === id);
    if (blob) {
      blob.isLocked = true;
      blob.fillAmount = 0; // Start fill animation
    }
  }, []);

  /**
   * Run one physics simulation step.
   * Should be called from the game's animation loop.
   *
   * @param dt - Delta time in seconds (capped at 33ms for stability)
   */
  const step = useCallback(
    (dt: number) => {
      if (!enabled || blobsRef.current.length === 0) return;
      stepPhysics(blobsRef.current, dt, paramsRef.current, boundsRef.current);
    },
    [enabled]
  );

  /**
   * Clear all blobs from the simulation.
   */
  const clearBlobs = useCallback(() => {
    blobsRef.current = [];
  }, []);

  /**
   * Get a blob by ID.
   */
  const getBlob = useCallback((id: string): SoftBlob | undefined => {
    return blobsRef.current.find((b) => b.id === id);
  }, []);

  return {
    blobs: blobsRef.current,
    createBlob,
    removeBlob,
    updateBlobTarget,
    lockBlob,
    step,
    clearBlobs,
    getBlob,
  };
}

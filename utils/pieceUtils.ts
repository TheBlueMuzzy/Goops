// Piece utility functions for multi-color splitting
// Used when rank >= 20 to split pieces into two contiguous color groups

import { Coordinate, GoopTemplate } from '../types';

/**
 * Create a string key from a coordinate for Set lookups.
 * Format: "x,y"
 */
export function coordKey(c: Coordinate): string {
  return `${c.x},${c.y}`;
}

/**
 * Check if a set of cells forms a single connected region.
 * Uses BFS with 4-connectivity (up/down/left/right neighbors).
 * Returns true for empty or single-cell arrays.
 */
export function isConnected(cells: Coordinate[]): boolean {
  if (cells.length <= 1) return true;

  // Build Set of all cell keys for O(1) neighbor lookup
  const cellSet = new Set(cells.map(coordKey));
  const visited = new Set<string>();
  const queue: Coordinate[] = [cells[0]];

  // BFS from first cell
  while (queue.length > 0) {
    const cell = queue.shift()!;
    const key = coordKey(cell);
    if (visited.has(key)) continue;
    visited.add(key);

    // Check 4-connected neighbors (up, down, left, right)
    const neighbors = [
      { x: cell.x, y: cell.y + 1 },
      { x: cell.x, y: cell.y - 1 },
      { x: cell.x + 1, y: cell.y },
      { x: cell.x - 1, y: cell.y },
    ];

    for (const neighbor of neighbors) {
      const neighborKey = coordKey(neighbor);
      if (cellSet.has(neighborKey) && !visited.has(neighborKey)) {
        queue.push(neighbor);
      }
    }
  }

  // All cells should be reachable from the first cell
  return visited.size === cells.length;
}

/**
 * Find the most balanced split of cells into two contiguous groups.
 * Enumerates all 2^n subsets and filters to valid bipartitions.
 *
 * Returns [groupA indices, groupB indices] where both groups are connected
 * and the size difference is minimal. Returns null if no valid split exists.
 *
 * Note: Returns indices (not coordinates) to preserve cell order for rotation safety.
 */
export function findBestSplit(cells: Coordinate[]): [number[], number[]] | null {
  const n = cells.length;
  if (n < 2) return null;

  let bestSplit: [number[], number[]] | null = null;
  let bestBalance = Infinity; // Lower is better (|sizeA - sizeB|)

  // Try all non-trivial subsets (mask 1 to 2^n - 2)
  // Mask 0 = all in B, mask 2^n-1 = all in A (both trivial)
  for (let mask = 1; mask < (1 << n) - 1; mask++) {
    const indicesA: number[] = [];
    const indicesB: number[] = [];

    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        indicesA.push(i);
      } else {
        indicesB.push(i);
      }
    }

    // Extract actual coordinates for connectivity check
    const groupA = indicesA.map(i => cells[i]);
    const groupB = indicesB.map(i => cells[i]);

    // Both groups must be connected
    if (!isConnected(groupA) || !isConnected(groupB)) continue;

    // Check balance (smaller difference = better)
    const balance = Math.abs(indicesA.length - indicesB.length);
    if (balance < bestBalance) {
      bestBalance = balance;
      bestSplit = [indicesA, indicesB];

      // Early exit on perfect 50/50 split
      if (balance === 0) break;
    }
  }

  return bestSplit;
}

/**
 * Apply a two-color split to a piece definition.
 * Returns a new definition with cellColors array populated.
 *
 * If no valid split exists (shouldn't happen for n >= 2),
 * returns a single-color piece using colorA.
 */
export function splitPiece(
  definition: GoopTemplate,
  colorA: string,
  colorB: string
): GoopTemplate {
  const split = findBestSplit(definition.cells);

  if (!split) {
    // No valid split found, return single-color piece
    return { ...definition, color: colorA };
  }

  const [indicesA] = split;
  const indicesASet = new Set(indicesA);

  // Build cellColors array parallel to cells
  const cellColors = definition.cells.map((_, i) =>
    indicesASet.has(i) ? colorA : colorB
  );

  return {
    ...definition,
    color: colorA, // Fallback color
    cellColors,
  };
}

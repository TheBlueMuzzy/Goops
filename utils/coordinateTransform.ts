
/**
 * Coordinate transformation utilities for the game board.
 *
 * The game displays a tank that wraps horizontally. These utilities
 * handle conversions between:
 * - Screen coordinates (browser/touch events)
 * - SVG coordinates (viewBox space)
 * - Grid coordinates (game logic: column/row)
 * - Visual coordinates (visible portion of the viewport)
 *
 * NOTE: As of Phase 26.1, cylindrical projection has been removed.
 * All coordinates now use simple flat 2D mapping for consistency with
 * soft-body physics.
 */

import { TANK_WIDTH, TANK_VIEWPORT_WIDTH, TANK_VIEWPORT_HEIGHT, BUFFER_HEIGHT } from '../constants';

// Block size in SVG units (exported for components that need it)
export const BLOCK_SIZE = 30;

// Legacy cylindrical projection constants - DEPRECATED
// Kept commented for historical reference only
// export const ANGLE_PER_COL = (2 * Math.PI) / TANK_WIDTH;
// export const CYL_RADIUS = BLOCK_SIZE / ANGLE_PER_COL;

/**
 * ViewBox dimensions for the game SVG.
 * Simple rectangular bounds: 12 columns * 30px = 360 width, 16 rows * 30px = 480 height.
 */
export const VIEWBOX = {
  x: -(TANK_VIEWPORT_WIDTH / 2) * BLOCK_SIZE,  // -180
  y: 0,
  w: TANK_VIEWPORT_WIDTH * BLOCK_SIZE,          // 360
  h: TANK_VIEWPORT_HEIGHT * BLOCK_SIZE,         // 480
};

/**
 * Convert a visual X position (column in visible area) to screen X coordinate.
 * Simple linear mapping: each column is BLOCK_SIZE wide, centered at 0.
 *
 * @param visX - Visual column position (0 = left edge of tankViewport)
 * @returns SVG X coordinate
 */
export function visXToScreenX(visX: number): number {
  // Flat 2D: center at 0, each column is BLOCK_SIZE wide
  return (visX - TANK_VIEWPORT_WIDTH / 2) * BLOCK_SIZE;
}

/**
 * Convert an SVG X coordinate to visual column position.
 * Inverse of visXToScreenX.
 *
 * @param screenX - SVG X coordinate
 * @returns Visual column position (may be fractional)
 */
export function screenXToVisX(screenX: number): number {
  return (screenX / BLOCK_SIZE) + (TANK_VIEWPORT_WIDTH / 2);
}

/**
 * Convert client (screen) coordinates to SVG viewBox coordinates.
 * Handles the "xMidYMid meet" preserveAspectRatio scaling.
 *
 * @param clientX - Client X from mouse/touch event
 * @param clientY - Client Y from mouse/touch event
 * @param containerRect - DOMRect from the SVG container element
 * @param containerClientWidth - clientWidth of the container (content width excluding borders)
 * @param containerClientHeight - clientHeight of the container (content height excluding borders)
 * @param borderLeft - Left border width (usually container.clientLeft)
 * @param borderTop - Top border width (usually container.clientTop)
 * @returns SVG coordinates and relative position info
 */
export function clientToSvg(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  containerClientWidth: number,
  containerClientHeight: number,
  borderLeft: number = 0,
  borderTop: number = 0
): { svgX: number; svgY: number; relX: number; relY: number } {
  const relX = clientX - containerRect.left - borderLeft;
  const relY = clientY - containerRect.top - borderTop;

  const scaleX = containerClientWidth / VIEWBOX.w;
  const scaleY = containerClientHeight / VIEWBOX.h;
  const scale = Math.min(scaleX, scaleY);
  const renderedW = VIEWBOX.w * scale;
  const offsetX = (containerClientWidth - renderedW) / 2;

  const svgX = VIEWBOX.x + (relX - offsetX) / scale;
  const svgY = VIEWBOX.y + relY / scale;

  return { svgX, svgY, relX, relY };
}

/**
 * Convert SVG coordinates to visual grid coordinates.
 * Visual coordinates are relative to the visible tankViewport, not the full cylinder.
 *
 * @param svgX - SVG X coordinate
 * @param svgY - SVG Y coordinate
 * @returns Visual column and row (may be fractional)
 */
export function svgToVisual(svgX: number, svgY: number): { visX: number; visY: number } {
  const visX = screenXToVisX(svgX);
  const visY = svgY / BLOCK_SIZE + BUFFER_HEIGHT;
  return { visX, visY };
}

/**
 * Convert visual coordinates to grid coordinates.
 * Applies board offset and cylinder wrapping.
 *
 * @param visX - Visual column position
 * @param visY - Visual row position
 * @param tankRotation - Current board rotation offset
 * @returns Grid column and row (integers)
 */
export function visualToGrid(
  visX: number,
  visY: number,
  tankRotation: number
): { col: number; row: number } {
  const floorVisX = Math.floor(visX);
  const rawCol = floorVisX + tankRotation;
  // Normalize to cylinder width (handles negative values)
  const col = ((rawCol % TANK_WIDTH) + TANK_WIDTH) % TANK_WIDTH;
  const row = Math.floor(visY);
  return { col, row };
}

/**
 * Convert grid coordinates to visual percentage coordinates.
 * Used for positioning floating text and overlays.
 *
 * @param gridX - Grid column
 * @param gridY - Grid row
 * @param tankRotation - Current board rotation offset
 * @returns X and Y as percentages of the tankViewport (0-100)
 */
export function gridToPercentage(
  gridX: number,
  gridY: number,
  tankRotation: number
): { x: number; y: number } {
  let visX = gridX - tankRotation;
  // Wrap to visible range
  if (visX > TANK_WIDTH / 2) visX -= TANK_WIDTH;
  if (visX < -TANK_WIDTH / 2) visX += TANK_WIDTH;

  const svgX = visXToScreenX(visX);
  const svgY = (gridY - BUFFER_HEIGHT) * BLOCK_SIZE + (BLOCK_SIZE / 2);

  const pctX = ((svgX - VIEWBOX.x) / VIEWBOX.w) * 100;
  const pctY = ((svgY - VIEWBOX.y) / VIEWBOX.h) * 100;

  return { x: pctX, y: pctY };
}

/**
 * Check if a visual coordinate is within the visible tankViewport.
 *
 * @param visX - Visual column position
 * @returns True if the position is within the visible columns
 */
export function isInVisibleRange(visX: number): boolean {
  return visX >= 0 && visX < TANK_VIEWPORT_WIDTH;
}

/**
 * Minigame Types
 *
 * TypeScript interfaces for the three minigame state machines:
 * LASER, LIGHTS, and CONTROLS
 */

// Slider position type used across minigames
export type SliderPosition = -1 | 0 | 1;

// =============================================================================
// LASER Minigame Types
// =============================================================================

/**
 * Internal state for the LASER minigame puzzle.
 * Player must move 4 sliders to match target positions indicated by lights.
 */
export interface LaserComplicationState {
  active: boolean;
  solved: boolean;
  targets: SliderPosition[]; // 4 target positions: -1=left, 0=center, 1=right
}

/**
 * Full state for useLaserMinigame hook.
 */
export interface LaserMinigameState extends LaserComplicationState {
  sliders: SliderPosition[];
  shakingSlider: number | null;
}

// =============================================================================
// LIGHTS Minigame Types
// =============================================================================

/**
 * Phase of the LIGHTS minigame sequence memory puzzle.
 * Flow: slider1 -> showing sequence -> input sequence -> slider2 -> solved
 */
export type LightsPhase = 'inactive' | 'slider1' | 'showing' | 'input' | 'slider2' | 'solved';

/**
 * Button index for the 3-button sequence (0=blue, 1=green, 2=purple).
 */
export type LightsButtonIndex = 0 | 1 | 2;

/**
 * Internal state for the LIGHTS minigame puzzle.
 * Player must watch a sequence of button flashes, then repeat it.
 */
export interface LightsComplicationState {
  phase: LightsPhase;
  slider1Target: 1 | -1;        // First slider target (random)
  sequence: LightsButtonIndex[]; // 3-4 button sequence
  inputIndex: number;            // How many correct inputs so far (0-4)
  showingIndex: number;          // Which light in sequence is showing (-1 = none)
}

/**
 * Full state for useLightsMinigame hook.
 */
export interface LightsMinigameState extends LightsComplicationState {
  slider: SliderPosition;
  sliderShaking: boolean;
}

// =============================================================================
// CONTROLS Minigame Types
// =============================================================================

/**
 * Corner index for dial alignment (0=TR 45deg, 1=TL 315deg, 2=BL 225deg, 3=BR 135deg).
 */
export type CornerIndex = 0 | 1 | 2 | 3;

/**
 * Internal state for the CONTROLS minigame puzzle.
 * Player must align dial to lit corner and press, repeat 3-4 times.
 */
export interface ControlsComplicationState {
  active: boolean;
  solved: boolean;
  targetCorner: CornerIndex | null; // Which corner is lit
  completedCorners: number;          // 0-4 count of completed alignments
}

/**
 * Full state for useControlsMinigame hook.
 */
export interface ControlsMinigameState extends ControlsComplicationState {
  localDialRotation: number;
  isDialDragging: boolean;
  dialShaking: boolean;
  dialPressed: boolean;
}

// =============================================================================
// Shared Types
// =============================================================================

/**
 * Text state for minigame status display.
 */
export interface MinigameTextState {
  text: string;
  color: string;
}

/**
 * Light indicator colors for sliders.
 */
export interface SliderLightColors {
  left: string;
  right: string;
}

/**
 * Button colors for LIGHTS minigame.
 */
export const LIGHTS_BUTTON_COLORS: Record<LightsButtonIndex, string> = {
  0: '#96d7dd', // Blue button top color
  1: '#f6f081', // Green button top color
  2: '#cb8abc'  // Purple button top color
};

/**
 * Corner angles for dial alignment (in degrees).
 * 0=TR, 1=TL, 2=BL, 3=BR
 */
export const CORNER_ANGLES: readonly number[] = [45, 315, 225, 135];

/**
 * Snap positions for dial (cardinal corners).
 */
export const DIAL_SNAP_POSITIONS: readonly number[] = [45, 135, 225, 315];

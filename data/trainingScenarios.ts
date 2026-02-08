
import { TrainingStep, TrainingStepId, TrainingPhase } from '../types/training';
import { COLORS } from '../constants';

// Phase display names
export const TRAINING_PHASE_NAMES: Record<TrainingPhase, string> = {
  A: 'Console Briefing',
  B: 'Goop Basics',
  C: 'Popping & Merging',
  D: 'Cracks & Color Matching',
  E: 'Pressure Mastery',
  F: 'Crack Sealing Payoff',
  G: 'Scaffolding & Spatial Awareness',
};

/**
 * The scripted rank 0 training sequence.
 *
 * One continuous guided experience — NOT discrete levels.
 * The flow controller (33-02) reads these steps and orchestrates game state.
 * Intercom message content is defined separately in 33-03.
 *
 * Piece color sequence: blue → blue → yellow → blue → — → — → green → — → — → — → — → red → red → —
 * Crack color sequence: — → — → — → — → — → — → green → — → — → — → green → red → — → —
 */
export const TRAINING_SEQUENCE: TrainingStep[] = [

  // ═══════════════════════════════════════════════════════════════
  // Phase A: Console Briefing
  // Player learns the premise and how to enter the tank
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'A1_BRIEFING',
    phase: 'A',
    name: 'Welcome Briefing',
    teaches: 'game-premise',
    setup: {
      view: 'console',
      pressureRate: 0,
      // Hide mini-games, show rank/XP bar only
      // Text renders on the top screen
    },
    pauseGame: true,
    advance: { type: 'tap' },
    markComplete: 'WELCOME',
  },

  {
    id: 'A2_PERISCOPE',
    phase: 'A',
    name: 'Enter the Tank',
    teaches: 'periscope-navigation',
    setup: {
      view: 'console',
      highlightElement: 'periscope',
    },
    pauseGame: true,
    advance: { type: 'action', action: 'drag-periscope' },
  },

  // ═══════════════════════════════════════════════════════════════
  // Phase B: Goop Basics
  // Player watches a piece fall, then learns fast-fall and rotation
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'B1_GOOP_INTRO',
    phase: 'B',
    name: 'Goop Introduction',
    teaches: 'what-goop-is',
    setup: {
      view: 'tank',
      spawnPiece: { color: COLORS.BLUE, size: 1, autoFall: true },
      pressureRate: 0,
      allowedControls: { fastDrop: false, rotate: false, tankRotate: false },
    },
    pauseGame: false, // Game runs — player watches blue mono fall and land
    advance: { type: 'event', event: 'piece-landed' },
    // After landing: "The goop extruder drops random goop into the tank"
  },

  {
    id: 'B2_FAST_FALL',
    phase: 'B',
    name: 'Fast Fall',
    teaches: 'fast-fall-input',
    setup: {
      spawnPiece: { color: COLORS.BLUE, size: 1, slowFall: true },
      allowedControls: { fastDrop: true, rotate: false, tankRotate: false },
    },
    pauseGame: true, // Pause at halfway to explain, then unpause for player to try
    advance: { type: 'action', action: 'fast-fall' },
    // "Swipe down or press S to fast-drop"
  },

  {
    id: 'B3_PIECE_ROTATION',
    phase: 'B',
    name: 'Piece Rotation',
    teaches: 'piece-rotation-input',
    setup: {
      spawnPiece: { color: COLORS.YELLOW, size: 3 }, // Tri piece — needs rotation
      allowedControls: { fastDrop: true, rotate: true, tankRotate: false },
    },
    pauseGame: true,
    advance: { type: 'action', action: 'rotate-piece' },
    markComplete: 'DROP_INTRO',
    // "Rotate the goop before it lands"
  },

  // ═══════════════════════════════════════════════════════════════
  // Phase C: Popping & Merging
  // Stack is building up. Learn to clear it.
  //
  // State at this point: blue(B1) + blue(B2) at bottom, yellow tri(B3) on top
  // New blue piece drops → pop yellow → blue merges into blue below
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'C1_POP_INTRO',
    phase: 'C',
    name: 'Pop Introduction',
    teaches: 'popping-mechanic',
    setup: {
      spawnPiece: { color: COLORS.BLUE, size: 2 },
      pressureRate: 0.2, // Slow pressure buildup begins
      allowedControls: { fastDrop: true, rotate: true, tankRotate: false },
    },
    pauseGame: true,
    advance: { type: 'action', action: 'pop-goop' },
    // "Too much goop builds pressure. Pop the yellow goop with the laser!"
    // Player pops the yellow tri from B3
  },

  {
    id: 'C2_MERGE',
    phase: 'C',
    name: 'Color Merging',
    teaches: 'same-color-merge',
    setup: {
      // Blue from C1 falls into blue stack from B1+B2 — automatic merge
      allowedControls: { fastDrop: true, rotate: true, tankRotate: false },
    },
    pauseGame: false, // Let merge happen visually
    advance: { type: 'event', event: 'goop-merged' },
    // "Same-color goop merges together"
  },

  {
    id: 'C3_FILL_TIMING',
    phase: 'C',
    name: 'Fill Timing',
    teaches: 'fill-delay-mechanic',
    setup: {
      showPressureLine: true, // Reveal pressure line (not yet above blue stack)
      allowedControls: { fastDrop: true, rotate: true, tankRotate: false },
    },
    pauseGame: true,
    advance: { type: 'tap' },
    markComplete: 'POP_TIMING',
    // "Larger goop takes longer to fill. Can't pop until fully filled."
  },

  // ═══════════════════════════════════════════════════════════════
  // Phase D: Cracks & Color Matching
  // Introduce the actual objective: seal cracks with matching goop
  //
  // State: big merged blue blob in the tank, pressure slowly building
  // Green crack appears on the side where the stack sits
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'D1_CRACK_APPEARS',
    phase: 'D',
    name: 'First Crack',
    teaches: 'crack-color-matching',
    setup: {
      spawnCrack: { color: COLORS.GREEN, placement: 'near-stack' },
      // Crack is beside the stack — next piece would land on stack, not crack
      allowedControls: { fastDrop: true, rotate: true, tankRotate: false },
    },
    pauseGame: true,
    advance: { type: 'tap' },
    markComplete: 'CRACK_INTRO',
    // "A crack! Cracks must be sealed with matching-color goop."
  },

  {
    id: 'D2_TANK_ROTATION',
    phase: 'D',
    name: 'Tank Rotation',
    teaches: 'tank-rotation-input',
    setup: {
      spawnPiece: { color: COLORS.GREEN, size: 1 }, // Mono — no piece rotation needed
      // Ghost starts over stack. Player rotates tank to align with crack.
      allowedControls: { fastDrop: true, rotate: true, tankRotate: true },
    },
    pauseGame: true,
    advance: { type: 'action', action: 'rotate-tank' },
    markComplete: 'ROTATE_INTRO',
    // "The tank rotates — spin left/right to get the goop over the crack"
    // Positioned so player can't miss once rotated
  },

  // ═══════════════════════════════════════════════════════════════
  // Phase E: Pressure Mastery
  // Pressure has been building since C1. Now make it matter.
  //
  // State: big blue blob, green piece placed on crack, pressure rising
  // Player learns pressure must reach goop height to pop
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'E1_PRESSURE_REVEAL',
    phase: 'E',
    name: 'Pressure Explanation',
    teaches: 'pressure-awareness',
    setup: {
      pressureRate: 0.3,
      allowedControls: { fastDrop: true, rotate: true, tankRotate: true },
    },
    pauseGame: true,
    advance: { type: 'tap' },
    // "Pressure has been building this whole time..."
  },

  {
    id: 'E2_PRESSURE_THRESHOLD',
    phase: 'E',
    name: 'Pressure Threshold',
    teaches: 'pressure-pop-requirement',
    setup: {
      // Pressure line is NOT yet above the blue stack
      // Player will try to pop and fail
      allowedControls: { fastDrop: true, rotate: true, tankRotate: true },
    },
    pauseGame: true,
    advance: { type: 'tap' },
    // "Pop the blue goop to relieve pressure!" — Player tries... can't.
    // "Goop can only pop when pressure reaches it. Wait for pressure to rise."
  },

  {
    id: 'E3_SUCCESSFUL_POP',
    phase: 'E',
    name: 'Pressure Pop & Bonus',
    teaches: 'pop-relieves-pressure-and-bonus',
    setup: {
      pressureRate: 0.5, // Speed up so pressure reaches blue stack
      allowedControls: { fastDrop: true, rotate: true, tankRotate: true },
    },
    pauseGame: false, // Game runs — waiting for pressure to reach blue
    advance: { type: 'event', event: 'pop-complete' },
    // After pop: "Pressure relieved! Popping also gives a bonus to falling goop."
  },

  // ═══════════════════════════════════════════════════════════════
  // Phase F: Crack Sealing Payoff
  // Green goop from D2 resolves — seal crack for biggest reward
  //
  // State: green goop sitting on green crack (placed in D2), ready to pop
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'F1_CRACK_SEAL',
    phase: 'F',
    name: 'Seal the Crack',
    teaches: 'crack-sealing-reward',
    setup: {
      // Green goop should be filled and on the green crack
      allowedControls: { fastDrop: true, rotate: true, tankRotate: true },
    },
    pauseGame: true,
    advance: { type: 'action', action: 'pop-goop' },
    // "Goop on a crack seals it — pop for a HUGE pressure release!"
    // Big pressure drop + crack sealed visual
  },

  // ═══════════════════════════════════════════════════════════════
  // Phase G: Scaffolding & Spatial Awareness
  // Teach 360° tank awareness and strategic stacking
  //
  // State: tank mostly clear after pops, new crack forms offscreen
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'G1_OFFSCREEN_CRACK',
    phase: 'G',
    name: '360° Awareness',
    teaches: 'cylindrical-tank',
    setup: {
      spawnCrack: { color: COLORS.RED, placement: 'high-offscreen' },
      allowedControls: { fastDrop: true, rotate: true, tankRotate: true },
    },
    pauseGame: true,
    advance: { type: 'action', action: 'rotate-tank' },
    markComplete: 'WRAP_INTRO',
    // "The tank wraps all the way around — keep rotating to see everything"
    // Player rotates to discover the crack
  },

  {
    id: 'G2_SCAFFOLDING',
    phase: 'G',
    name: 'Build Scaffolding',
    teaches: 'scaffolding-strategy',
    setup: {
      // Crack is too high to reach from ground — need 2 pieces stacked
      spawnPiece: { color: COLORS.RED, size: 3 },
      // Flow controller spawns a second piece after first lands
      allowedControls: { fastDrop: true, rotate: true, tankRotate: true },
    },
    pauseGame: true,
    advance: { type: 'event', event: 'crack-sealed' },
    // "Stack pieces as scaffolding to reach higher cracks"
  },

  {
    id: 'G3_SCAFFOLDING_TRADEOFF',
    phase: 'G',
    name: 'The Core Tradeoff',
    teaches: 'scaffolding-vs-pressure',
    setup: {
      allowedControls: { fastDrop: true, rotate: true, tankRotate: true },
    },
    pauseGame: true,
    advance: { type: 'tap' },
    markComplete: 'FIRST_SHIFT',
    // "Goop in the tank = more pressure. Balance reaching cracks vs keeping pressure low."
    // Training complete — player has learned all core mechanics
  },
];

// --- Helper Functions ---

/**
 * Get the next incomplete training step.
 * Returns the first step whose id is NOT in completedStepIds, or null if done.
 */
export function getNextTrainingStep(
  completedStepIds: string[]
): TrainingStep | null {
  return TRAINING_SEQUENCE.find(step => !completedStepIds.includes(step.id)) ?? null;
}

/**
 * Check if all training steps are complete.
 */
export function isTrainingComplete(completedStepIds: string[]): boolean {
  return TRAINING_SEQUENCE.every(step => completedStepIds.includes(step.id));
}

/**
 * Get all steps in a specific training phase.
 */
export function getPhaseSteps(phase: TrainingPhase): TrainingStep[] {
  return TRAINING_SEQUENCE.filter(step => step.phase === phase);
}

/**
 * Get a specific training step by id.
 */
export function getTrainingStep(id: TrainingStepId): TrainingStep | null {
  return TRAINING_SEQUENCE.find(step => step.id === id) ?? null;
}

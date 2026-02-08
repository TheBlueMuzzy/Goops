
import { TutorialStepId } from './tutorial';

// --- Training Step Identifiers ---

// Each step in the scripted rank 0 training sequence
export type TrainingStepId =
  | 'A1_BRIEFING'
  | 'A2_PERISCOPE'
  | 'B1_GOOP_INTRO'
  | 'B2_FAST_FALL'
  | 'B3_PIECE_ROTATION'
  | 'C1_POP_INTRO'
  | 'C2_MERGE'
  | 'C3_FILL_TIMING'
  | 'D1_CRACK_APPEARS'
  | 'D2_TANK_ROTATION'
  | 'E1_PRESSURE_REVEAL'
  | 'E2_PRESSURE_THRESHOLD'
  | 'E3_SUCCESSFUL_POP'
  | 'F1_CRACK_SEAL'
  | 'G1_OFFSCREEN_CRACK'
  | 'G2_SCAFFOLDING'
  | 'G3_SCAFFOLDING_TRADEOFF';

// Phase groupings (A-G)
export type TrainingPhase = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

// --- Step Configuration ---

// Piece to spawn for this step
export interface PieceSpawn {
  color: string;        // COLORS.RED, COLORS.BLUE, etc.
  size: number;         // 1=Mono, 2=Duo, 3=Tri, 4=Tetra
  autoFall?: boolean;   // Falls without player input (player watches)
  slowFall?: boolean;   // Falls at reduced speed for learning
}

// Crack to spawn for this step
export interface CrackSpawn {
  color: string;
  placement: 'near-stack' | 'away-from-stack' | 'offscreen' | 'high-offscreen';
}

// What to set up before this step activates
export interface StepSetup {
  spawnPiece?: PieceSpawn;
  spawnCrack?: CrackSpawn;
  pressureRate?: number;        // 0=frozen, 0.3=slow, 1=normal
  showPressureLine?: boolean;   // Reveal the pressure indicator
  view?: 'console' | 'tank';   // Which view to be in
  highlightElement?: string;    // UI element to glow/highlight
}

// How the player advances past this step
export type StepAdvance =
  | { type: 'tap' }                          // Tap to dismiss message
  | { type: 'action'; action: string }       // Perform specific action
  | { type: 'event'; event: string }         // Wait for game event
  | { type: 'auto'; delayMs: number };       // Auto-advance after delay

// --- Training Step ---

// A single step in the scripted training sequence
export interface TrainingStep {
  id: TrainingStepId;
  phase: TrainingPhase;
  name: string;                     // Human label for this step
  teaches: string;                  // What concept this step introduces
  setup?: StepSetup;                // Game state to configure before step
  pauseGame: boolean;               // True = game pauses while message shows
  advance: StepAdvance;             // How to move to next step
  markComplete?: TutorialStepId;    // Tutorial step to mark complete (unlocks journal pages)
}

// The full ordered training sequence
export type TrainingSequence = TrainingStep[];

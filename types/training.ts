
import { TutorialStepId } from './tutorial';

// Training Scenario Identifiers (rank 0 sequence)
export type TrainingScenarioId = '0TA' | '0TB' | '0TC' | '0TD' | '0TE' | '0TF';

// Gameplay constraints applied to GameEngine during a training scenario
export interface TrainingConfig {
  palette: string[];          // Override available colors (hex values from COLORS)
  maxPieceSize: number;       // Max cells per piece (1=Mono, 2=Duo, 3=Tri, 4=Tetra)
  goalsTarget: number;        // Cracks to seal for scenario completion
  timeLimitMs: number | null; // null = no time limit, number = milliseconds
  startingJunk: number;       // Override junk count (0 for early training)
  allowRotation: boolean;     // Can player rotate pieces (Q/E)?
  gridPreset?: string;        // Optional named preset for pre-placed grid content
}

// A single training scenario definition
export interface TrainingScenario {
  id: TrainingScenarioId;
  order: number;              // Sequence position (1-6)
  name: string;               // Display name
  objective: string;          // Player-facing objective text
  concept: string;            // Internal label for what this teaches
  config: TrainingConfig;     // Game constraints
  tutorialStepId: TutorialStepId;   // Which tutorial step this scenario's intercom triggers
  completionStepId: TutorialStepId; // Which step gets marked complete when scenario is done
}

// Ordered array of training scenarios
export type TrainingSequence = TrainingScenario[];

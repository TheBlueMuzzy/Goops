
import { useState, useEffect, useCallback, useRef } from 'react';
import { SaveData, GoopTemplate, GoopShape, Crack } from '../types';
import { TrainingStep, PieceSpawn } from '../types/training';
import { IntercomMessage } from '../types/tutorial';
import { GameEngine } from '../core/GameEngine';
import { gameEventBus } from '../core/events/EventBus';
import { GameEventType } from '../core/events/GameEvents';
import { getNextTrainingStep, isTrainingComplete } from '../data/trainingScenarios';
import { TRAINING_MESSAGES, TRAINING_RETRY_MESSAGES } from '../data/tutorialSteps';
import { COLORS, TANK_WIDTH, TANK_VIEWPORT_WIDTH, TANK_HEIGHT, TANK_VIEWPORT_HEIGHT, BUFFER_HEIGHT, TETRA_NORMAL, PENTA_NORMAL, HEXA_NORMAL } from '../constants';
import { getRotatedCells } from '../utils/gameLogic';
import { normalizeX } from '../utils/coordinates';

interface UseTrainingFlowOptions {
  saveData: SaveData;
  setSaveData: (updater: (prev: SaveData) => SaveData) => void;
  gameEngine: GameEngine | null;
  rank: number;
}

// Map training advance actions/events to game event types
const ADVANCE_EVENT_MAP: Record<string, GameEventType[]> = {
  // Actions
  'fast-fall': [GameEventType.INPUT_FAST_DROP],
  'rotate-piece': [GameEventType.PIECE_ROTATED],
  'pop-goop': [GameEventType.GOOP_POPPED],
  'rotate-tank': [GameEventType.INPUT_DRAG],
  // Events
  'piece-landed': [GameEventType.PIECE_DROPPED],
  'goop-merged': [GameEventType.PIECE_DROPPED],  // Merge happens on landing
  'crack-sealed': [GameEventType.GOAL_CAPTURED],
  'game-over': [GameEventType.GAME_OVER],
};

// Events without direct mappings get auto-advanced after this delay
const AUTO_ADVANCE_FALLBACK_MS = 4000;

/**
 * Manages the rank 0 training sequence.
 *
 * Sequences the player through 15 scripted training steps (phases A-F).
 * Sets up the GameEngine for training mode when the player is at rank 0
 * and hasn't completed all training steps.
 *
 * Provides:
 * - trainingDisplayStep: A message object for TutorialOverlay to display
 * - advanceStep: Advance to next training step (for tap-type advances)
 * - dismissMessage: Hide current message without advancing (for action/event advances)
 * - Event listeners that auto-advance on action/event conditions
 */
export const useTrainingFlow = ({
  saveData,
  setSaveData,
  gameEngine,
  rank,
}: UseTrainingFlowOptions) => {
  const completedSteps = saveData.tutorialProgress?.completedSteps ?? [];

  // Derive current state from save data
  const trainingDone = isTrainingComplete(completedSteps);
  const isInTraining = rank === 0 && !trainingDone;
  const currentStep = isInTraining ? getNextTrainingStep(completedSteps) : null;

  // Message visibility — separate from step advancement
  // For tap steps: dismiss = advance. For action/event: dismiss just hides message.
  const [messageVisible, setMessageVisible] = useState(true);

  // Advance arming — prevents event listeners from firing before message is dismissed.
  // For pauseGame: true steps, the listener is "disarmed" until dismissMessage() is called.
  // For pauseGame: false steps, the listener is armed immediately (game already running).
  const advanceArmedRef = useRef(true);
  const armTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Transition delay timer ref — cleaned up on unmount
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track when game paused for training message — used to adjust fill timestamps on unpause
  const pauseStartTimeRef = useRef<number | null>(null);
  // When true, any user input will trigger message visibility (showOnInput feature)
  const readyToShowOnInputRef = useRef(false);
  // Position-polling interval ref for showWhenPieceBelow
  const positionPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Re-show message timer ref for reshowAfterMs feature
  const reshowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Cleanup function for inactivity DOM listeners (pointerdown/keydown that reset reshow timer)
  const reshowInputCleanupRef = useRef<(() => void) | null>(null);
  // Whether the current message is a non-dismissible re-show (buttons hidden, only action clears it)
  const [canDismiss, setCanDismiss] = useState(true);
  // Override message for retries (shown instead of the step's normal message)
  const [retryMessage, setRetryMessage] = useState<IntercomMessage | null>(null);
  // Cracks-offscreen polling interval ref
  const cracksOffscreenPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Flag: was a crack sealed this piece-lock cycle? (set by GOAL_CAPTURED, read by PIECE_DROPPED)
  const crackSealedThisCycleRef = useRef(false);

  // Show message when step changes, with a brief delay for reading rhythm
  useEffect(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (positionPollRef.current) {
      clearInterval(positionPollRef.current);
      positionPollRef.current = null;
    }

    // Clear any pending arm timer from previous step
    if (armTimerRef.current) {
      clearTimeout(armTimerRef.current);
      armTimerRef.current = null;
    }
    if (reshowTimerRef.current) {
      clearTimeout(reshowTimerRef.current);
      reshowTimerRef.current = null;
    }
    if (reshowInputCleanupRef.current) {
      reshowInputCleanupRef.current();
      reshowInputCleanupRef.current = null;
    }
    readyToShowOnInputRef.current = false;
    setCanDismiss(true);
    setRetryMessage(null);
    crackSealedThisCycleRef.current = false;
    if (cracksOffscreenPollRef.current) {
      clearInterval(cracksOffscreenPollRef.current);
      cracksOffscreenPollRef.current = null;
    }

    if (currentStep) {
      // Delayed-pause steps start unpaused (piece falls), then pause when condition is met.
      // This includes: pauseDelay (time-based), showWhenPieceBelow (position-gated),
      // and showWhenCracksOffscreen (rotation-gated).
      const isDelayedPause = currentStep.pauseGame !== false && (
        currentStep.setup?.pauseDelay != null ||
        currentStep.setup?.showWhenPieceBelow != null ||
        currentStep.setup?.showWhenCracksOffscreen
      );

      // Arm advance listeners: disarmed for pausing steps (wait for dismiss),
      // armed immediately for non-pausing steps (game already running)
      // Delayed-pause steps are treated like pausing steps (disarmed until dismiss)
      advanceArmedRef.current = currentStep.pauseGame === false && !isDelayedPause;

      if (gameEngine && gameEngine.isSessionActive) {
        if (isDelayedPause) {
          // Delayed pause: start unpaused so piece can begin falling
          gameEngine.state.isPaused = false;
          gameEngine.freezeFalling = false;
          gameEngine.emitChange();
        } else if (currentStep.pauseGame !== false) {
          // Pause/freeze for steps that need the player to read before acting
          gameEngine.state.isPaused = true;
          gameEngine.freezeFalling = true;
          pauseStartTimeRef.current = Date.now();
          gameEngine.emitChange();
        } else {
          // Non-pausing step (e.g. B1) — ensure game is running
          // (advanceStep may have paused momentarily during transition)
          gameEngine.state.isPaused = false;
          gameEngine.freezeFalling = false;
          gameEngine.emitChange();
        }

        // Spawn a piece if this step defines one (training mode gates auto-spawn,
        // so each piece must be explicitly spawned by the step that needs it)
        if (currentStep.setup?.spawnPiece) {
          const spawn = currentStep.setup.spawnPiece;
          // Find the matching shape template from piece constants
          const allPieces = [...TETRA_NORMAL, ...PENTA_NORMAL, ...HEXA_NORMAL];
          const shapeTemplate = allPieces.find(p => p.type === spawn.shape);
          if (shapeTemplate) {
            let cells = shapeTemplate.cells.map(c => ({ ...c }));
            // Apply initial rotation if specified
            if (spawn.rotation && spawn.rotation > 0) {
              for (let r = 0; r < spawn.rotation; r++) {
                cells = getRotatedCells(cells, true);
              }
            }
            const template: GoopTemplate = { type: spawn.shape, cells, color: spawn.color };
            gameEngine.spawnNewPiece(template);
          }
        }

        // Spawn a crack if this step defines one
        if (currentStep.setup?.spawnCrack) {
          const crackConfig = currentStep.setup.spawnCrack;
          const grid = gameEngine.state.grid;
          const rotation = gameEngine.state.tankRotation;
          let crackX: number | null = null;
          let crackY: number | null = null;

          if (crackConfig.placement === 'near-stack') {
            // Place crack on right side of viewport, 2nd row above floor (row 22).
            // Right side avoids the falling piece path (pieces spawn center-left).
            const rightScreenX = TANK_VIEWPORT_WIDTH - 3; // 3 cells from right edge
            crackX = normalizeX(rotation + rightScreenX);
            crackY = TANK_HEIGHT - 2; // 2nd row from bottom (row 22)
          } else if (crackConfig.placement === 'offscreen' || crackConfig.placement === 'high-offscreen') {
            const offscreenCols: number[] = [];
            for (let gx = 0; gx < TANK_WIDTH; gx++) {
              const screenX = ((gx - rotation) % TANK_WIDTH + TANK_WIDTH) % TANK_WIDTH;
              if (screenX >= TANK_VIEWPORT_WIDTH) offscreenCols.push(gx);
            }
            if (offscreenCols.length > 0) {
              const yRange = crackConfig.placement === 'high-offscreen'
                ? { min: BUFFER_HEIGHT, max: BUFFER_HEIGHT + 4 }
                : { min: TANK_HEIGHT - 6, max: TANK_HEIGHT - 1 };
              for (let attempt = 0; attempt < 30; attempt++) {
                const gx = offscreenCols[Math.floor(Math.random() * offscreenCols.length)];
                const gy = yRange.min + Math.floor(Math.random() * (yRange.max - yRange.min + 1));
                if (grid[gy][gx] === null) {
                  crackX = gx;
                  crackY = gy;
                  break;
                }
              }
            }
          } else {
            // 'away-from-stack': random visible empty cell in lower area
            for (let attempt = 0; attempt < 30; attempt++) {
              const screenX = Math.floor(Math.random() * TANK_VIEWPORT_WIDTH);
              const gx = normalizeX(rotation + screenX);
              const gy = TANK_HEIGHT - 5 + Math.floor(Math.random() * 3);
              if (gy >= BUFFER_HEIGHT && gy < TANK_HEIGHT && grid[gy][gx] === null) {
                crackX = gx;
                crackY = gy;
                break;
              }
            }
          }

          if (crackX !== null && crackY !== null) {
            const now = Date.now();
            const crackId = Math.random().toString(36).substr(2, 9);
            const newCrack: Crack = {
              id: crackId,
              x: crackX,
              y: crackY,
              color: crackConfig.color,
              originCrackId: [],
              branchCrackIds: [],
              lastGrowthCheck: now,
              crackBranchInterval: 999999, // No growth in training
              spawnTime: now,
            };
            gameEngine.state.crackCells.push(newCrack);
            gameEngine.state.goalMarks.push({
              id: crackId,
              x: crackX,
              y: crackY,
              color: crackConfig.color,
              spawnTime: now,
            });
            gameEngine.emitChange(); // Trigger re-render so crack is visible
          }
        }
      }

      const pieceThreshold = currentStep.setup?.showWhenPieceBelow;

      if (pieceThreshold != null && gameEngine) {
        // Position-gated message: poll piece Y until it reaches threshold
        setMessageVisible(false);
        positionPollRef.current = setInterval(() => {
          const pieceY = gameEngine.state.activeGoop?.y ?? 0;
          if (pieceY >= pieceThreshold) {
            setMessageVisible(true);
            if (positionPollRef.current) {
              clearInterval(positionPollRef.current);
              positionPollRef.current = null;
            }
            // Also pause game if this step wants pausing (position-gated pause)
            if (currentStep.pauseGame !== false) {
              gameEngine.state.isPaused = true;
              gameEngine.freezeFalling = true;
              pauseStartTimeRef.current = Date.now();
              gameEngine.emitChange();
            }
          }
        }, 200);
      } else if (currentStep.setup?.showWhenCracksOffscreen && gameEngine) {
        // Discovery-gated message: triggers when ANY crack is rotated offscreen (arrow appears).
        // This is a "discovered" moment — if the player doesn't rotate, auto-skip after timeout.
        setMessageVisible(false);
        cracksOffscreenPollRef.current = setInterval(() => {
          const cracks = gameEngine.state.crackCells;
          if (cracks.length === 0) return; // Wait until there's at least one crack to track
          const rot = gameEngine.state.tankRotation;
          // Match the arrow indicator threshold: >= half viewport from center
          const centerCol = normalizeX(rot + TANK_VIEWPORT_WIDTH / 2);
          const anyOffscreen = cracks.some(c => {
            let diff = c.x - centerCol;
            if (diff > TANK_WIDTH / 2) diff -= TANK_WIDTH;
            if (diff < -TANK_WIDTH / 2) diff += TANK_WIDTH;
            return Math.abs(diff) >= TANK_VIEWPORT_WIDTH / 2;
          });
          if (anyOffscreen) {
            if (cracksOffscreenPollRef.current) {
              clearInterval(cracksOffscreenPollRef.current);
              cracksOffscreenPollRef.current = null;
            }
            setMessageVisible(true);
            if (currentStep.pauseGame !== false) {
              gameEngine.state.isPaused = true;
              gameEngine.freezeFalling = true;
              pauseStartTimeRef.current = Date.now();
              gameEngine.emitChange();
            }
          }
        }, 200);
        // Auto-skip if player never rotates a crack offscreen (discovery is optional)
        transitionTimerRef.current = setTimeout(() => {
          if (cracksOffscreenPollRef.current) {
            clearInterval(cracksOffscreenPollRef.current);
            cracksOffscreenPollRef.current = null;
          }
          // Skip this step silently — player will learn about wrapping naturally
          advanceStepRef.current();
        }, 15000);
      } else if (currentStep.setup?.pauseDelay != null) {
        // Timer-based delayed pause: hide message, start unpaused, then after delay pause + show
        setMessageVisible(false);
        transitionTimerRef.current = setTimeout(() => {
          if (gameEngine && gameEngine.isSessionActive) {
            gameEngine.state.isPaused = true;
            gameEngine.freezeFalling = true;
            pauseStartTimeRef.current = Date.now();
            gameEngine.emitChange();
          }
          setMessageVisible(true);
          transitionTimerRef.current = null;
        }, currentStep.setup!.pauseDelay!);
      } else if (currentStep.pauseGame === false) {
        // Non-pausing step — show immediately, after delay, or on input
        if (currentStep.setup?.messageDelay && currentStep.setup?.showOnInput) {
          // Input-responsive: arm immediately so any input shows message instantly.
          // Delay is fallback auto-show for patient users who don't interact.
          setMessageVisible(false);
          readyToShowOnInputRef.current = true;
          transitionTimerRef.current = setTimeout(() => {
            if (readyToShowOnInputRef.current) {
              setMessageVisible(true);
              readyToShowOnInputRef.current = false;
            }
            transitionTimerRef.current = null;
          }, currentStep.setup.messageDelay);
        } else if (currentStep.setup?.messageDelay) {
          setMessageVisible(false);
          transitionTimerRef.current = setTimeout(() => {
            setMessageVisible(true);
            transitionTimerRef.current = null;
          }, currentStep.setup.messageDelay);
        } else {
          setMessageVisible(true);
        }
      } else {
        // Pausing step — brief delay before showing message
        setMessageVisible(false);
        transitionTimerRef.current = setTimeout(() => {
          setMessageVisible(true);
          transitionTimerRef.current = null;
        }, 400);
      }
    }

    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      if (positionPollRef.current) {
        clearInterval(positionPollRef.current);
        positionPollRef.current = null;
      }
      if (armTimerRef.current) {
        clearTimeout(armTimerRef.current);
        armTimerRef.current = null;
      }
      if (reshowTimerRef.current) {
        clearTimeout(reshowTimerRef.current);
        reshowTimerRef.current = null;
      }
      if (reshowInputCleanupRef.current) {
        reshowInputCleanupRef.current();
        reshowInputCleanupRef.current = null;
      }
      if (cracksOffscreenPollRef.current) {
        clearInterval(cracksOffscreenPollRef.current);
        cracksOffscreenPollRef.current = null;
      }
    };
  }, [currentStep?.id]);

  // Track completion ref for event handler (avoid stale closure)
  const completedRef = useRef(completedSteps);
  completedRef.current = completedSteps;

  // Default training palette (4 colors for training)
  const trainingPalette = [COLORS.BLUE, COLORS.YELLOW, COLORS.GREEN, COLORS.RED];

  // Set up engine for training mode when applicable
  useEffect(() => {
    if (!gameEngine) return;

    if (isInTraining) {
      // Tell engine to start training on next periscope enter
      gameEngine.pendingTrainingPalette = trainingPalette;
    } else {
      // Clear training flag — engine will use normal startRun()
      gameEngine.pendingTrainingPalette = null;
    }
  }, [gameEngine, isInTraining]);

  /**
   * Mark a training step as complete in save data.
   */
  const completeCurrentStep = useCallback(() => {
    if (!currentStep) return;

    const stepId = currentStep.id;

    setSaveData(sd => {
      const existing = sd.tutorialProgress?.completedSteps ?? [];
      if (existing.includes(stepId)) return sd; // Already completed

      const newCompleted = [...existing, stepId];

      // Also mark the tutorial step if this training step unlocks one
      if (currentStep.markComplete && !existing.includes(currentStep.markComplete)) {
        newCompleted.push(currentStep.markComplete);
      }

      return {
        ...sd,
        tutorialProgress: { completedSteps: newCompleted },
      };
    });
  }, [currentStep, setSaveData]);

  /**
   * Adjust goop fill timestamps for pause duration.
   * Prevents fill from appearing "instant" after reading a long message (fill uses Date.now()).
   * Called whenever transitioning from "paused for message" to next state.
   */
  const adjustFillTimestampsForPause = useCallback(() => {
    if (gameEngine && pauseStartTimeRef.current) {
      const pauseDuration = Date.now() - pauseStartTimeRef.current;
      const grid = gameEngine.state.grid;
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          const cell = grid[y][x];
          if (cell && cell.timestamp) {
            cell.timestamp += pauseDuration;
          }
        }
      }
      pauseStartTimeRef.current = null;
    }
  }, [gameEngine]);

  /**
   * Advance to the next training step.
   * Called after the current step's advance condition is met.
   */
  const advanceStep = useCallback(() => {
    if (!currentStep) return;

    // Disarm to prevent double-advance from rapid events
    advanceArmedRef.current = false;

    // Adjust fill timestamps before transitioning (covers tap-advance steps)
    adjustFillTimestampsForPause();

    completeCurrentStep();

    // Pause immediately — the next step's useEffect will handle the transition delay
    // (Don't unpause here; the step-change effect will manage pause state)
    if (gameEngine && gameEngine.isSessionActive) {
      gameEngine.state.isPaused = true;
      gameEngine.freezeFalling = true;  // Actually stop piece physics too
      gameEngine.emitChange();
    }

    // Check if training is now complete
    const updatedCompleted = [...completedRef.current, currentStep.id];
    if (currentStep.markComplete) updatedCompleted.push(currentStep.markComplete);
    if (isTrainingComplete(updatedCompleted)) {
      // Training complete — emit event and clear engine training flag
      gameEventBus.emit(GameEventType.TRAINING_SCENARIO_COMPLETE);
      if (gameEngine) {
        gameEngine.pendingTrainingPalette = null;
      }
    }
  }, [adjustFillTimestampsForPause, completeCurrentStep, currentStep, gameEngine]);

  // Ref for advanceStep so event listeners always call the latest version
  const advanceStepRef = useRef(advanceStep);
  advanceStepRef.current = advanceStep;

  /**
   * Dismiss the current message without advancing.
   * Used for action/event steps — hides message, unpauses game, player performs action.
   */
  const dismissMessage = useCallback(() => {
    setMessageVisible(false);

    // Adjust fill timestamps before unpausing
    adjustFillTimestampsForPause();

    // Unpause so the player can perform the required action
    if (gameEngine && gameEngine.isSessionActive) {
      gameEngine.state.isPaused = false;
      gameEngine.freezeFalling = false;  // Resume piece physics
      // Restore pressure rate (may have been zeroed during retry)
      if (currentStep?.setup?.pressureRate != null) {
        gameEngine.trainingPressureRate = currentStep.setup.pressureRate;
      }
      gameEngine.emitChange();
    }

    // Arm the advance listener after a brief delay — prevents the dismiss
    // tap from also triggering the advance event (e.g. fast-drop) on the same frame
    if (armTimerRef.current) clearTimeout(armTimerRef.current);
    armTimerRef.current = setTimeout(() => {
      advanceArmedRef.current = true;
      armTimerRef.current = null;
    }, 150);

    // Re-show reminder after delay if step has reshowAfterMs
    if (reshowTimerRef.current) clearTimeout(reshowTimerRef.current);
    if (currentStep?.setup?.reshowAfterMs) {
      const isNonDismissible = !!currentStep.setup.reshowNonDismissible;
      const delay = currentStep.setup.reshowAfterMs;

      const doReshow = () => {
        // Only re-show if advance hasn't fired yet (step hasn't changed)
        if (advanceArmedRef.current && gameEngine && gameEngine.isSessionActive) {
          if (isNonDismissible) {
            // Non-dismissible: freeze pressure but keep game running so player can still pop.
            // Don't pause — isPaused blocks input. Instead zero the pressure rate.
            gameEngine.trainingPressureRate = 0;
            gameEngine.emitChange();
            setMessageVisible(true);
            setCanDismiss(false);
          } else {
            // Dismissible: full pause
            gameEngine.state.isPaused = true;
            gameEngine.freezeFalling = true;
            pauseStartTimeRef.current = Date.now();
            gameEngine.emitChange();
            setMessageVisible(true);
            advanceArmedRef.current = false;
          }
        }
        reshowTimerRef.current = null;
      };

      // Simple countdown from dismiss — fires once after delay
      reshowTimerRef.current = setTimeout(doReshow, delay);
    }
  }, [adjustFillTimestampsForPause, gameEngine, currentStep]);

  // --- Pause management during training ---
  // ALL steps start paused on transition (handled by step-change effect above).
  // The game stays paused until the player dismisses the message.
  // dismissMessage() handles unpausing for action/event steps.
  // For tap steps, advanceStep() moves to next step (which pauses again).

  // --- Event/action advance listeners ---
  useEffect(() => {
    if (!currentStep || !isInTraining) return;

    const { advance } = currentStep;
    const cleanups: (() => void)[] = [];

    // showOnInput: show message when user tries any input (after messageDelay arms it)
    // Uses DOM-level listeners to catch ALL touch/pointer/key input regardless of game state
    if (currentStep.setup?.showOnInput) {
      const showOnInputHandler = () => {
        if (readyToShowOnInputRef.current) {
          setMessageVisible(true);
          readyToShowOnInputRef.current = false;
        }
      };
      // Capture phase — fires before any stopPropagation in game board handlers.
      // touchstart needed because iOS doesn't reliably fire pointerdown for touches.
      document.addEventListener('pointerdown', showOnInputHandler, true);
      document.addEventListener('touchstart', showOnInputHandler, true);
      document.addEventListener('keydown', showOnInputHandler, true);
      cleanups.push(() => {
        document.removeEventListener('pointerdown', showOnInputHandler, true);
        document.removeEventListener('touchstart', showOnInputHandler, true);
        document.removeEventListener('keydown', showOnInputHandler, true);
      });
    }

    // Position-based advance: poll piece Y and advance when it reaches the threshold.
    // Runs alongside normal event listeners — whichever fires first wins
    // (advanceStep disarms to prevent double-fire).
    if (currentStep.setup?.advanceAtRow != null && gameEngine) {
      const threshold = currentStep.setup.advanceAtRow;
      const pollInterval = setInterval(() => {
        const pieceY = gameEngine.state.activeGoop?.y ?? 0;
        if (pieceY >= threshold && advanceArmedRef.current) {
          clearInterval(pollInterval);
          advanceStepRef.current();
        }
      }, 150);
      cleanups.push(() => clearInterval(pollInterval));
    }

    // Re-show message if player hasn't performed the expected action by a certain row.
    // One-shot: fires once, then the poll stops. If they still don't act, piece lands and we advance.
    if (currentStep.setup?.reshowAtRow != null && gameEngine) {
      const threshold = currentStep.setup.reshowAtRow;
      const actionPerformed = { current: false };

      // Track if the expected action was performed (cancels the re-show)
      if (currentStep.setup.reshowUntilAction) {
        const events = ADVANCE_EVENT_MAP[currentStep.setup.reshowUntilAction];
        if (events) {
          const unsubs = events.map(event =>
            gameEventBus.on(event, () => { actionPerformed.current = true; })
          );
          cleanups.push(() => unsubs.forEach(unsub => unsub()));
        }
      }

      const reshowPoll = setInterval(() => {
        // Cancel if action was performed OR piece is currently fast-dropping
        // (isFastDropping check catches keyboard S which doesn't emit INPUT_FAST_DROP on event bus)
        if (actionPerformed.current || gameEngine.isFastDropping) {
          clearInterval(reshowPoll);
          return;
        }
        // Cancel if piece already landed (no active goop)
        if (!gameEngine.state.activeGoop) {
          clearInterval(reshowPoll);
          return;
        }
        const pieceY = gameEngine.state.activeGoop.y ?? 0;
        if (pieceY >= threshold) {
          clearInterval(reshowPoll);
          // Re-pause game and re-show message
          gameEngine.state.isPaused = true;
          gameEngine.freezeFalling = true;
          gameEngine.emitChange();
          setMessageVisible(true);
          // Disarm advance — will re-arm on next dismiss
          advanceArmedRef.current = false;
        }
      }, 150);
      cleanups.push(() => clearInterval(reshowPoll));
    }

    // Pressure-threshold advance: poll PSI and advance when it reaches the target percentage.
    // Used for C1/C1B where pressure must rise to specific levels before next teaching step.
    if (currentStep.setup?.advanceAtPressure != null && gameEngine) {
      const targetPsi = currentStep.setup.advanceAtPressure / 100; // Convert percentage to 0-1
      const pressurePoll = setInterval(() => {
        if (!advanceArmedRef.current) return;

        const maxTime = gameEngine.maxTime ?? 1;
        const psi = maxTime > 0 ? Math.max(0, 1 - (gameEngine.state.shiftTime / maxTime)) : 0;

        if (psi >= targetPsi) {
          clearInterval(pressurePoll);
          advanceStepRef.current();
        }
      }, 250);
      cleanups.push(() => clearInterval(pressurePoll));
    }

    // Pressure-above-pieces advance: poll until pressure line rises above the highest locked goop.
    // Dynamic — works regardless of what pieces are on the board.
    if (currentStep.setup?.advanceWhenPressureAbovePieces && gameEngine) {
      const piecePressurePoll = setInterval(() => {
        if (!advanceArmedRef.current) return;

        const maxTime = gameEngine.maxTime ?? 1;
        const psi = maxTime > 0 ? Math.max(0, 1 - (gameEngine.state.shiftTime / maxTime)) : 0;

        // Pressure line grid row — matches GameBoard.tsx rendering exactly:
        // waterHeightBlocks = 1 + (psi * (VIEWPORT_HEIGHT - 1))
        // In grid coords: pressureLineRow = BUFFER_HEIGHT + (VIEWPORT_HEIGHT - 1) - psi * (VIEWPORT_HEIGHT - 1)
        const pressureLineRow = (TANK_HEIGHT - 1) - (psi * (TANK_VIEWPORT_HEIGHT - 1));

        // Find highest occupied row (lowest Y = highest visually)
        // If advancePressureAboveColor is set, only check cells of that color
        const colorFilter = currentStep.setup?.advancePressureAboveColor ?? null;
        let highestOccupiedRow = TANK_HEIGHT; // Default: nothing on grid
        for (let y = 0; y < TANK_HEIGHT; y++) {
          for (let x = 0; x < gameEngine.state.grid[y].length; x++) {
            const cell = gameEngine.state.grid[y][x];
            if (cell !== null && (colorFilter === null || cell.color === colorFilter)) {
              highestOccupiedRow = y;
              break;
            }
          }
          if (highestOccupiedRow < TANK_HEIGHT) break;
        }

        // Advance when pressure line is above the highest piece
        if (pressureLineRow < highestOccupiedRow) {
          clearInterval(piecePressurePoll);
          advanceStepRef.current();
        }
      }, 250);
      cleanups.push(() => clearInterval(piecePressurePoll));
    }

    // --- Retry on piece land (D2-style: if piece lands without sealing a crack, retry) ---
    if (currentStep.setup?.retryOnPieceLand && gameEngine) {
      const retryConfig = currentStep.setup.retryOnPieceLand;

      // Track crack sealing: GOAL_CAPTURED fires before PIECE_DROPPED during piece lock
      const goalUnsub = gameEventBus.on(GameEventType.GOAL_CAPTURED, () => {
        crackSealedThisCycleRef.current = true;
      });
      cleanups.push(goalUnsub);

      // On piece landing: check if crack was sealed this cycle
      const dropUnsub = gameEventBus.on(GameEventType.PIECE_DROPPED, () => {
        if (crackSealedThisCycleRef.current) {
          crackSealedThisCycleRef.current = false;
          return; // Crack sealed — normal advance handler will fire
        }

        // Piece landed without sealing — staged retry sequence:
        // Phase 1 (immediate): freeze pressure + falling
        // Phase 2 (1s later): pop goop with animation
        // Phase 3 (1.5s after pop): show retry message + spawn new crack/piece

        // Phase 1: Freeze everything immediately
        gameEngine.trainingPressureRate = 0;
        gameEngine.freezeFalling = true;
        gameEngine.emitChange();

        // Phase 2: Pop goop after 1s (let the landed piece sit briefly)
        setTimeout(() => {
          const grid = gameEngine.state.grid;
          for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
              const cell = grid[y][x];
              if (cell) {
                gameEngine.state.poppedGoopGroupIds.add(cell.goopGroupId);
                grid[y][x] = null;
              }
            }
          }
          gameEngine.emitChange();

          // Phase 3: After droplets settle, show message + set up retry
          setTimeout(() => {
            // Spawn extra crack if configured (bottom rows within viewport)
            if (retryConfig.spawnExtraCrack) {
              const crackColor = retryConfig.spawnExtraCrack.color;
              const rotation = gameEngine.state.tankRotation;
              let crackX: number | null = null;
              let crackY: number | null = null;
              for (let attempt = 0; attempt < 30; attempt++) {
                const screenX = Math.floor(Math.random() * TANK_VIEWPORT_WIDTH);
                const gx = normalizeX(rotation + screenX);
                const gy = TANK_HEIGHT - 1 - Math.floor(Math.random() * 2); // bottom 2 rows (22-23)
                const overlaps = gameEngine.state.crackCells.some(c => c.x === gx && c.y === gy);
                if (!overlaps) {
                  crackX = gx;
                  crackY = gy;
                  break;
                }
              }
              if (crackX !== null && crackY !== null) {
                const now = Date.now();
                const crackId = Math.random().toString(36).substr(2, 9);
                const newCrack: Crack = {
                  id: crackId,
                  x: crackX,
                  y: crackY,
                  color: crackColor,
                  originCrackId: [],
                  branchCrackIds: [],
                  lastGrowthCheck: now,
                  crackBranchInterval: 999999,
                  spawnTime: now,
                };
                gameEngine.state.crackCells.push(newCrack);
                gameEngine.state.goalMarks.push({
                  id: crackId,
                  x: crackX,
                  y: crackY,
                  color: crackColor,
                  spawnTime: now,
                });
              }
            }

            // Pause game + show retry message
            gameEngine.state.isPaused = true;
            pauseStartTimeRef.current = Date.now();

            const retryMsg = TRAINING_RETRY_MESSAGES[retryConfig.retryMessageId];
            if (retryMsg) {
              setRetryMessage(retryMsg);
            }
            setMessageVisible(true);
            advanceArmedRef.current = false; // Disarm until dismiss

            // Spawn new piece at top (frozen because paused)
            if (currentStep.setup?.spawnPiece) {
              const spawn = currentStep.setup.spawnPiece;
              const allPieces = [...TETRA_NORMAL, ...PENTA_NORMAL, ...HEXA_NORMAL];
              const shapeTemplate = allPieces.find(p => p.type === spawn.shape);
              if (shapeTemplate) {
                let cells = shapeTemplate.cells.map(c => ({ ...c }));
                if (spawn.rotation && spawn.rotation > 0) {
                  for (let r = 0; r < spawn.rotation; r++) {
                    cells = getRotatedCells(cells, true);
                  }
                }
                const template: GoopTemplate = { type: spawn.shape, cells, color: spawn.color };
                gameEngine.spawnNewPiece(template);
              }
            }

            gameEngine.emitChange();
            crackSealedThisCycleRef.current = false;
          }, 1500); // Wait for droplets to settle
        }, 1000); // Wait 1s before popping
      });
      cleanups.push(dropUnsub);
    }

    // Tap advances are handled by overlay buttons, not event listeners
    if (advance.type === 'tap') {
      return cleanups.length > 0 ? () => cleanups.forEach(fn => fn()) : undefined;
    }

    // Auto-advance after a fixed delay
    if (advance.type === 'auto') {
      const timer = setTimeout(() => {
        advanceStepRef.current();
      }, advance.delayMs);
      cleanups.push(() => clearTimeout(timer));
      return () => cleanups.forEach(fn => fn());
    }

    // Determine which game events to listen for
    let eventKey: string | undefined;
    if (advance.type === 'action') {
      // Special case: drag-periscope is handled by GAME_START event
      if (advance.action === 'drag-periscope') {
        const unsub = gameEventBus.on(GameEventType.GAME_START, () => {
          if (advanceArmedRef.current) {
            advanceStepRef.current();
          }
        });
        cleanups.push(unsub);
        return () => cleanups.forEach(fn => fn());
      }
      eventKey = advance.action;
    } else if (advance.type === 'event') {
      eventKey = advance.event;
    }

    const gameEvents = eventKey ? ADVANCE_EVENT_MAP[eventKey] : undefined;

    if (gameEvents && gameEvents.length > 0) {
      // Listen for mapped game events (only advance when armed)
      const unsubs = gameEvents.map(event =>
        gameEventBus.on(event, () => {
          if (advanceArmedRef.current) {
            advanceStepRef.current();
          }
        })
      );
      cleanups.push(() => unsubs.forEach(unsub => unsub()));
    } else if (!currentStep.setup?.advanceAtRow) {
      // Unmapped event/action with no position advance — auto-advance after timeout as fallback
      const timer = setTimeout(() => {
        advanceStepRef.current();
      }, AUTO_ADVANCE_FALLBACK_MS);
      cleanups.push(() => clearTimeout(timer));
    }

    return () => cleanups.forEach(fn => fn());
  }, [currentStep?.id, isInTraining]);

  // --- Sync allowed controls to engine on step change ---
  useEffect(() => {
    if (!gameEngine) return;

    if (isInTraining && currentStep?.setup?.allowedControls) {
      gameEngine.trainingAllowedControls = currentStep.setup.allowedControls;
    } else {
      gameEngine.trainingAllowedControls = null; // All controls allowed
    }
  }, [gameEngine, currentStep?.id, isInTraining]);

  // --- Sync pressure rate to engine on step change ---
  useEffect(() => {
    if (!gameEngine) return;

    if (isInTraining && currentStep?.setup?.pressureRate != null) {
      gameEngine.trainingPressureRate = currentStep.setup.pressureRate;
    } else {
      gameEngine.trainingPressureRate = 0; // Default: pressure frozen
    }
  }, [gameEngine, currentStep?.id, isInTraining]);

  // --- Sync highlight color to engine on step change ---
  useEffect(() => {
    if (!gameEngine) return;

    if (isInTraining && currentStep?.setup?.highlightGoopColor) {
      gameEngine.trainingHighlightColor = currentStep.setup.highlightGoopColor;
    } else {
      gameEngine.trainingHighlightColor = null;
    }
  }, [gameEngine, currentStep?.id, isInTraining]);

  // Subscribe to TRAINING_SCENARIO_COMPLETE event for cleanup
  useEffect(() => {
    const unsub = gameEventBus.on(GameEventType.TRAINING_SCENARIO_COMPLETE, () => {
      if (gameEngine) {
        gameEngine.isTrainingMode = false;
        gameEngine.pendingTrainingPalette = null;
        gameEngine.trainingAllowedControls = null;
        gameEngine.trainingPressureRate = 0;
        gameEngine.trainingHighlightColor = null;
        gameEngine.freezeFalling = false;
      }
    });
    return unsub;
  }, [gameEngine]);

  // --- Build display step for TutorialOverlay ---
  // Returns a message-compatible object when there's a training message to show
  const trainingDisplayStep: { message: IntercomMessage } | null =
    currentStep && messageVisible
      ? { message: retryMessage ?? TRAINING_MESSAGES[currentStep.id] ?? { keywords: [], fullText: currentStep.name } }
      : null;

  // Message position for the current training step (default: 'center')
  const messagePosition = currentStep?.setup?.messagePosition ?? 'center';

  // Highlight color for the current step (null = no highlight)
  const highlightColor = (isInTraining && currentStep?.setup?.highlightGoopColor) || null;

  return {
    currentStep,
    isInTraining,
    isTrainingDone: trainingDone,
    completedStepIds: completedSteps,
    advanceStep,
    dismissMessage,
    trainingDisplayStep,
    messagePosition,
    highlightColor,
    canDismiss,
  };
};

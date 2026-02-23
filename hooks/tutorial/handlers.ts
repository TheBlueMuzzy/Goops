/**
 * Tutorial v3 — Handler Registry
 *
 * Steps with custom behavior register handlers. The handler registry
 * returns the correct handler based on the step's `handlerType` field.
 *
 * Handlers:
 *   standardHandler    → used by most steps (patterns 1-5)
 *   retryHandler       → D2 (accumulating cracks on retry) — stub, plan 33-07
 *   discoveryHandler   → D3 (persistent arrow listener) — stub, plan 33-07
 *   continuousHandler  → E1 (continuous spawn + event-driven) — stub, plan 33-07
 *   freePlayHandler    → F1 (pressure cap cycle, overflow, swipe-up) — stub, plan 33-07
 */

import { GameEngine } from '../../core/GameEngine';
import { TrainingStep, HandlerType } from '../../types/training';
import { TimeoutPool } from './timeoutPool';
import { StepStateMachine } from './stateMachine';

// --- Handler Interface ---

/**
 * A step handler manages the lifecycle of a training step.
 *
 * `setup()` is called when the step begins. It should:
 * - Configure engine state (pressure, controls, highlights)
 * - Set up event listeners and timers
 * - Manage message visibility and pause state
 *
 * `cleanup()` is called when the step ends. It should:
 * - Remove event listeners
 * - Clean up any state it created
 * (Note: the timeout pool is cleared separately by the orchestrator)
 */
export interface StepHandler {
  setup(context: HandlerContext): (() => void)[];
  cleanup(): void;
}

/**
 * Context passed to handler setup.
 * Contains everything a handler needs to manage a step.
 */
export interface HandlerContext {
  step: TrainingStep;
  engine: GameEngine;
  pool: TimeoutPool;
  stateMachine: StepStateMachine;
  // Callbacks provided by the orchestrator
  onShowMessage: () => void;
  onDismissMessage: () => void;
  onArmAdvance: () => void;
  onAdvance: () => void;
  onSetMessageVisible: (visible: boolean) => void;
  onSetCanDismiss: (canDismiss: boolean) => void;
  onSetRetryMessage: (message: { keywords: string[]; fullText: string } | null) => void;
}

// --- Standard Handler ---

/**
 * Standard handler — covers most training steps.
 *
 * Implements patterns 1-5 from Tutorial3.md:
 * 1. Pause-Show-Dismiss-Unpause (pauseGame: true steps)
 * 2. Run-Act-Advance (pauseGame: false steps)
 * 3. Hint Safety Net (hintDelay: wait N ms, show if no action)
 * 4. Position-Gated (advanceAtRow, showWhenPieceBelow)
 * 5. Pressure-Gated (advanceWhenPressureAbovePieces)
 *
 * This handler reads the step config and sets up the appropriate
 * timers, polls, and event listeners. Custom handlers (plan 33-07)
 * handle steps that need behavior beyond these patterns.
 */
export function createStandardHandler(): StepHandler {
  let cleanupFns: (() => void)[] = [];

  return {
    setup(context: HandlerContext): (() => void)[] {
      // Standard handler setup is managed by the orchestrator's
      // step-change effect in useTrainingFlow.ts. The orchestrator
      // reads step config and uses the state machine + timeout pool
      // to implement the standard patterns.
      //
      // This handler exists as the registry entry point. The actual
      // pattern logic lives in the orchestrator because it needs
      // access to React state setters and the game engine, which
      // are tightly coupled to the hook lifecycle.
      //
      // Custom handlers (plan 33-07) will override this with their
      // own setup logic that intercepts the standard flow.
      cleanupFns = [];
      return cleanupFns;
    },

    cleanup() {
      cleanupFns.forEach(fn => fn());
      cleanupFns = [];
    },
  };
}

// --- Custom Handler Stubs (Plan 33-07) ---

/**
 * Retry handler stub — D2 tank rotation.
 * Accumulates cracks on failed attempts.
 * Implementation in plan 33-07.
 */
export function createRetryHandler(): StepHandler {
  return {
    setup(_context: HandlerContext): (() => void)[] {
      // Plan 33-07: D2 retry logic
      // - Watch for PIECE_DROPPED without GOAL_CAPTURED
      // - On miss: keep old cracks, spawn extra crack near bottom
      // - Respawn piece, show retry message
      // - On crack-sealed: advance
      return [];
    },
    cleanup() {},
  };
}

/**
 * Discovery handler stub — D3 offscreen.
 * Persistent CRACK_OFFSCREEN listener that fires once.
 * Implementation in plan 33-07.
 */
export function createDiscoveryHandler(): StepHandler {
  return {
    setup(_context: HandlerContext): (() => void)[] {
      // Plan 33-07: D3 discovery logic
      // - Listen for CRACK_OFFSCREEN event
      // - Fires once, ever. Interrupts current step.
      // - Pauses, shows D3 message, player acknowledges
      // - Resumes current step. D3 marked complete permanently.
      return [];
    },
    cleanup() {},
  };
}

/**
 * Continuous handler stub — E1 seal crack.
 * Continuous spawn + GOAL_CAPTURED event-driven flow.
 * Implementation in plan 33-07.
 */
export function createContinuousHandler(): StepHandler {
  return {
    setup(_context: HandlerContext): (() => void)[] {
      // Plan 33-07: E1 continuous logic
      // - Continuous piece spawn after each landing
      // - On GOAL_CAPTURED: suppress spawn, freeze falling
      // - Standard hint pattern: wait 3s, show if no pop
      // - On pop: crack sealed, advance
      return [];
    },
    cleanup() {},
  };
}

/**
 * Free play handler stub — F1 graduation.
 * Pressure cap cycle, overflow detection, swipe-up exit.
 * Implementation in plan 33-07.
 */
export function createFreePlayHandler(): StepHandler {
  return {
    setup(_context: HandlerContext): (() => void)[] {
      // Plan 33-07: F1 freeplay logic
      // - Continuous pieces + periodic cracks
      // - Pressure cap at 95% → pause + ending message
      // - Overflow → freeze + ending message
      // - Swipe-up to exit (gated on ending state)
      // - Re-cap cycle if pressure drops and rises again
      return [];
    },
    cleanup() {},
  };
}

// --- Handler Registry ---

/**
 * Get the handler for a step based on its handlerType.
 *
 * Standard handler covers most steps. Custom handlers handle
 * steps that need behavior beyond the standard patterns.
 */
export function getHandler(handlerType: HandlerType): StepHandler {
  switch (handlerType) {
    case 'standard':
      return createStandardHandler();
    case 'retry':
      return createRetryHandler();
    case 'discovery':
      return createDiscoveryHandler();
    case 'continuous':
      return createContinuousHandler();
    case 'freeplay':
      return createFreePlayHandler();
    default:
      return createStandardHandler();
  }
}

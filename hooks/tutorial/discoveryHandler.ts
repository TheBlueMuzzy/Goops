/**
 * Tutorial v3 — Discovery Handler (D3_OFFSCREEN)
 *
 * Pattern 8: Discovery Interrupt — PARALLEL listener, not a step handler.
 *
 * Behavior:
 * - NOT a normal step handler. This is a cross-step listener.
 * - Active during D2, E1, E2, F1 (steps with cracks after D1)
 * - Listens for CRACK_OFFSCREEN event
 * - On fire: interrupt current step -> pause -> show D3 message
 * - Player acknowledges -> resume current step exactly where it was
 * - Fires ONCE ever. Stored in completedSteps (persisted).
 *
 * The orchestrator calls setupDiscoveryListener() separately from
 * normal handler setup. It runs parallel to whatever step is active.
 *
 * All timeouts via pool. No raw setTimeout/setInterval.
 */

import { StepHandler, HandlerContext } from './handlers';
import { gameEventBus } from '../../core/events/EventBus';
import { GameEventType } from '../../core/events/GameEvents';
import { TRAINING_MESSAGES } from '../../data/tutorialSteps';
import { TANK_WIDTH, TANK_VIEWPORT_WIDTH } from '../../constants';

// Steps where D3 discovery can fire (have cracks + rotation)
const D3_ELIGIBLE_STEPS = ['D2_TANK_ROTATION', 'E1_SEAL_CRACK', 'E2_SCAFFOLDING', 'F1_GRADUATION'];

/**
 * Check if any crack is offscreen from the current viewport.
 */
function isAnyCrackOffscreen(engine: any): boolean {
  const cracks = engine.state.crackCells;
  if (cracks.length === 0) return false;
  const rot = engine.state.tankRotation;
  return cracks.some((c: any) => {
    let visX = c.x - rot;
    if (visX > TANK_WIDTH / 2) visX -= TANK_WIDTH;
    if (visX < -TANK_WIDTH / 2) visX += TANK_WIDTH;
    return visX < 0 || visX >= TANK_VIEWPORT_WIDTH;
  });
}

/**
 * The discovery "handler" is registered for the D3_OFFSCREEN step.
 * Its setup() is a no-op — the real behavior is in the parallel listener.
 * The orchestrator calls setupDiscoveryListener() instead.
 */
export function createDiscoveryHandler(): StepHandler {
  return {
    setup(_ctx: HandlerContext): (() => void)[] {
      // D3 is handled as a parallel listener, not normal step setup.
      // When D3 is the current step, it auto-skips after autoSkipMs
      // if it hasn't been triggered yet. The actual trigger logic
      // runs in setupDiscoveryListener() across multiple steps.
      return [];
    },
    cleanup() {},
  };
}

/**
 * Set up the persistent D3 discovery listener.
 * Called by the orchestrator during eligible steps (D2, E1, E2, F1).
 * Returns a cleanup function to remove the listener.
 *
 * This is NOT part of the handler interface — it's a standalone function
 * the orchestrator calls in parallel with the current step's handler.
 */
export function setupDiscoveryListener(ctx: HandlerContext): (() => void) | null {
  const { step, engine, pool, onSetRetryMessage, onSetMessageVisible,
          onSetPauseStartTime, onSetDiscoveryInterrupt, onMarkStepComplete,
          getCompletedSteps, getF1Ending } = ctx;

  // Only eligible during certain steps
  if (!D3_ELIGIBLE_STEPS.includes(step.id)) return null;

  // Already completed — don't set up listener
  const completed = getCompletedSteps();
  if (completed.includes('D3_OFFSCREEN')) return null;

  // No cracks to go offscreen
  if (engine.state.crackCells.length === 0) return null;

  // Poll for offscreen cracks (200ms interval)
  pool.setInterval('d3-discovery', () => {
    // Don't trigger during F1 endings or active interrupts
    if (getF1Ending() !== 'none') return;
    if (engine.state.isPaused) return;

    if (isAnyCrackOffscreen(engine)) {
      pool.clear('d3-discovery');
      onSetDiscoveryInterrupt(true);

      // Show D3 message as interrupt
      onSetRetryMessage(TRAINING_MESSAGES.D3_OFFSCREEN);
      onSetMessageVisible(true);

      // Pause engine
      engine.state.isPaused = true;
      engine.freezeFalling = true;
      onSetPauseStartTime(Date.now());
      engine.emitChange();

      // Mark D3 complete + WRAP_INTRO
      onMarkStepComplete('D3_OFFSCREEN');
      onMarkStepComplete('WRAP_INTRO');
    }
  }, 200);

  return () => {
    pool.clear('d3-discovery');
  };
}

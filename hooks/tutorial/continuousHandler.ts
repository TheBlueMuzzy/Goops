/**
 * Tutorial v3 — Continuous Handler (E1_SEAL_CRACK)
 *
 * Manages continuous spawn + crack sealing flow:
 *
 * Behavior:
 * - Continuous spawn: after each PIECE_DROPPED, spawn next piece (300ms delay)
 * - On GOAL_CAPTURED (crack plugged):
 *   - Suppress continuous spawn (no more new pieces)
 *   - Freeze falling pieces
 *   - Start hint timer (hintDelay from config, default 3000ms)
 *     - If player pops within hintDelay: skip message, advance
 *     - If hintDelay passes: show "Pop to seal" (non-dismissible),
 *       pause pressure, green highlight
 *     - If player pops after message: close message, advance
 * - On GOOP_POPPED after plug: mark E2 complete (skip), advance
 * - Safety: autoSkipMs handled by orchestrator
 *
 * All timeouts via pool. No raw setTimeout/setInterval.
 */

import { StepHandler, HandlerContext } from './handlers';
import { gameEventBus } from '../../core/events/EventBus';
import { GameEventType } from '../../core/events/GameEvents';
import { COLORS } from '../../constants';

export function createContinuousHandler(): StepHandler {
  let cleanupFns: (() => void)[] = [];
  let crackPlugged = false;
  let spawnSuppressed = false;

  return {
    setup(ctx: HandlerContext): (() => void)[] {
      const { step, engine, pool, onAdvance, onSetMessageVisible,
              onSetCanDismiss, onSuppressContinuousSpawn,
              onMarkStepComplete } = ctx;
      cleanupFns = [];
      crackPlugged = false;
      spawnSuppressed = false;

      // --- Continuous spawn: next piece after each landing ---
      const spawnUnsub = gameEventBus.on(GameEventType.PIECE_DROPPED, () => {
        if (spawnSuppressed) return;

        pool.set('continuous-deferred', () => {
          if (engine.state.activeGoop) return;
          if (spawnSuppressed) return;

          engine.state.isPaused = false;
          engine.freezeFalling = false;
          engine.emitChange();

          pool.set('continuous-spawn', () => {
            if (spawnSuppressed) return;
            if (engine.isSessionActive && !engine.state.isPaused && !engine.state.activeGoop) {
              engine.spawnNewPiece();
              engine.emitChange();
            }
          }, 300);
        }, 0);
      });
      cleanupFns.push(spawnUnsub);

      // Kick-start: spawn first piece if none active
      if (!engine.state.activeGoop && step.pauseGame === false) {
        pool.set('continuous-init', () => {
          if (spawnSuppressed) return;
          if (engine.isSessionActive && !engine.state.isPaused && !engine.state.activeGoop) {
            engine.spawnNewPiece();
            engine.emitChange();
          }
        }, 300);
      }

      // --- GOAL_CAPTURED: crack plugged, start hint pattern ---
      const goalUnsub = gameEventBus.on(GameEventType.GOAL_CAPTURED, () => {
        crackPlugged = true;
        spawnSuppressed = true;
        onSuppressContinuousSpawn(true);
        engine.freezeFalling = true;
        engine.emitChange();

        // Let the fill animation render
        pool.set('e1-unpause', () => {
          engine.state.isPaused = false;
          engine.freezeFalling = true;
          engine.emitChange();
        }, 0);

        // Clear any pending message delay timer
        pool.clear('message-delay');

        // Hint timer: wait hintDelay, then show message
        const hintDelay = step.setup?.hintDelay ?? 3000;
        pool.set('e1-hint', () => {
          onSetMessageVisible(true);
          onSetCanDismiss(false);
          engine.trainingHighlightColor = COLORS.GREEN;
          engine.trainingPressureRate = 0;
          engine.emitChange();

          // Auto-advance fallback after hint shows
          pool.set('e1-auto-advance', () => {
            if (crackPlugged) {
              onAdvance();
            }
          }, 3000);
        }, hintDelay);
      });
      cleanupFns.push(goalUnsub);

      // --- GOOP_POPPED: if crack was plugged, advance (skip E2) ---
      const popUnsub = gameEventBus.on(GameEventType.GOOP_POPPED, () => {
        if (!crackPlugged) return;
        pool.clear('e1-hint');
        pool.clear('e1-auto-advance');

        // Mark E2 complete so getNextTrainingStep skips it
        onMarkStepComplete('E2_SCAFFOLDING');
        onAdvance();
      });
      cleanupFns.push(popUnsub);

      return cleanupFns;
    },

    cleanup() {
      cleanupFns.forEach(fn => fn());
      cleanupFns = [];
      crackPlugged = false;
      spawnSuppressed = false;
    },
  };
}

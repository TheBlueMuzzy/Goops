/**
 * Tutorial v3 — Free Play Handler (F1_GRADUATION)
 *
 * After graduation message dismiss:
 * - Continuous piece spawn + periodic cracks (every periodicCrackIntervalMs)
 * - Pressure rises at normal rate (pressureRate from config)
 *
 * Pressure Cap (pressureCap from config, default 0.95):
 * - Poll pressure every 250ms
 * - When PSI >= cap: freeze pressure, show PRESSURE_CAP message, enable swipe-up
 * - If player pops (drops below cap): resume pressure, hide message
 * - If re-cap (hits cap again): repeat cycle
 *
 * Overflow:
 * - Listen for GAME_OVER event
 * - Freeze everything, show OVERFLOW message, enable swipe-up
 *
 * Swipe-up exit:
 * - Listen for INPUT_SWIPE_UP, gated on ending state
 * - Exit training -> console, rank 0 -> 1
 *
 * All timeouts via pool. No raw setTimeout/setInterval.
 */

import { StepHandler, HandlerContext } from './handlers';
import { gameEventBus } from '../../core/events/EventBus';
import { GameEventType } from '../../core/events/GameEvents';
import { F1_ENDING_MESSAGES } from '../../data/tutorialSteps';

export function createFreePlayHandler(): StepHandler {
  let cleanupFns: (() => void)[] = [];

  return {
    setup(ctx: HandlerContext): (() => void)[] {
      const { step, engine, pool, onAdvance, onSetRetryMessage,
              onSetMessageVisible, onSetCanDismiss, onArmAdvance,
              onSetPauseStartTime, onSetF1Ending, getF1Ending,
              onSuppressContinuousSpawn, spawnRandomCrack } = ctx;
      cleanupFns = [];

      const capValue = step.setup?.pressureCap ?? 0.95;

      // --- Continuous spawn: next piece after each landing ---
      const spawnUnsub = gameEventBus.on(GameEventType.PIECE_DROPPED, () => {
        if (getF1Ending() !== 'none') return;

        pool.set('continuous-deferred', () => {
          if (engine.state.activeGoop) return;
          if (getF1Ending() !== 'none') return;

          engine.state.isPaused = false;
          engine.freezeFalling = false;
          engine.emitChange();

          pool.set('continuous-spawn', () => {
            if (getF1Ending() !== 'none') return;
            if (engine.isSessionActive && !engine.state.isPaused && !engine.state.activeGoop) {
              engine.spawnNewPiece();
              engine.emitChange();
            }
          }, 300);
        }, 0);
      });
      cleanupFns.push(spawnUnsub);

      // --- Periodic crack spawning ---
      if (step.setup?.periodicCrackIntervalMs) {
        pool.setInterval('periodic-cracks', () => {
          if (getF1Ending() !== 'none') return;
          if (engine.isSessionActive) {
            spawnRandomCrack(engine);
          }
        }, step.setup.periodicCrackIntervalMs);
      }

      // --- Pressure cap watcher ---
      pool.setInterval('pressure-cap', () => {
        const maxTime = engine.maxTime ?? 1;
        const psi = maxTime > 0 ? Math.max(0, 1 - (engine.state.shiftTime / maxTime)) : 0;

        if (psi >= capValue && getF1Ending() === 'none') {
          pool.clear('pressure-cap');

          // Freeze pressure
          engine.trainingPressureRate = 0;
          engine.emitChange();

          // Show pressure cap ending
          onSetF1Ending('pressure-cap');
          onSetRetryMessage(F1_ENDING_MESSAGES.PRESSURE_CAP);
          onSetMessageVisible(true);
          onSetCanDismiss(true);
          onArmAdvance();
        }
      }, 250);

      // --- Overflow detection ---
      const overflowUnsub = gameEventBus.on(GameEventType.GAME_OVER, () => {
        if (getF1Ending() !== 'none') return;

        onSetF1Ending('overflow');

        engine.state.isPaused = true;
        engine.freezeFalling = true;
        engine.trainingPressureRate = 0;
        engine.emitChange();

        onSetRetryMessage(F1_ENDING_MESSAGES.OVERFLOW);
        onSetMessageVisible(true);
        onSetCanDismiss(false);
        onArmAdvance();
      });
      cleanupFns.push(overflowUnsub);

      // --- Swipe-up exit (gated on ending state) ---
      const swipeUnsub = gameEventBus.on(GameEventType.INPUT_SWIPE_UP, () => {
        if (getF1Ending() !== 'none') {
          onAdvance();
        }
      });
      cleanupFns.push(swipeUnsub);

      return cleanupFns;
    },

    cleanup() {
      cleanupFns.forEach(fn => fn());
      cleanupFns = [];
    },
  };
}

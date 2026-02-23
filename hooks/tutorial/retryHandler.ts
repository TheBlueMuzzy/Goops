/**
 * Tutorial v3 — Retry Handler (D2_TANK_ROTATION)
 *
 * Pattern 7: Retry with Accumulating Cracks
 *
 * Behavior:
 * - Tracks GOAL_CAPTURED to know if crack was plugged this cycle
 * - On PIECE_DROPPED without plug: pop all goop, keep cracks, add new
 *   green crack near bottom, respawn piece, show retry message
 * - On GOAL_CAPTURED: wait hintDelay. If no pop -> show hint. Pop -> advance.
 * - On GOOP_POPPED after plug: advance
 *
 * All timeouts via pool. No raw setTimeout/setInterval.
 */

import { StepHandler, HandlerContext } from './handlers';
import { gameEventBus } from '../../core/events/EventBus';
import { GameEventType } from '../../core/events/GameEvents';
import { TRAINING_RETRY_MESSAGES } from '../../data/tutorialSteps';
import { TANK_VIEWPORT_WIDTH, TANK_HEIGHT, COLORS } from '../../constants';
import { normalizeX } from '../../utils/coordinates';

export function createRetryHandler(): StepHandler {
  let cleanupFns: (() => void)[] = [];
  let crackPluggedThisCycle = false;

  return {
    setup(ctx: HandlerContext): (() => void)[] {
      const { step, engine, pool, onAdvance, onSetRetryMessage,
              onSetMessageVisible, onSetCanDismiss, onSetPauseStartTime,
              spawnPieceFromConfig, addCrackToGrid } = ctx;
      cleanupFns = [];
      crackPluggedThisCycle = false;

      // Track GOAL_CAPTURED — crack plugged by matching goop
      const goalUnsub = gameEventBus.on(GameEventType.GOAL_CAPTURED, () => {
        crackPluggedThisCycle = true;

        // Start hint pattern: wait hintDelay, show if no pop
        const hintDelay = step.setup?.hintDelay ?? 3000;
        pool.set('hint-timer', () => {
          onSetMessageVisible(true);
          onSetCanDismiss(false);
          engine.trainingHighlightColor = COLORS.GREEN;
          engine.trainingPressureRate = 0;
          engine.emitChange();
        }, hintDelay);
      });
      cleanupFns.push(goalUnsub);

      // Track GOOP_POPPED — if crack was plugged, advance
      const popUnsub = gameEventBus.on(GameEventType.GOOP_POPPED, () => {
        if (!crackPluggedThisCycle) return;
        pool.clear('hint-timer');
        onAdvance();
      });
      cleanupFns.push(popUnsub);

      // Track PIECE_DROPPED — if crack NOT plugged, retry
      const dropUnsub = gameEventBus.on(GameEventType.PIECE_DROPPED, () => {
        if (crackPluggedThisCycle) {
          crackPluggedThisCycle = false;
          return;
        }

        // Retry sequence via pool
        pool.set('retry-phase1', () => {
          if (engine.state.activeGoop) return;

          // Phase 1: Unpause for fill animation, freeze pressure
          engine.state.isPaused = false;
          engine.freezeFalling = false;
          engine.trainingPressureRate = 0;
          engine.emitChange();

          // Phase 2: Wait for fill, then pop all goop
          pool.set('retry-phase2', () => {
            engine.freezeFalling = true;
            const grid = engine.state.grid;
            for (let y = 0; y < grid.length; y++) {
              for (let x = 0; x < grid[y].length; x++) {
                const cell = grid[y][x];
                if (cell) {
                  engine.state.poppedGoopGroupIds.add(cell.goopGroupId);
                  grid[y][x] = null;
                }
              }
            }
            engine.emitChange();

            // Phase 3: Wait for droplets, show retry + spawn extra crack
            pool.set('retry-phase3', () => {
              const retryConfig = step.setup?.retryOnPieceLand;
              if (retryConfig?.spawnExtraCrack) {
                const crackColor = retryConfig.spawnExtraCrack.color;
                const rotation = engine.state.tankRotation;
                for (let attempt = 0; attempt < 30; attempt++) {
                  const screenX = Math.floor(Math.random() * TANK_VIEWPORT_WIDTH);
                  const gx = normalizeX(rotation + screenX);
                  const gy = TANK_HEIGHT - 1 - Math.floor(Math.random() * 2);
                  const overlaps = engine.state.crackCells.some(
                    (c: any) => c.x === gx && c.y === gy
                  );
                  if (!overlaps) {
                    addCrackToGrid(engine, gx, gy, crackColor, 'retry-extra-crack');
                    break;
                  }
                }
              }

              engine.state.isPaused = true;
              onSetPauseStartTime(Date.now());
              const retryMsg = TRAINING_RETRY_MESSAGES[retryConfig?.retryMessageId ?? 'D2_RETRY'];
              if (retryMsg) onSetRetryMessage(retryMsg);
              onSetMessageVisible(true);

              // Respawn piece
              spawnPieceFromConfig(engine, step);
              engine.emitChange();
              crackPluggedThisCycle = false;
            }, 2000);
          }, 2000);
        }, 0);
      });
      cleanupFns.push(dropUnsub);

      return cleanupFns;
    },

    cleanup() {
      cleanupFns.forEach(fn => fn());
      cleanupFns = [];
    },
  };
}

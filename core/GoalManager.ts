
import { GameState, GoalMark, Crack, ActivePiece, FloatingText, TankCell } from '../types';
import { spawnGoalMark, normalizeX } from '../utils/gameLogic';
import { gameEventBus } from './events/EventBus';
import { GameEventType } from './events/GameEvents';
import { audio } from '../utils/audio';
import { calculateRankDetails } from '../utils/progression';

const GOAL_SPAWN_INTERVAL = 5000;

/**
 * Manages goal spawning and capture/destroy handling.
 * Operates on state passed to it (doesn't own state).
 */
export class GoalManager {
    /**
     * Try to spawn a new goal mark if conditions are met.
     * Returns the new goal (if any) and updated lastSpawnTime.
     * This is the legacy function - use trySpawnCrack for new Crack system.
     */
    trySpawnGoal(
        state: GameState,
        grid: TankCell[][],
        initialTotalScore: number,
        timeLeft: number,
        maxTime: number,
        lastSpawnTime: number
    ): { goal: GoalMark | null; newLastSpawnTime: number } {
        // Don't spawn if we've already cleared enough goals
        if (state.goalsCleared >= state.goalsTarget) {
            return { goal: null, newLastSpawnTime: lastSpawnTime };
        }

        // Check if enough time has passed
        const now = Date.now();
        if (now - lastSpawnTime <= GOAL_SPAWN_INTERVAL) {
            return { goal: null, newLastSpawnTime: lastSpawnTime };
        }

        // Calculate current rank for goal color palette
        const currentRank = calculateRankDetails(initialTotalScore + state.shiftScore).rank;

        // Check if CRACK_DOWN is active (crackDownRemaining > 0)
        const crackDownActive = state.crackDownRemaining > 0;

        // Try to spawn a goal
        const newGoal = spawnGoalMark(grid, state.goalMarks, currentRank, timeLeft, maxTime, crackDownActive);

        if (newGoal) {
            // Decrement CRACK_DOWN counter if active
            if (crackDownActive) {
                state.crackDownRemaining--;
            }
            audio.playPop(1);
            return { goal: newGoal, newLastSpawnTime: now };
        }

        return { goal: null, newLastSpawnTime: now };
    }

    /**
     * Try to spawn a new Crack if conditions are met.
     * Creates a root crack cell (no parents) with random growth interval.
     */
    trySpawnCrack(
        state: GameState,
        grid: TankCell[][],
        initialTotalScore: number,
        timeLeft: number,
        maxTime: number,
        lastSpawnTime: number
    ): { crack: Crack | null; newLastSpawnTime: number } {
        // Don't spawn if we've already cleared enough goals
        if (state.goalsCleared >= state.goalsTarget) {
            return { crack: null, newLastSpawnTime: lastSpawnTime };
        }

        // Check if enough time has passed
        const now = Date.now();
        if (now - lastSpawnTime <= GOAL_SPAWN_INTERVAL) {
            return { crack: null, newLastSpawnTime: lastSpawnTime };
        }

        // Calculate current rank for goal color palette
        const currentRank = calculateRankDetails(initialTotalScore + state.shiftScore).rank;

        // Check if CRACK_DOWN is active (crackDownRemaining > 0)
        const crackDownActive = state.crackDownRemaining > 0;

        // Use existing spawnGoalMark to get position/color, then convert to Crack
        // Pass crackCells converted to GoalMark format for position checking
        const existingMarks = state.crackCells.map(c => ({
            id: c.id,
            x: c.x,
            y: c.y,
            color: c.color,
            spawnTime: c.spawnTime
        }));

        const newGoal = spawnGoalMark(grid, existingMarks, currentRank, timeLeft, maxTime, crackDownActive);

        if (newGoal) {
            console.log(`[CRACK] SPAWN via GoalManager at (${newGoal.x}, ${newGoal.y}) color=${newGoal.color} source="GoalManager-trySpawnCrack" time=${new Date().toLocaleTimeString()}`);
            // Convert GoalMark to Crack
            const newCrack: Crack = {
                id: newGoal.id,
                x: newGoal.x,
                y: newGoal.y,
                color: newGoal.color,
                originCrackId: [],  // Root crack - no parents
                branchCrackIds: [],   // No children yet
                lastGrowthCheck: now,
                crackBranchInterval: 7000 + Math.random() * 5000,  // Random 7-12 seconds
                spawnTime: newGoal.spawnTime
            };

            // Decrement CRACK_DOWN counter if active
            if (crackDownActive) {
                state.crackDownRemaining--;
            }
            audio.playPop(1);
            return { crack: newCrack, newLastSpawnTime: now };
        }

        return { crack: null, newLastSpawnTime: now };
    }

    /**
     * Handle consumed and destroyed goals after piece lock.
     * Creates floating text for captures and emits events.
     */
    handleGoals(
        state: GameState,
        consumed: string[],
        destroyed: string[],
        piece: ActivePiece,
        emitChange: () => void
    ): void {
        // Two-step sealing: mark as plugged (don't remove yet — sealed on pop)
        consumed.forEach(id => {
            const goal = state.goalMarks.find(g => g.id === id);
            if (goal) goal.plugged = true;
            const crack = state.crackCells.find(c => c.id === id);
            if (crack) (crack as any).plugged = true;
        });

        if (consumed.length > 0) {
            const cx = normalizeX(piece.x);
            const cy = Math.floor(piece.y);
            const textId = Math.random().toString(36).substr(2, 9);

            state.floatingTexts.push({
                id: textId,
                text: 'Plugged!',
                x: cx,
                y: cy,
                life: 1,
                color: '#facc15'
            });

            setTimeout(() => {
                state.floatingTexts = state.floatingTexts.filter(ft => ft.id !== textId);
                emitChange();
            }, 1000);

            gameEventBus.emit(GameEventType.GOAL_PLUGGED, { count: consumed.length });
        }
        // destroyed goals (non-matching color) are ignored - crack persists
    }

    /**
     * Handle consumed cracks using the new Crack system.
     * Only removes the specific cells that were covered by matching goop.
     * Remaining crack cells stay and can continue spreading from uncovered cells.
     */
    handleCrackConsumption(
        state: GameState,
        consumedIds: string[],
        piece: ActivePiece,
        emitChange: () => void
    ): void {
        if (consumedIds.length === 0) return;

        // Two-step sealing: mark as plugged (don't remove yet — sealed on pop)
        consumedIds.forEach(id => {
            const goal = state.goalMarks.find(g => g.id === id);
            if (goal) goal.plugged = true;
            const crack = state.crackCells.find(c => c.id === id);
            if (crack) (crack as any).plugged = true;
        });

        const cx = normalizeX(piece.x);
        const cy = Math.floor(piece.y);
        const textId = Math.random().toString(36).substr(2, 9);

        state.floatingTexts.push({
            id: textId,
            text: consumedIds.length > 1 ? `Plugged ${consumedIds.length}` : 'Plugged!',
            x: cx,
            y: cy,
            life: 1,
            color: '#facc15'
        });

        setTimeout(() => {
            state.floatingTexts = state.floatingTexts.filter(ft => ft.id !== textId);
            emitChange();
        }, 1000);

        gameEventBus.emit(GameEventType.GOAL_PLUGGED, { count: consumedIds.length });
    }

    /**
     * Count the number of connected crack groups (connected components).
     * Max 8 crack groups enforced.
     */
    countCracks(crackCells: Crack[]): number {
        if (crackCells.length === 0) return 0;

        const visited = new Set<string>();
        let componentCount = 0;

        for (const cell of crackCells) {
            if (visited.has(cell.id)) continue;

            // BFS/DFS to mark all connected cells
            const queue = [cell.id];
            while (queue.length > 0) {
                const currentId = queue.shift()!;
                if (visited.has(currentId)) continue;
                visited.add(currentId);

                const current = crackCells.find(c => c.id === currentId);
                if (!current) continue;

                // Add all connected cells (parents and children)
                current.originCrackId.forEach(pid => {
                    if (!visited.has(pid)) queue.push(pid);
                });
                current.branchCrackIds.forEach(cid => {
                    if (!visited.has(cid)) queue.push(cid);
                });
            }

            componentCount++;
        }

        return componentCount;
    }

    /**
     * Get all cells in the same connected crack as the given cell.
     * Uses BFS to traverse parent/child relationships.
     */
    getConnectedComponent(cellId: string, crackCells: Crack[]): Crack[] {
        const visited = new Set<string>();
        const component: Crack[] = [];
        const queue = [cellId];

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            if (visited.has(currentId)) continue;
            visited.add(currentId);

            const cell = crackCells.find(c => c.id === currentId);
            if (!cell) continue;

            component.push(cell);

            // Add all connected cells
            cell.originCrackId.forEach(pid => {
                if (!visited.has(pid)) queue.push(pid);
            });
            cell.branchCrackIds.forEach(cid => {
                if (!visited.has(cid)) queue.push(cid);
            });
        }

        return component;
    }

    /**
     * Check if a cell is a leaf (has no children).
     * Leaf cells have reduced spread chance.
     */
    isLeafCell(cellId: string, crackCells: Crack[]): boolean {
        const cell = crackCells.find(c => c.id === cellId);
        return cell ? cell.branchCrackIds.length === 0 : true;
    }
}

export const goalManager = new GoalManager();

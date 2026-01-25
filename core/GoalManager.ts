
import { GameState, GoalMark, CrackCell, ActivePiece, FloatingText, GridCell } from '../types';
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
     * This is the legacy function - use trySpawnCrack for new CrackCell system.
     */
    trySpawnGoal(
        state: GameState,
        grid: GridCell[][],
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
        const currentRank = calculateRankDetails(initialTotalScore + state.score).rank;

        // Check if CRACK_DOWN is active (crackDownRemaining > 0)
        const crackDownActive = state.crackDownRemaining > 0;

        // Try to spawn a goal
        const newGoal = spawnGoalMark(grid, state.goalMarks, currentRank, timeLeft, maxTime, crackDownActive);

        if (newGoal) {
            // Decrement CRACK_DOWN counter if active
            if (crackDownActive) {
                state.crackDownRemaining--;
                console.log(`CRACK_DOWN: Crack spawned at y=${newGoal.y} (${state.crackDownRemaining} remaining)`);
            }
            audio.playPop(1);
            return { goal: newGoal, newLastSpawnTime: now };
        }

        return { goal: null, newLastSpawnTime: now };
    }

    /**
     * Try to spawn a new CrackCell if conditions are met.
     * Creates a root crack cell (no parents) with random growth interval.
     */
    trySpawnCrack(
        state: GameState,
        grid: GridCell[][],
        initialTotalScore: number,
        timeLeft: number,
        maxTime: number,
        lastSpawnTime: number
    ): { crack: CrackCell | null; newLastSpawnTime: number } {
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
        const currentRank = calculateRankDetails(initialTotalScore + state.score).rank;

        // Check if CRACK_DOWN is active (crackDownRemaining > 0)
        const crackDownActive = state.crackDownRemaining > 0;

        // Use existing spawnGoalMark to get position/color, then convert to CrackCell
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
            // Convert GoalMark to CrackCell
            const newCrack: CrackCell = {
                id: newGoal.id,
                x: newGoal.x,
                y: newGoal.y,
                color: newGoal.color,
                parentIds: [],  // Root crack - no parents
                childIds: [],   // No children yet
                lastGrowthCheck: now,
                growthInterval: 3000 + Math.random() * 2000,  // Random 3-5 seconds
                spawnTime: newGoal.spawnTime
            };

            // Decrement CRACK_DOWN counter if active
            if (crackDownActive) {
                state.crackDownRemaining--;
                console.log(`CRACK_DOWN: Crack spawned at y=${newCrack.y} (${state.crackDownRemaining} remaining)`);
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
        // Only remove consumed goals - non-matching cracks persist under goop
        state.goalMarks = state.goalMarks.filter(g => !consumed.includes(g.id));

        consumed.forEach(id => {
            const cx = normalizeX(piece.x);
            const cy = Math.floor(piece.y);
            const textId = Math.random().toString(36).substr(2, 9);

            state.floatingTexts.push({
                id: textId,
                text: 'Laser to Seal',
                x: cx,
                y: cy,
                life: 1,
                color: '#facc15'
            });

            // Schedule removal of floating text
            setTimeout(() => {
                state.floatingTexts = state.floatingTexts.filter(ft => ft.id !== textId);
                emitChange();
            }, 1000);

            gameEventBus.emit(GameEventType.GOAL_CAPTURED, { count: 1 });
        });
        // destroyed goals (non-matching color) are ignored - crack persists
    }

    /**
     * Handle consumed cracks using the new CrackCell system.
     * When a crack cell is consumed, removes the entire connected crack group.
     */
    handleCrackConsumption(
        state: GameState,
        consumedIds: string[],
        piece: ActivePiece,
        emitChange: () => void
    ): void {
        if (consumedIds.length === 0) return;

        // For each consumed crack, find and remove the entire connected group
        const allRemovedIds = new Set<string>();

        consumedIds.forEach(id => {
            if (allRemovedIds.has(id)) return; // Already processed

            // Get entire connected component for this crack
            const connectedGroup = this.getConnectedComponent(id, state.crackCells);
            connectedGroup.forEach(cell => allRemovedIds.add(cell.id));
        });

        // Remove all connected cracks
        state.crackCells = state.crackCells.filter(c => !allRemovedIds.has(c.id));

        // Also sync to goalMarks for backward compatibility
        state.goalMarks = state.goalMarks.filter(g => !allRemovedIds.has(g.id));

        // Create floating text for captures
        consumedIds.forEach(id => {
            const cx = normalizeX(piece.x);
            const cy = Math.floor(piece.y);
            const textId = Math.random().toString(36).substr(2, 9);

            state.floatingTexts.push({
                id: textId,
                text: 'Laser to Seal',
                x: cx,
                y: cy,
                life: 1,
                color: '#facc15'
            });

            setTimeout(() => {
                state.floatingTexts = state.floatingTexts.filter(ft => ft.id !== textId);
                emitChange();
            }, 1000);

            gameEventBus.emit(GameEventType.GOAL_CAPTURED, { count: 1 });
        });
    }

    /**
     * Count the number of connected crack groups (connected components).
     * Max 8 crack groups enforced.
     */
    countCracks(crackCells: CrackCell[]): number {
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
                current.parentIds.forEach(pid => {
                    if (!visited.has(pid)) queue.push(pid);
                });
                current.childIds.forEach(cid => {
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
    getConnectedComponent(cellId: string, crackCells: CrackCell[]): CrackCell[] {
        const visited = new Set<string>();
        const component: CrackCell[] = [];
        const queue = [cellId];

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            if (visited.has(currentId)) continue;
            visited.add(currentId);

            const cell = crackCells.find(c => c.id === currentId);
            if (!cell) continue;

            component.push(cell);

            // Add all connected cells
            cell.parentIds.forEach(pid => {
                if (!visited.has(pid)) queue.push(pid);
            });
            cell.childIds.forEach(cid => {
                if (!visited.has(cid)) queue.push(cid);
            });
        }

        return component;
    }

    /**
     * Check if a cell is a leaf (has no children).
     * Leaf cells have reduced spread chance.
     */
    isLeafCell(cellId: string, crackCells: CrackCell[]): boolean {
        const cell = crackCells.find(c => c.id === cellId);
        return cell ? cell.childIds.length === 0 : true;
    }
}

export const goalManager = new GoalManager();

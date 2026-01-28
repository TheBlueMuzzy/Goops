
import { RankDetails } from '../types';

// Flattened XP Curve (Jan 2026 rebalance)
// Linear growth: 3500 base + 250 per rank
//
// XP per rank: 3500 + (rank * 250)
// Rank 0→1: 3,500 | Rank 1→2: 3,750 | Rank 2→3: 4,000 | Rank 39→40: 13,250
//
// Total XP to rank 40: ~336,000 (was ~7 million with old curve)

const MAX_RANK = 50;

// Returns the cumulative score required to REACH a specific rank
export const getScoreForRank = (rank: number): number => {
  if (rank <= 0) return 0;

  // Sum of (3500 + i*250) for i from 0 to rank-1
  // = rank * 3500 + 250 * (rank * (rank-1) / 2)
  // = rank * (3500 + 125 * (rank - 1))
  // = rank * (3375 + 125 * rank)
  return rank * (3375 + 125 * rank);
};

// Returns the XP needed to go from current rank to next rank
export const getXpToNextRank = (rank: number): number => {
  if (rank < 0) return 3500;
  if (rank >= MAX_RANK) return 0;

  // XP to next = 3500 + 250 * rank
  return 3500 + 250 * rank;
};

// Returns the score for 50% progress through a rank
export const getScoreForMidRank = (rank: number): number => {
  if (rank <= 0) return 0;
  if (rank >= MAX_RANK) return getScoreForRank(MAX_RANK);

  const currentBase = getScoreForRank(rank);
  const nextBase = getScoreForRank(rank + 1);
  return Math.floor(currentBase + (nextBase - currentBase) * 0.5);
};

// --- Milestone Functions ---

// Returns all milestone ranks [10, 20, 30, ... 100]
export const getMilestoneRanks = (): number[] => {
  const milestones: number[] = [];
  for (let r = 10; r <= MAX_RANK; r += 10) {
    milestones.push(r);
  }
  return milestones;
};

// Returns the next milestone rank after currentRank, or null if at/past max
export const getNextMilestone = (currentRank: number): number | null => {
  const nextMilestone = Math.ceil((currentRank + 1) / 10) * 10;
  return nextMilestone <= MAX_RANK ? nextMilestone : null;
};

// Returns milestones crossed when going from fromRank to toRank
// e.g., getMilestonesInRange(8, 12) returns [10]
// e.g., getMilestonesInRange(18, 32) returns [20, 30]
export const getMilestonesInRange = (fromRank: number, toRank: number): number[] => {
  if (toRank <= fromRank) return [];

  const crossed: number[] = [];
  const milestones = getMilestoneRanks();

  for (const milestone of milestones) {
    if (milestone > fromRank && milestone <= toRank) {
      crossed.push(milestone);
    }
  }

  return crossed;
};

// --- Rank Calculation ---

export const calculateRankDetails = (careerScore: number): RankDetails => {
  // Rank 0 = fresh start or not yet reached rank 1's threshold (3500)
  if (careerScore < getScoreForRank(1)) {
    return {
      rank: 0,
      progress: Math.max(0, careerScore),
      toNextRank: 3500, // XP needed for rank 1
      careerScore: Math.max(0, careerScore),
      isMaxRank: false
    };
  }

  let rank = 1;

  // Iterative check is fast enough for 100 ranks
  while (rank < MAX_RANK && careerScore >= getScoreForRank(rank + 1)) {
    rank++;
  }

  const currentRankScoreBase = getScoreForRank(rank);
  const nextRankScoreBase = getScoreForRank(rank + 1);

  const progress = careerScore - currentRankScoreBase;
  const toNextRank = nextRankScoreBase - currentRankScoreBase;

  return {
    rank,
    progress,
    toNextRank,
    careerScore,
    isMaxRank: rank >= MAX_RANK
  };
};

// --- Win Bonus / Capped Progression ---

export interface ShiftResult {
  newCareerScore: number;
  ranksGained: number;
}

/**
 * Calculate final career score after a shift, with win bonus and +2 rank cap.
 *
 * Rules:
 * - Score is applied normally (can rank up 0-N times)
 * - If won but score didn't rank up: guarantee +1 rank at 100 XP
 * - If won and score ranked up: give another +1 rank at 100 XP
 * - Max total is +2 ranks per shift
 * - If capped, XP is set to 100 in the final rank
 */
export const calculateCappedProgression = (
  currentCareerScore: number,
  shiftScore: number,
  won: boolean
): ShiftResult => {
  const startRank = calculateRankDetails(currentCareerScore).rank;
  const maxRank = startRank + 2;

  // Calculate what score alone would achieve
  const uncappedScore = currentCareerScore + shiftScore;
  const uncappedDetails = calculateRankDetails(uncappedScore);
  const scoreRanksGained = uncappedDetails.rank - startRank;

  let finalRank: number;
  let finalCareerScore: number;

  if (!won) {
    // Loss: just apply score, capped at +2 ranks
    if (scoreRanksGained <= 2) {
      finalCareerScore = uncappedScore;
      finalRank = uncappedDetails.rank;
    } else {
      // Cap at +2 ranks with 100 XP
      finalRank = maxRank;
      finalCareerScore = getScoreForRank(finalRank) + 100;
    }
  } else {
    // Won: score + guaranteed rank up
    if (scoreRanksGained === 0) {
      // Score didn't rank up, win gives +1 rank at 100 XP
      finalRank = startRank + 1;
      finalCareerScore = getScoreForRank(finalRank) + 100;
    } else if (scoreRanksGained === 1) {
      // Score ranked up once, win gives another +1 rank at 100 XP
      finalRank = startRank + 2;
      finalCareerScore = getScoreForRank(finalRank) + 100;
    } else {
      // Score would rank up 2+ times, cap at +2 with 100 XP
      finalRank = maxRank;
      finalCareerScore = getScoreForRank(finalRank) + 100;
    }
  }

  // Respect MAX_RANK ceiling
  if (finalRank > MAX_RANK) {
    finalRank = MAX_RANK;
    finalCareerScore = getScoreForRank(MAX_RANK);
  }

  return {
    newCareerScore: finalCareerScore,
    ranksGained: finalRank - startRank
  };
};

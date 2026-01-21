
import { RankDetails } from '../types';

// Tutorial-Extended XP Curve (Jan 2026 rebalance)
// Shifted by 3 ranks so tutorial takes longer - a good run shouldn't skip all of ranks 0-3
//
// Old rank 4 threshold (6,000) is now rank 1 threshold
// Formula: Total XP to rank = (rank + 2) * (1750 + 250 * rank) for rank >= 1
//
// Rank 1: 6,000 XP | Rank 2: 9,000 XP | Rank 3: 12,500 XP | Rank 10: 54,000 XP
//
// XP per rank: 6000 (0→1), then 2500 + 500*rank for subsequent ranks

const MAX_RANK = 100;

// Returns the cumulative score required to REACH a specific rank
export const getScoreForRank = (rank: number): number => {
  if (rank <= 0) return 0;

  // Shifted formula (equivalent to old formula at rank+3):
  // Total XP = (rank + 2) * (1750 + 250 * rank)
  return (rank + 2) * (1750 + 250 * rank);
};

// Returns the XP needed to go from current rank to next rank
export const getXpToNextRank = (rank: number): number => {
  if (rank <= 0) return 6000; // Tutorial: 6,000 XP to reach rank 1
  if (rank >= MAX_RANK) return 0;

  // XP to next = 2500 + 500 * rank
  return 2500 + 500 * rank;
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

export const calculateRankDetails = (totalScore: number): RankDetails => {
  // Rank 0 = fresh start or not yet reached rank 1's threshold (6000)
  if (totalScore < getScoreForRank(1)) {
    return {
      rank: 0,
      progress: Math.max(0, totalScore),
      toNextRank: 6000, // XP needed for rank 1
      totalScore: Math.max(0, totalScore),
      isMaxRank: false
    };
  }

  let rank = 1;

  // Iterative check is fast enough for 100 ranks
  while (rank < MAX_RANK && totalScore >= getScoreForRank(rank + 1)) {
    rank++;
  }

  const currentRankScoreBase = getScoreForRank(rank);
  const nextRankScoreBase = getScoreForRank(rank + 1);
  
  const progress = totalScore - currentRankScoreBase;
  const toNextRank = nextRankScoreBase - currentRankScoreBase;
  
  return {
    rank,
    progress,
    toNextRank,
    totalScore,
    isMaxRank: rank >= MAX_RANK
  };
};

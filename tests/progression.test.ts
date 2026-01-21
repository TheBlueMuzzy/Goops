import { describe, it, expect } from 'vitest';
import { getScoreForRank, getXpToNextRank, calculateRankDetails, getMilestoneRanks, getNextMilestone, getMilestonesInRange } from '../utils/progression';

describe('getScoreForRank', () => {
  it('returns 6000 for rank 1 (tutorial-extended curve)', () => {
    expect(getScoreForRank(1)).toBe(6000);
  });

  it('returns 0 for rank 0 or negative', () => {
    expect(getScoreForRank(0)).toBe(0);
    expect(getScoreForRank(-1)).toBe(0);
  });

  it('returns correct XP for early ranks (tutorial-extended curve)', () => {
    // Formula: (rank + 2) * (1750 + 250 * rank)
    expect(getScoreForRank(1)).toBe(6000);    // 3 * 2000
    expect(getScoreForRank(2)).toBe(9000);    // 4 * 2250
    expect(getScoreForRank(3)).toBe(12500);   // 5 * 2500
    expect(getScoreForRank(4)).toBe(16500);   // 6 * 2750
    expect(getScoreForRank(5)).toBe(21000);   // 7 * 3000
  });

  it('returns correct XP for mid ranks', () => {
    // Rank 10: (10+2) * (1750 + 250*10) = 12 * 4250 = 51000
    expect(getScoreForRank(10)).toBe(51000);
    // Rank 20: (20+2) * (1750 + 250*20) = 22 * 6750 = 148500
    expect(getScoreForRank(20)).toBe(148500);
  });

  it('returns correct XP for max rank', () => {
    // Rank 100: (100+2) * (1750 + 250*100) = 102 * 26750 = 2,728,500
    expect(getScoreForRank(100)).toBe(2728500);
  });
});

describe('getXpToNextRank', () => {
  it('returns 6000 for rank 0 (tutorial threshold)', () => {
    expect(getXpToNextRank(0)).toBe(6000);
  });

  it('returns correct increments (shifted delta)', () => {
    // Formula: 2500 + 500 * rank (for rank >= 1)
    expect(getXpToNextRank(1)).toBe(3000);   // 2500 + 500
    expect(getXpToNextRank(2)).toBe(3500);   // 2500 + 1000
    expect(getXpToNextRank(3)).toBe(4000);   // 2500 + 1500
    expect(getXpToNextRank(4)).toBe(4500);   // 2500 + 2000
    expect(getXpToNextRank(10)).toBe(7500);  // 2500 + 5000
  });

  it('returns 0 for max rank', () => {
    expect(getXpToNextRank(100)).toBe(0);
  });
});

describe('calculateRankDetails', () => {
  it('returns rank 0 for 0 score (fresh start)', () => {
    const details = calculateRankDetails(0);
    expect(details.rank).toBe(0);
    expect(details.progress).toBe(0);
    expect(details.toNextRank).toBe(6000);
  });

  it('returns rank 0 for negative score', () => {
    const details = calculateRankDetails(-100);
    expect(details.rank).toBe(0);
  });

  it('returns rank 0 for scores below 6000', () => {
    const details = calculateRankDetails(5999);
    expect(details.rank).toBe(0);
    expect(details.progress).toBe(5999);
    expect(details.toNextRank).toBe(6000);
  });

  it('returns rank 1 at exactly 6000 XP', () => {
    const details = calculateRankDetails(6000);
    expect(details.rank).toBe(1);
    expect(details.progress).toBe(0);
    expect(details.toNextRank).toBe(3000); // 9000 - 6000
  });

  it('calculates progress within a rank', () => {
    // At 7500 XP: rank 1 (needs 6000), progress = 1500 of 3000 to rank 2
    const details = calculateRankDetails(7500);
    expect(details.rank).toBe(1);
    expect(details.progress).toBe(1500);
    expect(details.toNextRank).toBe(3000);
  });

  it('returns rank 10 at 51000 XP', () => {
    const details = calculateRankDetails(51000);
    expect(details.rank).toBe(10);
    expect(details.progress).toBe(0);
  });

  it('handles max rank', () => {
    const details = calculateRankDetails(2728500);
    expect(details.rank).toBe(100);
    expect(details.isMaxRank).toBe(true);
  });

  it('caps at max rank even with excessive score', () => {
    const details = calculateRankDetails(10000000);
    expect(details.rank).toBe(100);
    expect(details.isMaxRank).toBe(true);
  });
});

describe('getMilestoneRanks', () => {
  it('returns all milestone ranks from 10 to 100', () => {
    const milestones = getMilestoneRanks();
    expect(milestones).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  });

  it('returns exactly 10 milestones', () => {
    expect(getMilestoneRanks().length).toBe(10);
  });
});

describe('getNextMilestone', () => {
  it('returns 10 for ranks below 10', () => {
    expect(getNextMilestone(0)).toBe(10);
    expect(getNextMilestone(1)).toBe(10);
    expect(getNextMilestone(5)).toBe(10);
    expect(getNextMilestone(9)).toBe(10);
  });

  it('returns next milestone for ranks at a milestone', () => {
    expect(getNextMilestone(10)).toBe(20);
    expect(getNextMilestone(20)).toBe(30);
    expect(getNextMilestone(90)).toBe(100);
  });

  it('returns next milestone for ranks between milestones', () => {
    expect(getNextMilestone(11)).toBe(20);
    expect(getNextMilestone(15)).toBe(20);
    expect(getNextMilestone(19)).toBe(20);
  });

  it('returns null for max rank', () => {
    expect(getNextMilestone(100)).toBe(null);
  });

  it('returns null for ranks past max', () => {
    expect(getNextMilestone(101)).toBe(null);
    expect(getNextMilestone(150)).toBe(null);
  });
});

describe('getMilestonesInRange', () => {
  it('returns empty array when toRank <= fromRank', () => {
    expect(getMilestonesInRange(10, 10)).toEqual([]);
    expect(getMilestonesInRange(15, 10)).toEqual([]);
  });

  it('returns single milestone when crossing one', () => {
    expect(getMilestonesInRange(8, 12)).toEqual([10]);
    expect(getMilestonesInRange(9, 10)).toEqual([10]);
  });

  it('returns multiple milestones when crossing several', () => {
    expect(getMilestonesInRange(18, 32)).toEqual([20, 30]);
    expect(getMilestonesInRange(5, 35)).toEqual([10, 20, 30]);
  });

  it('returns empty array when no milestones crossed', () => {
    expect(getMilestonesInRange(1, 5)).toEqual([]);
    expect(getMilestonesInRange(11, 19)).toEqual([]);
  });

  it('includes milestone at toRank but not fromRank', () => {
    // At rank 10, crossing to exactly 20 should include 20
    expect(getMilestonesInRange(10, 20)).toEqual([20]);
    // Starting AT 10, going to 11 should NOT include 10
    expect(getMilestonesInRange(10, 11)).toEqual([]);
  });

  it('handles jumping from 0 to high rank', () => {
    expect(getMilestonesInRange(0, 50)).toEqual([10, 20, 30, 40, 50]);
  });
});

# UAT Issues: 20-01 Expanding Cracks Overhaul

**Plan:** 20-01-PLAN.md
**Tested:** 2026-01-24
**Tester:** Manual gameplay at rank 39

---

## UAT-001: Cracks not expanding (CRITICAL)

**Severity:** Critical - Core feature completely non-functional

**Description:**
At rank 39, basic cracks spawn but NO expansion occurs. No lines connecting crack cells.

**Steps to reproduce:**
1. Start game at rank 39 (or reach it)
2. Wait for cracks to spawn
3. Observe that cracks never spread to adjacent cells
4. No connection lines visible between cells

**Expected behavior:**
- Cracks should spread to adjacent cells every 3-5s
- Connection lines should draw between parent/child cells
- Spread chance = 10% base + pressureRatio

**Actual behavior:**
- Cracks spawn as single cells
- Never spread or connect
- `tickCrackGrowth()` appears to not find any cells to process

**Root cause (found during investigation):**

`tickGoals()` in `core/GameEngine.ts:698-712` still calls `trySpawnGoal()` and pushes to `goalMarks`, NOT `trySpawnCrack()` and `crackCells`.

```typescript
// CURRENT (broken):
const { goal, newLastSpawnTime } = goalManager.trySpawnGoal(...);
if (goal) {
    this.state.goalMarks.push(goal);  // Wrong array!
}

// SHOULD BE:
const { crack, newLastSpawnTime } = goalManager.trySpawnCrack(...);
if (crack) {
    this.state.crackCells.push(crack);  // Correct array
}
```

**Files affected:**
- `core/GameEngine.ts` - `tickGoals()` method

**Acceptance criteria:**
- [ ] Cracks spawn into `crackCells` array
- [ ] `tickCrackGrowth()` processes cells and attempts spread
- [ ] Connection lines render between parent/child cells
- [ ] Cracks visibly expand during gameplay at rank 30+

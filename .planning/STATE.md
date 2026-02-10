---
title: Project State
type: session
tags: [active, continuity, status]
updated: 2026-02-09
---

# Project State

## Current Position

Phase: 33 of 38 (Rank 0 Training Sequence)
Plan: 4 of 4 in current phase — FIX plan executed, AT CHECKPOINT (UAT round 3)
Status: In progress — waiting for human verification
Last activity: 2026-02-09 - Executed 33-04-FIX (3 code fixes, 5 already done)

Progress: ████░░░░░░ 35%

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- `feature/tutorial-infrastructure` (Phase 31 complete, Phase 32 complete, Phase 33 in progress)

## Next Steps

33-04-FIX executed. At checkpoint — need UAT round 3 verification of all 9 fixes.
After verification: create SUMMARY, update ROADMAP, complete plan metadata commit.

### Decisions Made

- Typography: 18px minimum body, CSS classes with !important, full project sweep
- Journal layout: accordion (single column) over sidebar+content (two column)
- TEXT_MANIFEST.md as editable text source-of-truth
- **Training: 15 steps, 6 phases (A-F) — added B1B "Yeah. It's slow." mid-fall**
- **Garble system: bracket notation `[text]` in fullText for explicit garble control**
- **Garble chars: Unicode block elements (░▒▓█▌▐■▬▮▪), light corruption (70/15/15 model), slate-500 color**
- Training uses COLORS.RED hex values matching engine convention
- Training mode: pendingTrainingPalette interception pattern in enterPeriscope()
- Training tick() gates skip all normal gameplay systems
- **freezeFalling used alongside isPaused** — isPaused only stops tick, freezeFalling stops physics
- **Periscope pulse (CSS scale+glow) replaces broken highlight cutout overlay**
- **pauseGame: false steps don't freeze on transition, show message immediately**
- **showWhenPieceBelow: position-gated message display (polls activeGoop.y every 200ms)**
- `goop-merged` advance maps to PIECE_DROPPED (merge happens on landing)
- `game-over` advance maps to GAME_OVER (for F2 practice mode)

### Known Issues

- PiecePreview NEXT/HOLD labels at 18px may be too large for 48px box — revisit layout later
- Some SVG text in Art.tsx (PROMOTION THRESHOLD at 12px, XP at 14px) not yet standardized
- Per-step piece spawning (specific sizes, autoFall, slowFall) not yet implemented — pieces come from palette queue
- Per-step crack spawning not yet active

### Roadmap Evolution

- Milestone v1.5 shipped: Soft-body goop rendering, 4 completed phases (2026-02-08)
- Milestone v1.6 created: Progressive Tutorial, 8 phases (Phase 31-38)

---

## Session Continuity

Last session: 2026-02-09
**Version:** 1.1.13
**Branch:** feature/tutorial-infrastructure
**Build:** 243

### Resume Command
```
Phase 33 Plan 04-FIX — AT CHECKPOINT (UAT round 3 verification)

EXECUTE: /gsd:execute-plan .planning/phases/33-rank-0-training-sequence/33-04-FIX.md

WHAT'S DONE (code committed, 3 commits):
- bf70e26: Garble renderer light corruption (70% clear, 15% partial, 15% full)
- bf70e26: B2/B3/D2 messages now include HOW to do controls + keywords tagged
- 2070e0f: Falling pieces visible — spawn at BUFFER_HEIGHT-1 + fallback renders in buffer
- a081eda: messagePosition 'top' for E1/F1/F2 pressure steps

ALREADY IMPLEMENTED (no changes needed):
- Control gating (Task 2), pause between steps (Task 3), highlight/pulse (Task 6)
- Training progress in intercom header (Task 7), pressure meter (Task 8)

WHAT TO DO:
1. Start dev server: npm run dev -- --host
2. Clear localStorage, reload at rank 0
3. Run through all 15 UAT verification steps from the checkpoint
4. Type "approved" or describe issues
5. After approval: SUMMARY + STATE + ROADMAP update + metadata commit
```

---

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<runtests>`, `<save>`, `<deploy>`, `<research>`, `<askme>`, `<flow>`

## Related

- [[HOME]] - Navigation hub
- [[PROJECT]] - Full project definition
- [[ROADMAP]] - All milestones

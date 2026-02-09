---
title: Project State
type: session
tags: [active, continuity, status]
updated: 2026-02-08
---

# Project State

## Current Position

Phase: 33 of 38 (Rank 0 Training Sequence)
Plan: 4 of 4 in current phase (IN PROGRESS — UAT bug fixes)
Status: In progress
Last activity: 2026-02-09 - Restructured tutorial 17→14 steps, rewrote garble system

Progress: ████░░░░░░ 35%

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- `feature/tutorial-infrastructure` (Phase 31 complete, Phase 32 complete, Phase 33 in progress)

## Next Steps

UAT in progress on restructured 14-step tutorial. User is testing and reporting bugs.

### Decisions Made

- Typography: 18px minimum body, CSS classes with !important, full project sweep
- Journal layout: accordion (single column) over sidebar+content (two column)
- TEXT_MANIFEST.md as editable text source-of-truth
- **Training: restructured from 17→14 steps, 7→6 phases (A-F, removed G)**
- **Garble system: bracket notation `[text]` in fullText for explicit garble control**
- **Garble chars: Unicode block elements (░▒▓█▌▐■▬▮▪), 100% letter replacement, slate-500 color**
- **Three-color text: white (clear), green (keywords), slate-500 (garbled)**
- Training uses COLORS.RED hex values matching engine convention
- Training mode: pendingTrainingPalette interception pattern in enterPeriscope()
- Training tick() gates skip all normal gameplay systems (complications, goals, cracks, heat, lights)
- TRAINING_MESSAGES as separate Record export alongside TUTORIAL_STEPS (Phase 31 system untouched)
- Console idle text shrunk from t-display (36px) to t-heading (24px) to prevent wrapping
- `goop-merged` advance maps to PIECE_DROPPED (merge happens on landing)
- `game-over` advance maps to GAME_OVER (for F2 practice mode)

### Known Issues

- PiecePreview NEXT/HOLD labels at 18px may be too large for 48px box — revisit layout later
- Some SVG text in Art.tsx (PROMOTION THRESHOLD at 12px, XP at 14px) not yet standardized
- Per-step piece spawning (specific sizes, autoFall, slowFall) not yet implemented — pieces come from palette queue
- Per-step crack spawning and pressure rate changes not yet active

### Roadmap Evolution

- Milestone v1.5 shipped: Soft-body goop rendering, 4 completed phases (2026-02-08)
- Milestone v1.6 created: Progressive Tutorial, 8 phases (Phase 31-38)

---

## Session Continuity

Last session: 2026-02-09
**Version:** 1.1.13
**Branch:** feature/tutorial-infrastructure
**Build:** 242

### Resume Command
```
Phase 33 Plan 04 IN PROGRESS — UAT bug fixes

WHAT'S DONE THIS SESSION:
- Restructured tutorial: 17→14 steps, 7→6 phases (A-F)
- Rewrote all training messages with V2 user-authored text
- IntercomText: bracket-based garble ([text] = garbled, keywords = green, rest = clear)
- Garble chars: Unicode blocks (░▒▓█), 100% replacement, slate-500 color
- Added game-over + goop-merged event mappings in useTrainingFlow
- Updated ALL_PHASES arrays in Game.tsx + TrainingHUD.tsx

UAT: User testing 14-step flow, reporting bugs
Dev server: npm run dev -- --host
```

---

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<runtests>`, `<save>`, `<deploy>`, `<research>`, `<askme>`, `<flow>`

## Related

- [[HOME]] - Navigation hub
- [[PROJECT]] - Full project definition
- [[ROADMAP]] - All milestones

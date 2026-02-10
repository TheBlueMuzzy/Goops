---
title: Project State
type: session
tags: [active, continuity, status]
updated: 2026-02-10
---

# Project State

## Current Position

Phase: 33 of 38 (Rank 0 Training Sequence)
Plan: 4 of 4 in current phase — FIX plan, UAT round 5 in progress
Status: In progress — A & B phases approved, testing C-F phases
Last activity: 2026-02-10 - B-phase flow overhaul approved, committed

Progress: ████░░░░░░ 40%

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- `feature/tutorial-infrastructure` (Phase 31 complete, Phase 32 complete, Phase 33 in progress)

## Next Steps

UAT round 5: Continue testing C-F phases (steps 7-15).
- A-phase (A1, A2): APPROVED
- B-phase (B1, B1B, B2, B3): APPROVED — major flow overhaul
- C-phase (C1, C2, C3): NEEDS TESTING
- D-phase (D1, D2, D3): NEEDS TESTING
- E-phase (E1): NEEDS TESTING
- F-phase (F1, F2): NEEDS TESTING

After full verification: create 33-04-FIX SUMMARY, update ROADMAP, metadata commit.

### Decisions Made

- Typography: 18px minimum body, CSS classes with !important, full project sweep
- Journal layout: accordion (single column) over sidebar+content (two column)
- TEXT_MANIFEST.md as editable text source-of-truth
- **Training: 15 steps, 6 phases (A-F) — B1B is mid-fall message at ~60% down, not post-landing**
- **Garble system: bracket notation `[text]` = full-word garble, no brackets = clear, keywords = green. NO partial/random corruption.**
- **Garble chars: Unicode block elements (░▒▓█▌▐■▬▮▪), slate-500 color**
- Training uses COLORS.RED hex values matching engine convention
- Training mode: pendingTrainingPalette interception pattern in enterPeriscope()
- Training tick() gates skip all normal gameplay systems
- **freezeFalling used alongside isPaused** — isPaused only stops tick, freezeFalling stops physics
- **Periscope pulse (CSS scale+glow) replaces broken highlight cutout overlay**
- **Training piece spawning: engine does NOT auto-spawn in training mode. Each step's spawnPiece config triggers explicit spawn via useTrainingFlow.**
- **Advance arming: event listeners disarmed until message dismissed (prevents dismiss-tap from triggering advance)**
- **Overlay blockInteraction: pauseGame:true steps show dark scrim + block all touches until message closed**
- `goop-merged` advance maps to PIECE_DROPPED (merge happens on landing)
- `game-over` advance maps to GAME_OVER (for F2 practice mode)
- **B-phase flow pattern: piece falls → lands → next piece spawns → message appears → dismiss → act → piece lands → advance**
- **B1 advanceAtRow: 13** — auto-advances to B1B when piece reaches ~60% down
- **B1B pauseGame: false** — mid-fall message, piece keeps falling, advances on piece-landed
- **B2 reshowAtRow: 13** — re-shows fast-drop message at ~50% if player hasn't fast-dropped
- **B3 pauseDelay: 1200** — piece spawns falling, message appears 1.2s later (delayed pause)
- **B2/B3 advance on piece-landed** — not on action input, waits for piece to lock in
- **StepSetup new fields: pauseDelay, advanceAtRow, reshowAtRow, reshowUntilAction**

### Known Issues

- PiecePreview NEXT/HOLD labels at 18px may be too large for 48px box — revisit layout later
- Some SVG text in Art.tsx (PROMOTION THRESHOLD at 12px, XP at 14px) not yet standardized
- Per-step crack spawning not yet active

### Roadmap Evolution

- Milestone v1.5 shipped: Soft-body goop rendering, 4 completed phases (2026-02-08)
- Milestone v1.6 created: Progressive Tutorial, 8 phases (Phase 31-38)

---

## Session Continuity

Last session: 2026-02-10
**Version:** 1.1.13
**Branch:** feature/tutorial-infrastructure
**Build:** 247

### Resume Command
```
Phase 33 Plan 04-FIX — UAT round 5, testing C-F phases

A & B phases APPROVED and committed. C-F phases need testing.

WHAT TO DO:
1. Start dev server: npm run dev -- --host
2. Clear localStorage, reload at rank 0
3. Play through A & B phases (already approved, quick verify no regression)
4. Test C-phase: C1 (pop intro), C2 (merge), C3 (fill timing)
5. Test D-phase: D1 (crack), D2 (tank rotation), D3 (offscreen)
6. Test E-phase: E1 (scaffolding)
7. Test F-phase: F1 (cleanup), F2 (practice until game over)
8. After full approval: create 33-04-FIX SUMMARY, update ROADMAP, metadata commit
```

---

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<runtests>`, `<save>`, `<deploy>`, `<research>`, `<askme>`, `<flow>`

## Related

- [[HOME]] - Navigation hub
- [[PROJECT]] - Full project definition
- [[ROADMAP]] - All milestones

---
title: Project State
type: session
tags: [active, continuity, status]
updated: 2026-02-08
---

# Project State

## Current Position

Phase: 31 of 38 (Tutorial Infrastructure)
Plan: 3 of 3 in current phase
Status: Phase complete
Last activity: 2026-02-08 - Completed 31-03-PLAN.md

Progress: ███░░░░░░░ 25%

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- `feature/tutorial-infrastructure` (Phase 31, complete)

## Next Steps

### What was done THIS session:

1. **31-01 complete** — Tutorial state machine, SaveData persistence, event bus hooks
2. **31-02 complete** — Intercom text rendering system
   - IntercomText.tsx: garble renderer with seeded PRNG, keyword highlighting
   - IntercomMessage.tsx: typewriter reveal, maintenance-order styling, 48x48 action buttons
   - IntercomMessage.css: blink + fade-in animations
   - Sizes tuned live: 36px body, 18px header, 48x48 buttons
3. **31-03 complete** — TutorialOverlay & full integration
   - TutorialOverlay.tsx: z-[90], non-blocking, fade transitions, highlight infrastructure
   - Game.tsx: useTutorial hook wired, TutorialOverlay rendered as Layer 6
   - App.tsx: saveData/setSaveData passed to Game
   - Human verification passed: end-to-end pipeline working

### Key Design Decisions (v1.6):

- **Intercom system** — employer speaks through static-corrupted PA. Key tutorial terms come through clearly, flavor words are garbled. Brilliant dual-purpose: teaches mechanics AND establishes grungy world.
- **Multiple rank 0 training levels** — 0TA, 0TB, 0TC, etc. As many as needed. Each teaches one concept through constrained play.
- **The aha moment** — pop timing tension (pop too early = lose scaffolding to reach cracks; pop too late = pressure maxes). NOT the cylinder wrap.
- **Journal (? button)** — living reference that grows. Player writes down what they learn from transmissions.
- **Rank-gated UI** — console elements hidden until their unlock rank. Glow when new.
- **Multi-modal delivery** — intercom pop-ups, HUD hints, console glow, journal entries
- **8 words max per instruction** — keep it brief
- **Max 1 tooltip per game** — non-blocking during gameplay
- **Rank IS the tutorial gate** — no separate tutorial progression

### Known Issues

- None currently

### Decisions Made

- v1.5 shipped with deferred phases (28-30 can be a future milestone)
- Tutorial visual style: grungy low-tech (Lethal Company meets Uncle Chop), not scan-lines (performance issues). "Maintenance order" tooltip style.
- Story theme: modern indentured servitude, employer appears benign but is exploitative
- The veteran character provides upgrades (radio hijack system, content TBD)
- Full story arc is PRD-documented but most content is future milestone scope
- TutorialOverlay at z-[90] (highest game layer), non-blocking pointer events

### Roadmap Evolution

- Milestone v1.5 shipped: Soft-body goop rendering, 4 completed phases (2026-02-08)
- Milestone v1.6 created: Progressive Tutorial, 8 phases (Phase 31-38)

---

## Session Continuity

Last session: 2026-02-08
**Version:** 1.1.13
**Branch:** feature/tutorial-infrastructure
**Build:** 235

### Resume Command
```
Phase 31 COMPLETE — Tutorial Infrastructure (state machine + intercom + overlay integration)

NEXT: /gsd:plan-phase 32
- Journal System (? button becomes living reference)

/clear first → fresh context window
```

---

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<runtests>`, `<save>`, `<deploy>`, `<research>`, `<askme>`, `<flow>`

## Related

- [[HOME]] - Navigation hub
- [[PROJECT]] - Full project definition
- [[ROADMAP]] - All milestones

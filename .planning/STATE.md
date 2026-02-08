---
title: Project State
type: session
tags: [active, continuity, status]
updated: 2026-02-08
---

# Project State

## Current Position

Phase: 32 of 38 (Journal System)
Plan: 1 of 1 in current phase (IN PROGRESS — checkpoint pending)
Status: In progress
Last activity: 2026-02-08 - Executing 32-01-PLAN.md (Tasks 1-2 done, checkpoint pending)

Progress: ███░░░░░░░ 27%

## Branch Workflow (SOP)

**Standard procedure:** All new work happens on feature branches, not master.
- `master` = stable, tested code only
- Feature branches = work in progress
- Merge to master only after human verification passes

**Active feature branches:**
- `feature/tutorial-infrastructure` (Phase 31 complete, Phase 32 in progress)

## Next Steps

### What was done THIS session:

1. **32-01 Tasks 1-2 complete** — Journal data layer + OperatorJournal component
   - types/tutorial.ts: JournalPageId, JournalPage, JournalSection types
   - data/journalEntries.ts: 11 journal pages (6 with content, 5 stubs)
   - components/OperatorJournal.tsx: Accordion layout, unlock logic, maintenance-order style
   - components/OperatorJournal.css: Fade-in animation
   - Commits: dbc5e00, ee04a0c

2. **Typography system created** — Project-wide standardization
   - index.html: Typography scale CSS classes (t-meta through t-hero) with !important
   - TEXT_MANIFEST.md: Editable source-of-truth for all text properties
   - Applied across: MainMenu, Controls, UpgradePanel, Upgrades, Settings, HowToPlay, IntercomMessage, ConsoleView, PiecePreview, Game.tsx
   - 18px minimum for all player-facing text, dev tools stay small
   - NOT YET COMMITTED — needs checkpoint approval first

3. **32-01 Checkpoint PENDING** — OperatorJournal visual verification
   - App.tsx temporarily swapped to show OperatorJournal instead of HowToPlay
   - Need to verify: accordion layout, text sizes, unlock logic, back button
   - After approval: revert App.tsx temp change, commit typography + journal, create SUMMARY

### Key Design Decisions (v1.6):

- **Typography scale** — t-meta(10), t-caption(12), t-body(18), t-heading(24), t-title(28), t-display(36), t-hero(48). !important to override Tailwind CDN.
- **TEXT_MANIFEST.md** — Editable markdown file mapping all visible text to properties. User edits in Obsidian, Claude reads and applies.
- **Journal accordion layout** — Single column, collapsible sections, one expanded at a time (replaced 2-column sidebar+content)
- **Intercom system** — employer speaks through static-corrupted PA
- **Journal (? button)** — living reference that grows with progression
- **Rank IS the tutorial gate** — no separate tutorial progression

### Known Issues

- PiecePreview NEXT/HOLD labels at 18px may be too large for 48px box — revisit layout later
- Some SVG text in Art.tsx (PROMOTION THRESHOLD at 12px, XP at 14px) not yet standardized — SVG coordinate space differs from screen pixels

### Decisions Made

- Typography: 18px minimum body, CSS classes with !important, full project sweep
- Journal layout: accordion (single column) over sidebar+content (two column)
- TEXT_MANIFEST.md as editable text source-of-truth

### Roadmap Evolution

- Milestone v1.5 shipped: Soft-body goop rendering, 4 completed phases (2026-02-08)
- Milestone v1.6 created: Progressive Tutorial, 8 phases (Phase 31-38)

---

## Session Continuity

Last session: 2026-02-08
**Version:** 1.1.13
**Branch:** feature/tutorial-infrastructure
**Build:** 236

### Resume Command
```
Phase 32 IN PROGRESS — 32-01 checkpoint pending

WHAT'S DONE:
- Tasks 1-2 committed (journal data + OperatorJournal component)
- Typography system applied project-wide (uncommitted)
- App.tsx has TEMP swap: OperatorJournal replacing HowToPlay for testing

NEXT: Complete checkpoint verification, then:
1. Revert App.tsx temp change
2. Commit typography changes
3. Commit OperatorJournal fixes from checkpoint feedback
4. Create 32-01-SUMMARY.md
5. Update ROADMAP

/gsd:execute-plan .planning/phases/32-journal-system/32-01-PLAN.md
```

---

## Quick Commands

User shortcuts in CLAUDE.md: `<commands>`, `<npm>`, `<test>`, `<runtests>`, `<save>`, `<deploy>`, `<research>`, `<askme>`, `<flow>`

## Related

- [[HOME]] - Navigation hub
- [[PROJECT]] - Full project definition
- [[ROADMAP]] - All milestones

# Claude Code Context for Goops

## On Session Start

**Do this automatically when user starts a session or after /clear:**

1. Read `.planning/STATE.md`
2. Find the "Next Steps" section
3. Greet: "Welcome back. Last session: [summary]. Next up: [action]"
4. If bugs/blockers exist, surface them first
5. Offer to continue or show alternatives

This eliminates the need for user to manually run `/gsd:progress` every time.

---

## About the User
- **Not a professional engineer** — good with logic, not abstract coding patterns
- Prefers **human-readable code** over clever abstractions
- Values **targeted, minimal changes** — don't refactor beyond what's asked
- Always provide **terminal commands ready to copy/paste**

## Project Overview
Goops is a puzzle-action game built with React/TypeScript/Vite. Player clears colored goop from a cylindrical pressure tank. Mobile-optimized.

**Deployed:** https://thebluemuzzy.github.io/GOOPS/

---

## Commands

### Quick Commands

| Command | What Claude Does |
|---------|------------------|
| `<commands>` | Show this command list (including GSD commands) |
| `<flow>` | Show the daily workflow diagram |
| `<npm>` | Start dev server (`npm run dev -- --host`) or confirm already running |
| `<test>` | Run tests manually (`npm run test:run`) |
| `<save>` | Full save: update all docs + commit + push (see details below) |
| `<deploy>` | Merge to master + build + deploy to GitHub Pages |

### GSD Commands (Planning & Tracking)

Use these at transition points — not constantly, but when you need direction.

| Command | When | What It Does |
|---------|------|--------------|
| `/gsd:progress` | **Start of session**, between tasks | Check status, get routed to next action |
| `/gsd:plan-phase` | Ready to build something | Create detailed execution plan |
| `/gsd:execute-plan` | Plan exists and approved | Claude codes the plan |
| `/gsd:verify-work` | Code complete, ready for UAT | Guided manual testing checklist |
| `/gsd:plan-fix` | UAT found issues | Plan fixes for the issues |
| `/gsd:complete-milestone` | All phases done | Archive milestone, prep next |
| `/gsd:new-milestone` | Starting a new major version | Define phases for the milestone |

**Less common:** `/gsd:discuss-phase`, `/gsd:research-phase`, `/gsd:pause-work`, `/gsd:resume-work`

---

## Core Rules

### After ANY Code Change (Claude's Job)
1. **Run tests automatically** — don't wait for user to ask
2. If tests fail → fix immediately, run tests again
3. If tests pass → tell user it's ready for manual testing
4. Read `.build-number` and say: **"Ready to test. Look for build #X in the footer."**

**This is non-negotiable.** Always verify your work before saying it's done.

### Git Discipline
- **Feature branches** for all new work (never code on master)
- **Commit often** — after each working piece
- **Push daily** — don't lose work
- **Merge only when deploying** — master = deployed version

### Context Window
User cannot see token count until it's shown. Claude cannot see it at all.
- Save early, save often
- When user says `<save>`, do a FULL save (all docs)
- If user mentions low context, prioritize saving immediately

---

## Command Details

### `<npm>`
```
1. Check if dev server already running (look for existing process)
2. If running: "Dev server already at localhost:5173 (network: [IP]:5173)"
3. If not: Start `npm run dev -- --host` in background
4. Show both localhost and network URLs
```

### `<test>`
```
1. Run `npm run test:run`
2. Report: "✓ 150 tests passed" or show failures
3. (Claude auto-runs this after code changes anyway)
```

### `<save>` (The Big One)
```
1. Run tests (verify nothing broken)
2. Update STATE.md:
   - Current task state (done vs pending)
   - What was accomplished this session
   - Any bugs/blockers found
   - Decisions made
   - Next steps
3. Update other docs if relevant:
   - ROADMAP.md if phase status changed
   - PROJECT.md if requirements changed
4. Git add all changes
5. Generate descriptive commit message
6. Git commit + push
7. Say: "Saved and pushed. Ready to /clear or keep working."
```

### `<deploy>`
```
1. Run tests (safety check)
2. Merge current branch to master (if not on master)
3. Run `npm run deploy`
4. If success: "✓ Deployed! https://thebluemuzzy.github.io/GOOPS/"
5. If fail: Show error message
```

### `<flow>`
Show the daily workflow diagram (see SOP.md for full version):

```
START SESSION
      ↓
/gsd:progress  →  "Where am I? What's next?"
      ↓
[Plan if needed: /gsd:plan-phase]
      ↓
[Code: /gsd:execute-plan or just ask Claude]
      ↓
   <test>  ←  Claude runs this automatically
      ↓
   <npm>   →  Manual testing in browser
      ↓
[Issues? Tell Claude. Good? Continue...]
      ↓
   <save>  →  Lock in progress
      ↓
[Keep working? Or share with friends?]
      ↓
  <deploy> →  Push to live site
      ↓
   /clear  →  Fresh context (STATE.md has everything)
```

### `<commands>`
Show the command tables above.

---

## Key Files

| File | Purpose |
|------|---------|
| `.planning/STATE.md` | Current position, session continuity |
| `.planning/PROJECT.md` | Requirements, key decisions |
| `.planning/ROADMAP.md` | Milestones, phases, progress |
| `.planning/SOP.md` | Workflow reference, concepts, flow diagrams |
| `PRD.md` | Full game requirements |
| `constants.ts` | Upgrade configurations |

---

## Current Status

**Version:** 1.1.13 (build auto-increments)
**Tests:** 150 across 7 files
**Milestones complete:** v1.0 (MVP), v1.1 (Architecture), v1.2 (Progression)

### Key Systems
- **Complications**: LASER@rank4, LIGHTS@rank2, CONTROLS@rank6
- **Upgrades**: 20 total (8 Onboarding + 4 Junk + 4 Mixer + 4 Cracked)
- **XP Curve**: `3500 + (rank * 250)` per rank

---

## Project-Specific Patterns

### Code Reuse
Always check for existing patterns before creating new ones:

| Need | Solution | Location |
|------|----------|----------|
| Shake animation | `className="shake-anim"` | `GameBoard.css` |
| Event communication | `gameEventBus.emit()` | `core/events.ts` |
| Stop pointer events | `e.stopPropagation(); e.preventDefault();` | Common pattern |

### Mobile Performance
Mobile is throttled to 40fps with simplified rendering. Key files:
- `hooks/useGameEngine.ts` — Frame throttling
- `components/GameBoard.tsx` — `isMobile` conditional rendering

**Do NOT remove `isMobile` checks without understanding why they exist.**

### Version Numbers
Format: **X.Y.Z.B** (Major.Minor.Patch.Build)
- **B** auto-increments on dev/build
- **Z** bumped for meaningful changes
- **Y** bumped for milestone completion
- **X** bumped for release to friends

### File Sizes to Watch
- `GameEngine.ts` ~1177 lines (consider extracting CrackManager if grows)
- `GameBoard.tsx` ~758 lines (manageable)

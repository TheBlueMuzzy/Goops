# Obsidian Overhaul Plan

**Goal:** Transform `.planning/` and root `.md` files into a cohesive, browsable knowledge base in Obsidian.

**Scope:** Documentation only. No code changes. No disruption to current workflow.

**Status:** PLANNED - Waiting for safe migration window

---

## Migration Strategy

**Problem:** Another Claude instance is actively working in the repo and references these docs.

**Solution:** Parallel folder migration

1. **Create** `.planning-v2/` as working folder
2. **Copy** all `.md` files to new structure (don't move yet)
3. **Transform** files in `.planning-v2/` (add frontmatter, wiki links, etc.)
4. **Verify** in Obsidian - make sure it all works
5. **Pause** game development work
6. **Swap** - rename `.planning/` → `.planning-old/`, then `.planning-v2/` → `.planning/`
7. **Update** CLAUDE.md to point to new locations if needed
8. **Resume** game development with new docs

This way the working Claude never sees broken/partial docs.

---

## Decisions Made

| Question | Decision | Rationale |
|----------|----------|-----------|
| Archive old phase plans? | **No** - keep in `milestones/` | They're useful historical records, already organized |
| ARCHITECTURE_PLAN.md? | **Archive it** | Outdated, superseded by `.planning/codebase/ARCHITECTURE.md` |
| Home page name? | **HOME.md** | Friendly, obvious, Obsidian can set as default |

---

## Current State

- **20 markdown files** across root, `.planning/`, and subfolders
- **No wiki links** - files reference each other by name but not `[[linked]]`
- **No frontmatter** - no tags, dates, or metadata
- **Inconsistent structure** - each file evolved organically
- **No index/home page** - no central navigation point

---

## Proposed Changes

### Phase 1: Foundation (Low Risk)

**1.1 Add Frontmatter to All Files**

Every `.md` file gets a YAML header:
```yaml
---
title: Project Definition
type: reference | roadmap | plan | session | architecture
tags: [v1.2, progression, active]
created: 2026-01-15
updated: 2026-01-25
status: active | shipped | archived
---
```

Types:
- `reference` - PRD, SYSTEM-INVENTORY, DESIGN_VISION
- `roadmap` - ROADMAP.md, version roadmaps
- `plan` - Phase execution plans (PLAN.md, FIX.md, etc.)
- `session` - STATE.md (continuity between sessions)
- `architecture` - All codebase/ docs

**1.2 Create Home Page**

New file: `.planning/HOME.md` (or `INDEX.md`)
- Central navigation hub
- Links to all major sections
- Quick status at a glance

### Phase 2: Wiki Links (Medium Effort)

**2.1 Convert Plain References to Wiki Links**

Before:
```
See STATE.md for current position
Reference: PRD.md
```

After:
```
See [[STATE]] for current position
Reference: [[PRD]]
```

**2.2 Add Contextual Backlinks**

Where it makes sense, add "Related" sections:
```markdown
## Related
- [[ROADMAP]] - Where this phase fits
- [[DESIGN_VISION]] - Why these decisions
- [[SYSTEM-INVENTORY]] - What systems are affected
```

### Phase 3: Structure Consistency (Medium Effort)

**3.1 Standardize Roadmap Files**

All version roadmaps (v1.0, v1.1, v1.2) should have:
- Same frontmatter structure
- Same section order (Overview → Phases → Status)
- Consistent phase formatting

**3.2 Standardize Plan Files**

All phase plans should have:
- Frontmatter with phase number, status, dates
- Same sections (Goal → Tasks → Acceptance Criteria → Notes)

**3.3 Consolidate or Archive**

Consider:
- Merge `MILESTONES.md` content into version roadmaps (duplicative)
- Archive completed phase plans to `.planning/archive/`

### Phase 4: Graph Optimization (Polish)

**4.1 Strategic Linking for Graph View**

Ensure these hub documents link to everything relevant:
- `HOME.md` → all major docs
- `PROJECT.md` → requirements, roadmaps, state
- `STATE.md` → current work, blockers, decisions

**4.2 Tag Strategy**

Consistent tags across all files:
- Version: `#v1.0`, `#v1.1`, `#v1.2`
- Type: `#architecture`, `#gameplay`, `#progression`
- Status: `#active`, `#shipped`, `#blocked`

---

## File-by-File Changes

| File | Changes Needed |
|------|----------------|
| `CLAUDE.md` | Add frontmatter, wiki links to referenced docs |
| `PRD.md` | Add frontmatter only (standalone reference doc) |
| `ARCHITECTURE_PLAN.md` | **Archive** to `.planning/archive/` with "superseded" header |
| `README.md` | Leave as-is (GitHub-facing) |
| `.planning/PROJECT.md` | Frontmatter, wiki links, clean up references |
| `.planning/STATE.md` | Frontmatter, wiki links |
| `.planning/ROADMAP.md` | Frontmatter, wiki links to version roadmaps |
| `.planning/MILESTONES.md` | Consider merging into roadmaps or archiving |
| `.planning/DESIGN_VISION.md` | Frontmatter, wiki links |
| `.planning/SYSTEM-INVENTORY.md` | Frontmatter only |
| `.planning/INVESTIGATIONS.md` | Frontmatter, wiki links |
| `.planning/codebase/*.md` | Frontmatter, inter-link the 7 architecture docs |
| `.planning/milestones/*.md` | Frontmatter, consistent structure |
| `.planning/plans/*.md` | Frontmatter, archive old phases |

---

## New Files/Folders to Create

| Item | Purpose |
|------|---------|
| `.planning/HOME.md` | Central index/navigation page |
| `.planning/archive/` | Folder for outdated docs (not deleted, just moved) |
| `.planning/archive/ARCHITECTURE_PLAN-original.md` | Original vision doc (superseded) |

---

## What NOT to Change

- **README.md** - GitHub-facing, leave standard
- **File locations** - Keep current folder structure
- **Content meaning** - Only restructure, don't rewrite substance
- **CLAUDE.md core instructions** - Only add links/frontmatter

---

## Estimated Effort

| Phase | Files Touched | Risk | Effort |
|-------|---------------|------|--------|
| 1: Foundation | All 20 | Low | ~30 min |
| 2: Wiki Links | ~15 | Low | ~45 min |
| 3: Structure | ~10 | Medium | ~1 hour |
| 4: Graph Polish | ~5 | Low | ~20 min |

**Total:** ~2.5 hours of Claude work, spread across sessions if desired.

---

## Verification

After each phase:
1. Open `.planning/` in Obsidian
2. Check graph view shows connections
3. Verify links resolve correctly
4. Test search/tag filtering

---

## Questions Resolved

| Question | Answer |
|----------|--------|
| Archive old plans? | No - keep in `milestones/`, they're useful history |
| ARCHITECTURE_PLAN.md? | Archive to `.planning/archive/` with "superseded" note |
| Home page name? | `HOME.md` |
| Tag preferences? | Default set: version, type, status (can expand later) |

## Open Questions

1. **When to execute?** Need a pause in game development work
2. **Root-level .md files?** Should `PRD.md`, `README.md`, `CLAUDE.md` stay at root or move into `.planning/`?

---

## How to Resume This Work

When ready to execute, tell Claude:

> "Execute the Obsidian overhaul plan in `.planning/OBSIDIAN-OVERHAUL-PLAN.md`. Start by creating `.planning-v2/` and copying files there."

Claude should:
1. Read this plan
2. Create the parallel folder structure
3. Transform files one by one
4. Ask for verification before the swap

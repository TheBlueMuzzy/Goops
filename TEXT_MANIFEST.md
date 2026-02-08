# Text Manifest

All visible text in Goops. Edit this file, then ask Claude to read it and apply changes.

## Typography Scale (defined in index.html)

| Class | Size | Use For |
|-------|------|---------|
| t-meta | 10px | Dev tools, version footer, copyright ONLY |
| t-caption | 12px | Dev panel labels ONLY |
| t-body | 18px | All player-facing body text minimum |
| t-heading | 24px | Section headings, card titles |
| t-title | 28px | Screen/panel titles |
| t-display | 36px | Big numbers, scores, prominent stats |
| t-hero | 48px | Splash/hero text |

---

## MAIN MENU (MainMenu.tsx)

| # | Element | Text | Class | Color | Weight | Font | Extra |
|---|---------|------|-------|-------|--------|------|-------|
| 1 | h1 title | GOOPS | text-7xl md:text-9xl | green gradient | normal | Chewy | drop-shadow |
| 2 | subtitle | Filtration Defense | t-body | text-green-500/60 | normal | mono | uppercase tracking-[0.5em] |
| 3 | rank label | Operator Rank | t-body | text-slate-500 | bold | default | uppercase tracking-wider |
| 4 | rank value | {rank} | t-display | text-white | bold | mono | leading-none |
| 5 | scraps label | Scraps | t-body | text-yellow-500 | bold | default | uppercase tracking-wider |
| 6 | scraps value | {scraps} | t-display | text-yellow-400 | bold | mono | leading-none |
| 7 | threshold label | PROMOTION THRESHOLD | t-body | text-slate-500 | normal | mono | text-right |
| 8 | XP values | {progress} / {needed} | t-body | text-white | semibold | mono | inside bar |
| 9 | play button | ENGAGE | t-heading | text-white | bold | default | |
| 10 | help button | HOW TO PLAY | t-body | text-slate-500 | bold | default | |
| 11 | systems button | SYSTEMS | t-body | text-slate-500 | bold | default | |
| 12 | config button | CONFIG | t-body | text-slate-500 | bold | default | |
| 13 | version footer | v1.1.13.{build} | t-meta | text-slate-600 | normal | mono | dev |
| 14 | copyright | MuzzyMade (c) 2026 | t-meta | text-slate-500 | normal | mono | dev |
| 15 | wipe button | WIPE SAVE DATA | t-meta | text-red-500/50 | normal | mono | dev |

---

## IN-GAME HUD (Controls.tsx)

| # | Element | Text | Class | Color | Weight | Font | Extra |
|---|---------|------|-------|-------|--------|------|-------|
| 1 | pressure label | Pressure | t-body | text-slate-400/90 | bold | default | uppercase tracking-widest |
| 2 | pressure value | {pressure}% | t-display | text-slate-200 | black | mono | animate-pulse when critical |
| 3 | combo indicator | x{N} SURGE | t-heading | text-yellow-400 | black | default | animate-bounce |
| 4 | score label | Shift Score | t-body | text-green-500/90 | bold | default | uppercase tracking-widest |
| 5 | score value | {score} | t-display | text-green-400 | black | mono | |
| 6 | desktop hints | ARROWS / WASD to Rotate... | t-body | text-slate-500 | normal | mono | opacity-30, hidden on mobile |

---

## PIECE PREVIEW (PiecePreview.tsx)

| # | Element | Text | Class | Color | Weight | Font | Extra |
|---|---------|------|-------|-------|--------|------|-------|
| 1 | label | NEXT / STORED | t-body | #94a3b8 | normal | mono | letter-spacing 1px |

---

## CONSOLE MONITOR (ConsoleView.tsx)

| # | Element | Text | Class | Color | Weight | Font | Extra |
|---|---------|------|-------|-------|--------|------|-------|
| 1 | running msg | CLEANING... | t-display | #5bbc70 | black | From Where You Are | animate-pulse |
| 2 | running msg | {pressure}% PSI | t-display | #f1a941 | black | From Where You Are | alternates |
| 3 | idle msg 1 | TO START SHIFT | t-display | #f1a941 | black | From Where You Are | animate-pulse |
| 4 | idle msg 2 | PULL DOWN PERISCOPE | t-display | #f1a941 | black | From Where You Are | animate-pulse |

---

## IN-TANK OVERLAYS (GameBoard.tsx)

| # | Element | Text | Class | Color | Weight | Font | Extra |
|---|---------|------|-------|-------|--------|------|-------|
| 1 | floating score | +{points} | SVG fontSize=24 | dynamic | normal | default | floating animation |
| 2 | laser cooldown | {seconds}s | SVG fontSize=10 | white | normal | mono | SVG |
| 3 | controls cooldown | {seconds}s | SVG fontSize=10 | white | normal | mono | SVG |
| 4 | malfunction type | {Lights/Controls/Laser} | clamp(2rem,8vw,4rem) | text-red-500 | bold | From Where You Are | glow shadow |
| 5 | malfunction word | Malfunction | clamp(2rem,8vw,4rem) | text-red-500 | bold | From Where You Are | glow shadow |
| 6 | malfunction hint | Fix at Console | clamp(0.875rem,3vw,1.25rem) | text-red-400 | normal | Amazon Ember | |

---

## CONSOLE SVG (Art.tsx) -- SVG coordinate system, not screen pixels

| # | Element | Text | fontSize | Color | Weight | Font | Extra |
|---|---------|------|---------|-------|--------|------|-------|
| 1 | version footer | Version 1.1.13.{build} | 15.7 | #aad9d9 | normal | Amazon Ember | dev |
| 2 | copyright footer | MuzzyMade @ 2026 | 15.7 | #aad9d9 | normal | Amazon Ember | dev |
| 3 | rank selector | RANK SELECT | 20.93 | #aad9d9 | normal | Amazon Ember | dev |
| 4 | XP values | {current} / {next} | 14 | #ffffff | 600 | Amazon Ember | SVG |
| 5 | promotion label | PROMOTION THRESHOLD | 12 | #59acae | normal | Amazon Ember | SVG |
| 6 | rank number | {rank} | 34.88 | #6acbda | 800 | Amazon Ember | SVG |
| 7 | rank label | OPERATOR RANK | 20.93 | #6acbda | normal | Amazon Ember | SVG |
| 8 | abort button | END SHIFT EARLY | 20.93 | #ffffff | bold | Amazon Ember | SVG |
| 9 | abort confirm | ARE YOU SURE? | 20.93 | #ffffff | bold | Amazon Ember | SVG |
| 10 | abort X | X | 34.88 | #ef4444 | bold | Amazon Ember | SVG |
| 11 | upgrades button | UPGRADES | 20.93 | #45486c | bold | Amazon Ember | SVG |
| 12 | upgrade count | {count} | 34.88 | #ffd92b | bold | Amazon Ember | SVG |
| 13 | console title | GOOPS | 62.79 | #5bbc70 | normal | From Where You Are | SVG |
| 14 | help button | ? | 62.79 | #0f1528 | normal | From Where You Are | SVG |

---

## MINIGAME PANELS (SVG) -- LaserPanel, LightsPanel, ControlsPanel

| # | Element | Text | fontSize | Color | Weight | Extra |
|---|---------|------|---------|-------|--------|-------|
| 1 | idle | REPAIR {LASER/LIGHTS/CONTROLS} | 19.9 | #59acae | normal | SVG |
| 2 | active | REPAIR {LASER/LIGHTS/CONTROLS} | 19.9 | #ffffff | normal | SVG |
| 3 | fixed | {LASER/LIGHTS/CONTROLS} FIXED | 19.9 | #5bbc70 | normal | SVG |
| 4 | press prompt (controls only) | PRESS | 24 | #ffffff | bold | SVG |

---

## UPGRADE PANEL (UpgradePanel.tsx)

| # | Element | Text | Class | Color | Weight | Font | Extra |
|---|---------|------|-------|-------|--------|------|-------|
| 1 | header title | UPGRADES | SVG fontSize=28 | #f2a743 | normal | From Where You Are | SVG |
| 2 | scraps label | SCRAPS: | SVG fontSize=16 | #5bbc70 | 600 | Amazon Ember | SVG |
| 3 | scraps value | {scraps} | SVG fontSize=32 | #5bbc70 | 800 | Amazon Ember | SVG |
| 4 | empty title | NO UPGRADES AVAILABLE | t-heading | #6acbda | normal | From Where You Are | |
| 5 | empty hint | Reach Rank 2 to unlock... | t-body | #59acae | normal | default | |
| 6 | earning msg | Earn Scraps by Increasing... | t-body | #fbbf24 | normal | default | |
| 7 | tab labels | TOOLS / FEATURES / SYSTEMS / UTILITY | t-body | tab color | bold | From Where You Are | |
| 8 | card name | {upgrade.name} | t-body | accent | bold | default | tracking-wide |
| 9 | card desc | {upgrade.desc} | t-body | #59acae | normal | default | |
| 10 | equip toggle | ON / OFF | t-body | green/teal | bold | default | |
| 11 | minus button | - | t-heading | accent | bold | default | |
| 12 | plus button | + | t-heading | accent | bold | default | |
| 13 | level text | {current}/{max} | t-body | accent | bold | default | |
| 14 | effect text | Effect: {value} | t-body | #ffffff | normal | default | |
| 15 | current text | Current: {value} | t-body | #ffffff | normal | default | |
| 16 | unowned text | Current: Spend points... | t-body | #59acae | normal | default | |
| 17 | max bonus | Max: {bonus} | t-body | #5bbc70 | normal | default | italic |
| 18 | empty tab | No upgrades available... | t-body | #59acae | normal | default | |

---

## UPGRADES SCREEN (Upgrades.tsx)

| # | Element | Text | Class | Color | Weight | Font | Extra |
|---|---------|------|-------|-------|--------|------|-------|
| 1 | title | UPGRADES | t-title | text-yellow-400 | bold | default | tracking-wider |
| 2 | locked name | Locked Upgrade {i} | t-body | text-slate-300 | bold | default | |
| 3 | locked req | Requires Rank {N} | t-body | text-slate-500 | normal | default | |
| 4 | locked badge | LOCKED | t-body | text-slate-500 | bold | default | |
| 5 | hint | Play more to unlock... | t-body | text-slate-500 | normal | default | |

---

## SETTINGS (Settings.tsx)

| # | Element | Text | Class | Color | Weight | Font | Extra |
|---|---------|------|-------|-------|--------|------|-------|
| 1 | title | Config | t-title | text-slate-200 | normal | From Where You Are | uppercase tracking-wider |
| 2 | master label | Master Output | t-body | text-slate-300 | bold | default | uppercase tracking-wide |
| 3 | master value | {value}% | t-body | text-cyan-400 | bold | default | |
| 4 | music label | Music Level | t-body | text-slate-300 | bold | default | uppercase tracking-wide |
| 5 | music value | {value}% | t-body | text-purple-400 | bold | default | |
| 6 | sfx label | SFX Level | t-body | text-slate-300 | bold | default | uppercase tracking-wide |
| 7 | sfx value | {value}% | t-body | text-green-400 | bold | default | |
| 8 | invert label | Invert Rotation | t-body | text-slate-300 | bold | default | uppercase tracking-wide |
| 9 | footer | Audio System v2.1 | t-meta | text-slate-700 | bold | default | dev flavor text |

---

## OPERATOR JOURNAL (OperatorJournal.tsx)

| # | Element | Text | Class | Color | Weight | Font | Extra |
|---|---------|------|-------|-------|--------|------|-------|
| 1 | title | Operator Journal | t-title | text-slate-200 | normal | From Where You Are | uppercase tracking-wider |
| 2 | page title (unlocked) | {page.title} | t-body | text-slate-100 | bold | default | uppercase tracking-wider |
| 3 | page title (locked) | ??? | t-body | text-slate-600 | bold | default | uppercase tracking-wider |
| 4 | section heading | {section.heading} | t-heading | text-slate-200 | bold | default | uppercase tracking-wider |
| 5 | section body | {section.body} | t-body | text-slate-400 | normal | default | leading-relaxed |

---

## HOW TO PLAY (HowToPlay.tsx) -- legacy, replaced by Journal

| # | Element | Text | Class | Color | Weight | Font | Extra |
|---|---------|------|-------|-------|--------|------|-------|
| 1 | title | Operator Manual | t-title | text-slate-200 | normal | From Where You Are | uppercase tracking-wider |
| 2 | section heading | THE OBJECTIVE / CONTROLS / MECHANICS | t-heading | text-white | bold | default | tracking-wide |
| 3 | body text | (paragraphs) | t-body | text-slate-400 | normal | default | leading-relaxed |
| 4 | control key name | A / D, Q / E, S, etc. | t-body | text-cyan-400 | black | default | |
| 5 | control action | Rotate Tank View, etc. | t-body | text-slate-400 | bold | default | uppercase tracking-wider |
| 6 | touch hint | * Touch controls... | t-body | text-slate-500 | normal | default | italic |
| 7 | mechanic title | Priority Targets, etc. | t-body | text-slate-200 | bold | default | |
| 8 | mechanic desc | (paragraphs) | t-body | text-slate-400 | normal | default | |

---

## INTERCOM (IntercomMessage.tsx)

| # | Element | Text | Class | Color | Weight | Font | Extra |
|---|---------|------|-------|-------|--------|------|-------|
| 1 | header | Intercom | t-body | text-slate-500 | normal | mono | uppercase tracking-widest |
| 2 | message body | {fullText} | t-display | text-slate-300 | normal | default | typewriter effect |
| 3 | dismiss button | X | t-heading | text-slate-500 | normal | mono | |
| 4 | accept button | checkmark | t-heading | text-green-400 | normal | mono | |

---

## TRAINING INTERCOM MESSAGES (tutorialSteps.ts)

All 17 training step messages. Displayed via the Intercom component during rank 0 training.

| # | Step ID | Keywords | Full Text |
|---|---------|----------|-----------|
| 1 | A1_BRIEFING | operator, safety training, shift | Welcome aboard, operator. Standard safety training is mandatory before your first shift. Pay attention. |
| 2 | A2_PERISCOPE | periscope, tank, drag | Use the periscope to look inside the tank. Drag it down to enter. |
| 3 | B1_GOOP_INTRO | goop, extruder, tank | The goop extruder drops material into the tank. Watch where it lands. |
| 4 | B2_FAST_FALL | hold down, speed up, drop | Hold down to speed up the drop. Or just tap to slam it down. Your call. |
| 5 | B3_PIECE_ROTATION | rotate, piece, Q, E | Rotate the piece before it lands. Q and E keys, or tap the screen edges. |
| 6 | C1_POP_INTRO | pop, goop, pressure, tap | Too much goop builds pressure. Tap solid goop to pop it and vent the tank. |
| 7 | C2_MERGE | same color, merges, bigger | Same color goop merges together into bigger blobs. Bigger pops vent more pressure. |
| 8 | C3_FILL_TIMING | solid, fill, pop | Fresh goop needs time to solidify. You can only pop solid goop. The pressure line shows the threshold. |
| 9 | D1_CRACK_APPEARS | crack, matching, seal | A crack in the tank wall. Only matching color goop can seal it. That is literally your one job. |
| 10 | D2_TANK_ROTATION | rotate, tank, swipe, A, D | The goop is not above the crack. Rotate the tank to line it up. Swipe or use A and D keys. |
| 11 | E1_PRESSURE_REVEAL | pressure, rising, goop | Notice the pressure gauge. Every piece of goop in the tank adds to it. If it hits maximum capacity, you fail. |
| 12 | E2_PRESSURE_THRESHOLD | pressure line, above, pop | Goop can only be popped when the pressure line rises above it. Watch the line climb. |
| 13 | E3_SUCCESSFUL_POP | pop, pressure drops, bonus | There. Pressure drops when you pop. Bigger groups drop it more. Popping also scores a bonus. |
| 14 | F1_CRACK_SEAL | seal, crack, massive, pressure relief | The green goop is sitting on the green crack. Pop it to seal the crack. Sealed cracks give massive pressure relief. |
| 15 | G1_OFFSCREEN_CRACK | wraps around, rotate, 360 | The tank is a cylinder. It wraps around. Keep rotating to see everything. There is more tank than you think. |
| 16 | G2_SCAFFOLDING | stack, scaffolding, reach, higher | That crack is too high to reach from the floor. Stack pieces as scaffolding to reach it. |
| 17 | G3_SCAFFOLDING_TRADEOFF | balance, scaffolding, pressure | More goop means more pressure. But sometimes you need scaffolding to reach the cracks. Balance is everything. Training complete. |

---

## JOURNAL PAGE CONTENT (journalEntries.ts)

Updated sections for training phases. Only changed/new sections listed.

| Page | Section | Text |
|------|---------|------|
| BASICS | YOUR OBJECTIVE (new) | Seal all cracks before the shift timer runs out. Cracks appear in the tank walls. Place matching-color goop on a crack, then pop it to seal. |
| CONTROLS | TANK ROTATION (updated) | Swipe left/right or A/D keys to rotate the tank. The tank is a cylinder — it wraps all the way around. |
| POPPING | WHAT CAN BE POPPED (updated) | Only fully solid goop below the pressure line can be popped. Fresh goop needs time to solidify — watch it fill in. |
| POPPING | MERGING (new) | Same-color goop touching each other merges into bigger blobs. Bigger pops vent more pressure and score more points. |
| CRACKS | SEALING CRACKS (updated) | Place matching-color goop on a crack and pop it. Sealed cracks give a massive pressure drop. This is the core of your job. |
| WRAPPING | THE TANK WRAPS (updated) | The tank is a full cylinder. Goop on the left edge connects to goop on the right edge. Rotate all the way around to see everything. |
| SCORING | SHIFTS (new) | Each shift lasts 75 seconds. Seal all assigned cracks before time runs out. |

---

## END GAME (EndGameScreen.tsx) -- All SVG

| # | Element | Text | fontSize | Color | Weight | Font | Extra |
|---|---------|------|---------|-------|--------|------|-------|
| 1 | header | SHIFT OVER | 42 | #6acbda | normal | From Where You Are | SVG |
| 2 | grade | GRADE: {A/B/C/FAILURE} | 24 | dynamic | 800 | Amazon Ember | SVG |
| 3 | rank label | OPERATOR RANK | 20.93 | #6acbda | normal | Amazon Ember | SVG |
| 4 | rank number | {rank} | 34.88 | #6acbda | 800 | Amazon Ember | SVG |
| 5 | promotion label | PROMOTION THRESHOLD | 12 | #59acae | normal | Amazon Ember | SVG |
| 6 | XP values | {current} / {next} | 14 | #ffffff | 600 | Amazon Ember | SVG |
| 7 | score label | SHIFT SCORE | 20.93 | #6acbda | normal | Amazon Ember | SVG |
| 8 | score value | {score} | 60 | #ffffff | 800 | Amazon Ember | SVG |
| 9 | scraps label | SCRAPS | 20.93 | #6acbda | normal | Amazon Ember | SVG |
| 10 | scraps value | {scraps} | 60 | #ffd92b | 800 | Amazon Ember | SVG |
| 11 | cracks label | CRACKS FILLED | 18 | #6acbda | normal | Amazon Ember | SVG |
| 12 | cracks value | {filled} / {target} | 36 | #ffffff | 700 | Amazon Ember | SVG |
| 13 | pressure label | PRESSURE VENTED | 18 | #6acbda | normal | Amazon Ember | SVG |
| 14 | pressure value | {percent}% | 36 | #ffffff | 700 | Amazon Ember | SVG |
| 15 | max pop label | MAX POP | 18 | #6acbda | normal | Amazon Ember | SVG |
| 16 | max pop value | {count} | 36 | #ffffff | 700 | Amazon Ember | SVG |
| 17 | residual label | RESIDUAL GOOP | 18 | #6acbda | normal | Amazon Ember | SVG |
| 18 | residual value | -{penalty} | 36 | #ffffff | 700 | Amazon Ember | SVG |
| 19 | drag instruction | DRAG UP TO END SHIFT | 24 | #d82727 | normal | From Where You Are | SVG |

---

## Notes

- **SVG sections** (Art.tsx, EndGameScreen, MiniGame panels): Font sizes are in SVG coordinate space, not screen pixels. They scale with the SVG viewBox. Edit with caution.
- **"default" font** = Amazon Ember (set on body in index.html)
- **"mono"** = monospace / font-mono
- To change a value: edit the Class column, then tell Claude to "read TEXT_MANIFEST.md and apply all changes"


import { JournalPage } from '../types/tutorial';

/**
 * Journal page definitions.
 *
 * Each page maps to a broader topic that may span multiple tutorial steps.
 * Pages unlock based on tutorial step completion (or 'ALWAYS' for basics).
 *
 * Content for first 6 pages is complete. Remaining 5 are stubs for Phases 35-36.
 */
export const JOURNAL_PAGES: JournalPage[] = [
  // --- Always visible ---
  {
    id: 'BASICS',
    title: 'THE OBJECTIVE',
    icon: 'Gauge',
    unlockedBy: 'ALWAYS',
    sections: [
      {
        heading: 'PRESSURE SYSTEM',
        body: 'The tank pressure climbs as goop accumulates. If pressure hits 100%, the system fails. Pop goop to vent pressure and buy time.',
      },
      {
        heading: 'POPPING BASICS',
        body: 'Click or tap solid goop below the pressure line to pop it. Bigger groups vent more pressure. Keep the tank clear.',
      },
      {
        heading: 'YOUR OBJECTIVE',
        body: 'Seal all cracks before the shift timer runs out. Cracks appear in the tank walls. Place matching-color goop on a crack, then pop it to seal.',
      },
    ],
  },

  // --- Unlocked by tutorial steps ---
  {
    id: 'CONTROLS',
    title: 'CONTROLS',
    icon: 'Keyboard',
    unlockedBy: 'ROTATE_INTRO',
    sections: [
      {
        heading: 'TANK ROTATION',
        body: 'Swipe left/right or A/D keys to rotate the tank. The tank is a cylinder — it wraps all the way around.',
      },
      {
        heading: 'PIECE ROTATION',
        body: 'Q / E keys or tap screen edges to rotate the falling piece.',
      },
      {
        heading: 'SOFT DROP',
        body: 'S key or swipe down to make the piece fall faster.',
      },
      {
        heading: 'HOLD & SWAP',
        body: 'R key to swap the falling piece with your held piece. One swap per drop.',
      },
      {
        heading: 'CONSOLE RETURN',
        body: 'W or Space to return to the console view. Use this to fix complications.',
      },
      {
        heading: 'CLICK TO POP',
        body: 'Click or tap solid goop below the pressure line. Groups of same-color goop pop together.',
      },
    ],
  },

  {
    id: 'POPPING',
    title: 'PURGING',
    icon: 'Target',
    unlockedBy: 'POP_TIMING',
    sections: [
      {
        heading: 'WHAT CAN BE POPPED',
        body: 'Only fully solid goop below the pressure line can be popped. Fresh goop needs time to solidify — watch it fill in.',
      },
      {
        heading: 'TIMING TENSION',
        body: 'Let goop accumulate for bigger group pops and more points. But wait too long and pressure overwhelms you. Find the balance.',
      },
      {
        heading: 'MERGING',
        body: 'Same-color goop touching each other merges into bigger blobs. Bigger pops vent more pressure and score more points.',
      },
    ],
  },

  {
    id: 'SCORING',
    title: 'SCORING',
    icon: 'ArrowUpCircle',
    unlockedBy: 'FIRST_SHIFT',
    sections: [
      {
        heading: 'GROUP SIZE BONUS',
        body: 'Larger groups of connected same-color goop score exponentially more. Two cells is good. Ten cells is great.',
      },
      {
        heading: 'ELEVATION BONUS',
        body: 'Goop popped higher in the tank scores more. Build up, then pop from the top for maximum points.',
      },
      {
        heading: 'SHIFTS',
        body: 'Each shift lasts 75 seconds. Seal all assigned cracks before time runs out.',
      },
    ],
  },

  {
    id: 'CRACKS',
    title: 'STRUCTURAL DAMAGE',
    icon: 'AlertTriangle',
    unlockedBy: 'CRACK_INTRO',
    sections: [
      {
        heading: 'CRACKS SPREAD',
        body: 'Cracks appear in the tank walls and grow over time. Left unchecked, they branch and spread across the surface.',
      },
      {
        heading: 'SEALING CRACKS',
        body: 'Place matching-color goop on a crack and pop it. Sealed cracks give a massive pressure drop. This is the core of your job.',
      },
    ],
  },

  {
    id: 'WRAPPING',
    title: 'CYLINDER WRAP',
    icon: 'RefreshCw',
    unlockedBy: 'WRAP_INTRO',
    sections: [
      {
        heading: 'THE TANK WRAPS',
        body: 'The tank is a full cylinder. Goop on the left edge connects to goop on the right edge. Rotate all the way around to see everything.',
      },
      {
        heading: 'CROSS-SEAM CONNECTIONS',
        body: 'Same-color goop touching across the seam forms one group. Plan wrapping pops for massive combos.',
      },
    ],
  },

  // --- Stub pages (content in Phases 35-36) ---
  {
    id: 'COMPLICATIONS_LIGHTS',
    title: 'LIGHTS FAILURE',
    icon: 'Lightbulb',
    unlockedBy: 'COMPLICATION_LIGHTS',
    sections: [
      {
        heading: 'LIGHTS SYSTEM',
        body: 'Details on the lights complication system. (Operator notes pending.)',
      },
    ],
  },

  {
    id: 'COMPLICATIONS_LASER',
    title: 'LASER MALFUNCTION',
    icon: 'Zap',
    unlockedBy: 'COMPLICATION_LASER',
    sections: [
      {
        heading: 'LASER SYSTEM',
        body: 'Details on the laser complication system. (Operator notes pending.)',
      },
    ],
  },

  {
    id: 'COMPLICATIONS_CONTROLS',
    title: 'CONTROLS LOCKOUT',
    icon: 'Lock',
    unlockedBy: 'COMPLICATION_CONTROLS',
    sections: [
      {
        heading: 'CONTROLS SYSTEM',
        body: 'Details on the controls complication system. (Operator notes pending.)',
      },
    ],
  },

  {
    id: 'UPGRADES',
    title: 'UPGRADES',
    icon: 'Wrench',
    unlockedBy: 'UPGRADE_INTRO',
    sections: [
      {
        heading: 'UPGRADE SYSTEM',
        body: 'Details on the upgrade system. (Operator notes pending.)',
      },
    ],
  },

  {
    id: 'ABILITIES',
    title: 'ACTIVE ABILITIES',
    icon: 'Sparkles',
    unlockedBy: 'ABILITY_INTRO',
    sections: [
      {
        heading: 'ABILITIES',
        body: 'Details on active abilities. (Operator notes pending.)',
      },
    ],
  },
];


import React, { useState, useMemo } from 'react';
import {
  Gauge,
  Keyboard,
  Target,
  ArrowUpCircle,
  AlertTriangle,
  RefreshCw,
  Lightbulb,
  Zap,
  Lock,
  Wrench,
  Sparkles,
  ChevronLeft,
  ChevronDown,
  LucideIcon,
} from 'lucide-react';
import { JOURNAL_PAGES } from '../data/journalEntries';
import { JournalPageId } from '../types/tutorial';
import './OperatorJournal.css';

// --- Icon mapping: string name -> lucide component ---
const ICON_MAP: Record<string, LucideIcon> = {
  Gauge,
  Keyboard,
  Target,
  ArrowUpCircle,
  AlertTriangle,
  RefreshCw,
  Lightbulb,
  Zap,
  Lock,
  Wrench,
  Sparkles,
};

interface OperatorJournalProps {
  completedSteps: string[];
  onBack: () => void;
}

export const OperatorJournal: React.FC<OperatorJournalProps> = ({ completedSteps, onBack }) => {
  // Determine which pages are unlocked
  const unlockedPageIds = useMemo(() => {
    const ids = new Set<JournalPageId>();
    for (const page of JOURNAL_PAGES) {
      if (page.unlockedBy === 'ALWAYS' || completedSteps.includes(page.unlockedBy)) {
        ids.add(page.id);
      }
    }
    return ids;
  }, [completedSteps]);

  // Default expanded: first unlocked page
  const defaultPage = useMemo(() => {
    const first = JOURNAL_PAGES.find(p => unlockedPageIds.has(p.id));
    return first?.id ?? null;
  }, [unlockedPageIds]);

  const [expandedPageId, setExpandedPageId] = useState<JournalPageId | null>(defaultPage);

  const handleToggle = (pageId: JournalPageId) => {
    if (!unlockedPageIds.has(pageId)) return;
    setExpandedPageId(prev => prev === pageId ? null : pageId);
  };

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* Green radial gradient background */}
      <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#059669_0%,transparent_50%)] pointer-events-none" />

      {/* Constrained Aspect Ratio Container (9:16) */}
      <div
        className="relative z-10 w-full h-full shadow-2xl"
        style={{
          width: 'min(100vw, 100dvh * 0.5625)',
          height: 'min(100dvh, 100vw * 1.7778)',
        }}
      >
        <div className="w-full h-full flex flex-col items-center relative bg-slate-950 overflow-hidden border-x-4 border-slate-900">

          {/* Title — fixed at top, centered */}
          <div className="w-full flex items-center justify-center pt-5 pb-3 flex-shrink-0">
            <h2
              className="t-title text-slate-200 tracking-wider uppercase"
              style={{ fontFamily: '"From Where You Are", cursive' }}
            >
              Operator Journal
            </h2>
          </div>

          {/* Accordion — single scrollable column */}
          <div className="w-full flex-1 overflow-y-auto pb-28 px-3 space-y-1.5">
            {JOURNAL_PAGES.map(page => {
              const isUnlocked = unlockedPageIds.has(page.id);
              const isExpanded = expandedPageId === page.id;
              const IconComponent = ICON_MAP[page.icon];

              return (
                <div key={page.id}>
                  {/* Accordion Header */}
                  <button
                    onClick={() => handleToggle(page.id)}
                    disabled={!isUnlocked}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3
                      rounded-lg border text-left transition-all
                      ${isExpanded
                        ? 'bg-slate-800 border-green-600 text-slate-100'
                        : isUnlocked
                          ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                          : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                      }
                    `}
                    style={{ minHeight: '48px' }}
                  >
                    {/* Icon */}
                    <div className="relative flex-shrink-0">
                      {IconComponent && (
                        <IconComponent
                          className={`w-5 h-5 ${isExpanded ? 'text-green-400' : isUnlocked ? 'text-slate-500' : 'text-slate-700'}`}
                        />
                      )}
                      {!isUnlocked && (
                        <Lock className="w-3 h-3 text-slate-600 absolute -bottom-1 -right-1" />
                      )}
                    </div>

                    {/* Title */}
                    <span className="t-body flex-1 font-bold uppercase tracking-wider">
                      {isUnlocked ? page.title : '???'}
                    </span>

                    {/* Expand/collapse indicator */}
                    {isUnlocked && (
                      <ChevronDown
                        className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-green-400' : 'text-slate-600'
                        }`}
                      />
                    )}
                  </button>

                  {/* Accordion Content — sections nested inside */}
                  {isExpanded && isUnlocked && (
                    <div className="journal-page-enter mt-1.5 mb-2 space-y-3 pl-2 pr-1">
                      {page.sections.map((section, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 backdrop-blur-sm"
                        >
                          <h4 className="t-heading font-bold text-slate-200 uppercase tracking-wider mb-2">
                            {section.heading}
                          </h4>
                          <p className="t-body text-slate-400 leading-relaxed">
                            {section.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Floating Bottom Button */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20 pointer-events-none">
            <button
              onClick={onBack}
              className="pointer-events-auto flex items-center justify-center bg-green-700 hover:bg-green-600 text-black rounded-full shadow-[0_0_20px_rgba(21,128,61,0.4)] transition-all active:scale-95 border border-green-500/30"
              style={{
                width: 'min(13.2vw, 7.4vh)',
                height: 'min(13.2vw, 7.4vh)',
              }}
            >
              <ChevronLeft className="w-1/2 h-1/2 stroke-[3]" />
            </button>
          </div>

          {/* Bottom Gradient Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-10" />
        </div>
      </div>
    </div>
  );
};

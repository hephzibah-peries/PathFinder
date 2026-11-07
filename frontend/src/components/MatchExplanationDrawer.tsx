import { useState, useEffect } from 'react';
import type { SkillEntry } from '../data/mock';
import { SkillTag, SkillSourceBadge } from './ui';

export interface FactorBreakdown {
  label: string;
  weight: number; // percentage weight in scoring
  score: number; // 0–100 actual score for this factor
}

export interface MissingSkillEntry extends SkillEntry {
  impact: string;
}

interface MatchExplanationDrawerProps {
  open: boolean;
  onClose: () => void;
  internshipTitle: string;
  company: string;
  overallMatch: number;
  matched: SkillEntry[];
  missing: MissingSkillEntry[];
  factorBreakdown: FactorBreakdown[];
}

/** Weighted contribution of a factor to the final score (0–100 scale). */
function weightedScore(factor: FactorBreakdown) {
  return Math.round((factor.score * factor.weight) / 100);
}

export default function MatchExplanationDrawer({
  open,
  onClose,
  internshipTitle,
  company,
  overallMatch,
  matched,
  missing,
  factorBreakdown,
}: MatchExplanationDrawerProps) {
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setClosing(false);
      setMounted(true);
    }
  }, [open]);

  function handleClose() {
    setClosing(true);
    setTimeout(() => {
      setMounted(false);
      onClose();
    }, 180);
  }

  if (!mounted) return null;

  const verifiedCount = matched.filter((s) => s.source === 'verified').length;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`drawer-overlay ${closing ? 'drawer-overlay-closing' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`drawer-panel ${closing ? 'drawer-panel-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Match explanation"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E5D5CE] bg-white px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#7A4B43]">
              Explainable AI Match Breakdown
            </p>
            <h2 className="mt-1 font-serif text-xl font-bold text-[#2B1B17] leading-snug">{internshipTitle}</h2>
            <p className="mt-0.5 text-sm text-[#7A6A65]">{company}</p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-[#7A6A65] hover:bg-[#FAF6F4] hover:text-[#2B1B17] transition-colors"
            aria-label="Close drawer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Overall score banner */}
        <div className="flex items-center gap-4 border-b border-[#E5D5CE] bg-[#FDF2ED] px-6 py-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[#7A4B43] text-white shadow-sm">
            <span className="font-serif text-[28px] font-bold leading-none text-white">{overallMatch}%</span>
          </div>
          <div>
            <p className="text-base font-bold text-[#2B1B17]">Semantic AI Compatibility</p>
            <p className="mt-0.5 text-sm text-[#7A6A65]">
              {verifiedCount} of {matched.length} matched skills validated against active profile data.
            </p>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* ── Section 1: Matched Skills ── */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                Matched Skills ({matched.length})
              </h3>
            </div>
            <div className="space-y-2">
              {matched.map((skill) => (
                <div
                  key={skill.name}
                  className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3"
                >
                  <span className="text-sm font-semibold text-emerald-950">{skill.name}</span>
                  <SkillSourceBadge source={skill.source} />
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 2: Missing Skills ── */}
          {missing.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-rose-900 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                  Target Skill Gaps ({missing.length})
                </h3>
              </div>
              <div className="space-y-2.5">
                {missing.map((skill) => (
                  <div
                    key={skill.name}
                    className="rounded-xl border border-rose-300 bg-rose-50 p-3.5"
                  >
                    <div className="mb-1.5">
                      <SkillTag label={skill.name} state="missing" />
                    </div>
                    <p className="text-xs text-rose-900 leading-relaxed font-medium">{skill.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Section 3: Weighted Factor Breakdown ── */}
          <div className="border-t border-[#E5D5CE] pt-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#7A6A65] mb-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7A4B43]" />
              Scoring Weight Model
            </h3>
            <div className="space-y-3">
              {factorBreakdown.map((factor) => (
                <div key={factor.label} className="rounded-xl border border-[#E5D5CE] bg-[#FAF6F4] p-3.5">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-semibold text-[#2B1B17]">{factor.label}</span>
                    <span className="text-[#7A6A65]">
                      Score: <b className="text-[#7A4B43]">{factor.score}%</b> (Weight {factor.weight}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5D5CE]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#E6A694] to-[#7A4B43] transition-all duration-700"
                      style={{ width: `${factor.score}%` }}
                    />
                  </div>
                  <div className="mt-1.5 text-right text-xs text-[#7A6A65] font-medium">
                    Contributes +{weightedScore(factor)} pts to final score
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

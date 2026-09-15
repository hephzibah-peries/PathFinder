import { useState, useEffect } from 'react';
import type { SkillEntry } from '../data/mock';
import { SkillTag, SkillSourceBadge } from './ui';

export interface FactorBreakdown {
  label: string;
  weight: number; // percentage weight in scoring
  score: number;  // 0–100 actual score for this factor
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

  // Mount/unmount with animation
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

  // Compute verified/self counts
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
        <div className="flex items-start justify-between border-b border-sand-line px-6 py-5">
          <div>
            <p className="mb-0.5 text-[11.5px] font-semibold uppercase tracking-widest text-ink-soft">
              Match Explanation
            </p>
            <h2 className="m-0 font-serif text-[18px] leading-snug">{internshipTitle}</h2>
            <p className="mt-0.5 text-[12.5px] text-ink-soft">{company}</p>
          </div>
          <button
            onClick={handleClose}
            className="ml-4 mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand hover:text-ink"
            aria-label="Close drawer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Overall score pill */}
        <div className="flex items-center gap-4 border-b border-sand-line bg-signal-soft/60 px-6 py-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-signal text-white">
            <span className="font-serif text-[20px] font-bold leading-none">{overallMatch}</span>
          </div>
          <div>
            <p className="m-0 text-[13px] font-semibold text-signal">Overall match score</p>
            <p className="mt-0.5 text-[12px] text-[#1E4A34]">
              {verifiedCount} of {matched.length} matched skills are assessment-verified.
            </p>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Section 1: Matched Skills ── */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-signal text-white">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <h3 className="m-0 text-[13.5px] font-semibold">
                Matched Skills <span className="font-normal text-ink-soft">({matched.length})</span>
              </h3>
            </div>
            <div className="space-y-2">
              {matched.map((skill) => (
                <div
                  key={skill.name}
                  className="flex items-center justify-between rounded-[10px] border border-signal-soft bg-signal-soft/40 px-3.5 py-2.5"
                >
                  <span className="text-[13px] font-medium text-signal">{skill.name}</span>
                  <SkillSourceBadge source={skill.source} />
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 2: Missing Skills ── */}
          {missing.length > 0 && (
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-error text-white">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </span>
                <h3 className="m-0 text-[13.5px] font-semibold">
                  Missing Skills <span className="font-normal text-ink-soft">({missing.length})</span>
                </h3>
              </div>
              <div className="space-y-2.5">
                {missing.map((skill) => (
                  <div
                    key={skill.name}
                    className="rounded-[10px] border border-error-soft bg-error-soft/50 px-3.5 py-3"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <SkillTag label={skill.name} state="missing" />
                    </div>
                    <p className="m-0 text-[12px] text-error/80">{skill.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Section 3: Weighted Factor Breakdown ── */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-info text-white">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </span>
              <h3 className="m-0 text-[13.5px] font-semibold">Weighted Factor Breakdown</h3>
            </div>
            <p className="mb-3.5 text-[12px] text-ink-soft">
              Each factor contributes a weighted share to your overall score. Bar = your score for that factor.
            </p>
            <div className="space-y-3.5">
              {factorBreakdown.map((f) => {
                const contribution = weightedScore(f);
                const isStrong = f.score >= 80;
                return (
                  <div key={f.label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[12.5px] font-medium">{f.label}</span>
                      <div className="flex items-center gap-2 text-[11.5px] text-ink-soft">
                        <span className="rounded bg-sand px-1.5 py-0.5 font-mono text-[10.5px]">
                          ×{f.weight}%
                        </span>
                        <span className={`font-semibold ${isStrong ? 'text-signal' : 'text-amber'}`}>
                          {f.score}
                        </span>
                        <span className="text-ink-soft">→</span>
                        <span className="font-semibold text-ink">{contribution} pts</span>
                      </div>
                    </div>
                    <div className="factor-bar-track">
                      <div
                        className="factor-bar-fill"
                        style={{
                          width: `${f.score}%`,
                          backgroundColor: isStrong ? '#2F6F4F' : '#B7791F',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* total */}
            <div className="mt-4 flex items-center justify-between rounded-[10px] bg-sand px-4 py-3">
              <span className="text-[12.5px] font-semibold">Total weighted score</span>
              <span className="font-serif text-[18px] font-bold text-signal">{overallMatch}</span>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="border-t border-sand-line px-6 py-4">
          <p className="mb-2.5 text-[11.5px] text-ink-soft">
            Tip: Verifying skills via assessments boosts your credibility with employers.
          </p>
          <button
            className="btn btn-ghost w-full text-center"
            onClick={handleClose}
          >
            Close explanation
          </button>
        </div>
      </aside>
    </>
  );
}

import type { ReactNode } from 'react';
import type { SkillSource } from '../data/mock';

export function ProgressBar({ value, warn = false }: { value: number; warn?: boolean }) {
  return (
    <div className="progress-track bg-[#FAF6F4] border border-[#E5D5CE]">
      <span
        className="progress-fill"
        style={{
          width: `${value}%`,
          background: warn
            ? 'linear-gradient(90deg, #E6A694, #7A4B43)'
            : 'linear-gradient(90deg, #2D6A4F, #20523C)',
        }}
      />
    </div>
  );
}

export function ScoreRing({ score, label, size = 132 }: { score: number; label: string; size?: number }) {
  const r = (size - 24) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const center = size / 2;
  const isHigh = score >= 80;
  const strokeColor = isHigh ? '#7A4B43' : score >= 60 ? '#2D6A4F' : '#7A6A65';

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="drop-shadow-xs">
        <circle cx={center} cy={center} r={r} fill="none" stroke="#E5D5CE" strokeWidth={10} />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={10}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <b className="font-serif text-[34px] leading-none text-[#2B1B17] tracking-tight">{score}%</b>
        <small className="mt-1 text-xs font-semibold text-[#7A6A65] uppercase tracking-wider">{label}</small>
      </div>
    </div>
  );
}

/** Inline provenance label shown inside a SkillTag or standalone. */
export function SkillSourceBadge({ source }: { source: SkillSource }) {
  if (source === 'verified') {
    return (
      <span className="skill-source-badge skill-source-verified" title="Verified via assessment">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
        Verified
      </span>
    );
  }
  return (
    <span className="skill-source-badge skill-source-self" title="Self-declared by student">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
      Self-Declared
    </span>
  );
}

export function SkillTag({
  label,
  state,
  source,
}: {
  label: string;
  state?: 'have' | 'missing';
  source?: SkillSource;
}) {
  const cls =
    state === 'have'
      ? 'skill-tag skill-tag-have'
      : state === 'missing'
        ? 'skill-tag skill-tag-missing'
        : 'skill-tag';
  return (
    <span className={cls}>
      {label}
      {source && <SkillSourceBadge source={source} />}
    </span>
  );
}

export function Badge({ children, kind }: { children: ReactNode; kind: 'success' | 'warn' | 'error' | 'info' }) {
  return <span className={`badge badge-${kind}`}>{children}</span>;
}

export function WhyBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="why-box">
      <b className="mb-2 flex items-center gap-2 font-semibold text-base text-emerald-950">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        {title}
      </b>
      <div className="text-sm text-[#2B1B17]/90 leading-relaxed">{children}</div>
    </div>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="my-8 flex items-baseline justify-between border-b border-[#E5D5CE] pb-3">
      <h2 className="m-0 text-2xl font-bold font-serif text-[#2B1B17] tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

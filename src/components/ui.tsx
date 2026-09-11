import type { ReactNode } from 'react';
import type { SkillSource } from '../data/mock';

export function ProgressBar({ value, warn = false }: { value: number; warn?: boolean }) {
  return (
    <div className="progress-track">
      <span
        className="progress-fill"
        style={{ width: `${value}%`, backgroundColor: warn ? '#B7791F' : undefined }}
      />
    </div>
  );
}

export function ScoreRing({ score, label, size = 132 }: { score: number; label: string; size?: number }) {
  const r = (size - 24) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const center = size / 2;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={center} cy={center} r={r} fill="none" stroke="#EFE9DD" strokeWidth={12} />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="#2F6F4F"
          strokeWidth={12}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <b className="font-serif text-[30px] leading-none">{score}</b>
        <small className="text-[11px] text-ink-soft">{label}</small>
      </div>
    </div>
  );
}

/** Inline provenance label shown inside a SkillTag or standalone. */
export function SkillSourceBadge({ source }: { source: SkillSource }) {
  if (source === 'verified') {
    return (
      <span className="skill-source-badge skill-source-verified" title="Verified via assessment">
        {/* shield-check */}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
        Verified
      </span>
    );
  }
  return (
    <span className="skill-source-badge skill-source-self" title="Self-declared by student">
      {/* pencil */}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
      <b className="mb-1.5 block text-signal">{title}</b>
      {children}
    </div>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="my-9 flex items-baseline justify-between">
      <h2 className="m-0 text-[21px] font-serif">{title}</h2>
      {action}
    </div>
  );
}


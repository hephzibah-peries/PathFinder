export type TrafficLightLevel = 'high' | 'mid' | 'low';

export interface TrafficLightInfo {
  level: TrafficLightLevel;
  dotColor: string;
  badgeClass: string;
  label: string;
  desc: string;
}

export function getTrafficLightInfo(score: number): TrafficLightInfo {
  if (score >= 80) {
    return {
      level: 'high',
      dotColor: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse',
      badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-900',
      label: 'Highly Qualified to Apply',
      desc: 'Your skills closely match the employer requirements. Recommended to submit your application now.',
    };
  } else if (score >= 50) {
    return {
      level: 'mid',
      dotColor: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
      badgeClass: 'border-amber-300 bg-amber-50 text-amber-900',
      label: 'Almost Ready - Minor Skill Gap',
      desc: 'You match most core requirements. Brush up on 1 key skill to maximize your shortlisting chance.',
    };
  } else {
    return {
      level: 'low',
      dotColor: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
      badgeClass: 'border-rose-300 bg-rose-50 text-rose-900',
      label: 'Training Recommended',
      desc: 'Significant skill gap detected. Review the recommended learning roadmap before applying.',
    };
  }
}

interface TrafficLightBadgeProps {
  score: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export default function TrafficLightBadge({
  score,
  showScore = true,
  size = 'md',
  showSubtitle = false,
}: TrafficLightBadgeProps) {
  const info = getTrafficLightInfo(score);

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-xs md:text-sm px-3.5 py-1.5',
    lg: 'text-sm md:text-base px-4 py-2 font-bold',
  }[size];

  return (
    <div className="inline-flex flex-col gap-1">
      <div
        className={`inline-flex items-center gap-2 rounded-full border font-semibold tracking-wide transition-all ${info.badgeClass} ${sizeClasses}`}
        title={info.desc}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${info.dotColor} shrink-0`} />
        {showScore && (
          <span className="font-serif font-black tracking-tight">{Math.round(score)}%</span>
        )}
        <span className="truncate">{info.label}</span>
      </div>

      {showSubtitle && (
        <span className="text-[11px] text-[#7A6A65] font-medium pl-1">
          {info.desc}
        </span>
      )}
    </div>
  );
}

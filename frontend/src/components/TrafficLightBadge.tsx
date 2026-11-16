import { useLanguage } from '../context/LanguageContext';

export type TrafficLightLevel = 'high' | 'mid' | 'low';

export interface TrafficLightInfo {
  level: TrafficLightLevel;
  dotColor: string;
  badgeClass: string;
  labelEn: string;
  labelTa: string;
  descEn: string;
  descTa: string;
}

export function getTrafficLightInfo(score: number): TrafficLightInfo {
  if (score >= 80) {
    return {
      level: 'high',
      dotColor: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse',
      badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-900',
      labelEn: 'Highly Qualified to Apply',
      labelTa: '100% தயார்! (விண்ணப்பிக்கலாம்)',
      descEn: 'Your skills closely match the employer requirements. Recommended to submit your application now.',
      descTa: 'உங்கள் திறன்கள் இந்த நிறுவனத்தின் தேவைகளுடன் மிகச்சரியாகப் பொருந்துகின்றன.',
    };
  } else if (score >= 50) {
    return {
      level: 'mid',
      dotColor: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
      badgeClass: 'border-amber-300 bg-amber-50 text-amber-900',
      labelEn: 'Almost Ready - Minor Skill Gap',
      labelTa: '1 Skill தேவை (கிட்டத்தட்ட தயார்)',
      descEn: 'You match most core requirements. Brush up on 1 key skill to maximize your shortlisting chance.',
      descTa: 'பெரும்பாலான திறன்கள் உள்ளன. இன்னும் 1 முக்கிய திறனைக் கற்றால் எளிதில் தேர்வாகலாம்.',
    };
  } else {
    return {
      level: 'low',
      dotColor: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
      badgeClass: 'border-rose-300 bg-rose-50 text-rose-900',
      labelEn: 'Training Recommended',
      labelTa: 'கூடுதல் பயிற்சி தேவை',
      descEn: 'Significant skill gap detected. Review the recommended learning roadmap before applying.',
      descTa: 'முக்கிய திறன்களை முதலில் கற்றுத் தேர்ந்த பின் விண்ணப்பிப்பது நல்லது.',
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
  const { lang } = useLanguage();
  const info = getTrafficLightInfo(score);

  const label = lang === 'ta' ? info.labelTa : info.labelEn;
  const subtitle = lang === 'ta' ? info.descTa : info.descEn;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-xs md:text-sm px-3.5 py-1.5',
    lg: 'text-sm md:text-base px-4 py-2 font-bold',
  }[size];

  return (
    <div className="inline-flex flex-col gap-1">
      <div
        className={`inline-flex items-center gap-2 rounded-full border font-semibold tracking-wide transition-all ${info.badgeClass} ${sizeClasses}`}
        title={subtitle}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${info.dotColor} shrink-0`} />
        {showScore && (
          <span className="font-serif font-black tracking-tight">{Math.round(score)}%</span>
        )}
        <span className="truncate">{label}</span>
      </div>

      {showSubtitle && (
        <span className="text-[11px] text-[#7A6A65] font-medium pl-1">
          {subtitle}
        </span>
      )}
    </div>
  );
}

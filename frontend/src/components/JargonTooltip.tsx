import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export interface JargonDefinition {
  term: string;
  category: string;
  simpleTa: string;
  simpleEn: string;
  analogyTa?: string;
  analogyEn?: string;
}

export const JARGON_DICTIONARY: Record<string, JargonDefinition> = {
  'rest api': {
    term: 'REST API',
    category: 'Networking & Web',
    simpleTa: 'இரு வேறு மென்பொருள்கள் இணையம் வழியாக தகவல்களைப் பரிமாறிக் கொள்ளும் எளிய முறை.',
    simpleEn: 'A standardized way for two software systems to communicate and share data over the web.',
    analogyTa: 'உணவகத்தில் பரிமாறுபவர் (Waiter) வாடிக்கையாளருக்கும் சமையலறைக்கும் இடையே உணவுக் கட்டளையைக் கொண்டு சேர்ப்பது போன்றது.',
    analogyEn: 'Like a waiter carrying orders between a customer and the kitchen.',
  },
  'spring boot': {
    term: 'Spring Boot',
    category: 'Backend Framework',
    simpleTa: 'ஜாவா (Java) மொழியில் விரைவாக இணைய செயலிகளின் பின்னணி சேவைகளை (Backend) உருவாக்கும் ஒரு கட்டமைப்பு.',
    simpleEn: 'A popular Java framework used to rapidly build production-grade web backends and microservices.',
    analogyTa: 'வீடு கட்ட தேவையான அனைத்து அடிப்படை உபகரணங்களும் தயார் நிலையில் உள்ள ஆயத்த வீடு போன்றது.',
    analogyEn: 'Like a pre-fabricated building kit with all plumbing and wiring already configured.',
  },
  'react': {
    term: 'React',
    category: 'Frontend UI',
    simpleTa: 'பயனர்கள் பார்க்கும் இணையதளத் திரைகளை (User Interface) எளிதாக உருவாக்க உதவும் ஜாவாஸ்கிரிப்ட் கருவி.',
    simpleEn: 'A modern JavaScript library created by Meta for building interactive, component-based user interfaces.',
    analogyTa: 'லெகோ (Lego) கட்டைகளைப் போல சிறிய சிறிய பாகங்களை இணைத்து பெரிய திரையை உருவாக்குவது.',
    analogyEn: 'Like assembling Lego blocks to construct a responsive, interactive web page.',
  },
  'docker': {
    term: 'Docker',
    category: 'DevOps & Containers',
    simpleTa: 'மென்பொருளை அதன் அனைத்து தேவைகளுடன் ஒரு சிறிய பெட்டியில் (Container) அடைத்து எந்தக் கணினியிலும் இயங்க வைக்கும் கருவி.',
    simpleEn: 'A platform that packages an app and its dependencies together into a standardized container.',
    analogyTa: 'எந்த நாட்டுக் கப்பலிலும் எளிதாக ஏற்றக்கூடிய நிலையான சரக்குப் பெட்டகம் (Shipping Container) போன்றது.',
    analogyEn: 'Like a universal shipping container that fits cleanly onto any ship or truck.',
  },
  'ci/cd': {
    term: 'CI/CD',
    category: 'Automation',
    simpleTa: 'எழுதப்படும் நிரல்களை தானாகவே பரிசோதித்து, பிழைகளை நீக்கி, இணையத்தில் வெளியிடும் தானியங்கி முறை.',
    simpleEn: 'Continuous Integration & Continuous Delivery - automated pipelines that test and deploy code changes.',
    analogyTa: 'தொழிற்சாலையில் பொருட்கள் தானாகவே ஆய்வு செய்யப்பட்டு சிப்பம் கட்டப்படும் அசெம்பிளி லைன் போன்றது.',
    analogyEn: 'Like an automated quality assurance assembly line in a modern factory.',
  },
  'microservices': {
    term: 'Microservices',
    category: 'Architecture',
    simpleTa: 'ஒரு பெரிய மென்பொருளை பல சிறிய, சுயாட்சியான சேவைகளாகப் பிரித்து உருவாக்கும் வடிவமைப்பு முறை.',
    simpleEn: 'An architecture where an application is divided into small, loosely-coupled, independently deployable services.',
    analogyTa: 'ஒரு பல்பொருள் அங்காடியில் ஒவ்வொரு துறைக்கும் (ஆடைகள், உணவு) தனித்தனி பணியாளர்கள் இயங்குவது போல.',
    analogyEn: 'Like specialized independent departments in a hospital rather than a single doctor doing everything.',
  },
  'postgresql': {
    term: 'PostgreSQL',
    category: 'Database',
    simpleTa: 'தகவல்களை அட்டவணைகளாகவும், பாதுகாப்பாகவும் சேமித்து வைக்கும் மிக சக்திவாய்ந்த தகவல்தள மென்பொருள்.',
    simpleEn: 'A powerful, open-source relational database that stores data in structured tables with high reliability.',
    analogyTa: 'அனைத்து முக்கிய ஆவணங்களும் நேர்த்தியாக அடுக்கப்பட்ட அதிநவீன மின்னணு கோப்பு அலமாரி.',
    analogyEn: 'Like a rock-solid digital bank vault organizing spreadsheets and relational records.',
  },
  'jwt': {
    term: 'JWT (JSON Web Token)',
    category: 'Security & Auth',
    simpleTa: 'உள்நுழைந்த பயனரின் அடையாளத்தை உறுதி செய்யும் குறியாக்கப்பட்ட டிஜிட்டல் பாஸ் அல்லது அனுமதி அட்டை.',
    simpleEn: 'A secure, compact digital token that proves your authenticated identity between client and server.',
    analogyTa: 'திரையரங்குக்குள் செல்லும்போது கையில் கட்டப்படும் டிஜிட்டல் அனுமதி வளையம் போன்றது.',
    analogyEn: 'Like an encrypted digital wristband granted after showing your ticket at a concert.',
  },
  'kubernetes': {
    term: 'Kubernetes (K8s)',
    category: 'DevOps & Scaling',
    simpleTa: 'ஆயிரக்கணக்கான டாக்கர் கொள்கலன்களைத் தானாகவே இயக்கி, கண்காணித்து, சீரமைக்கும் கப்பல் தலைவர் போன்ற கருவி.',
    simpleEn: 'An open-source container orchestration system for automating application deployment, scaling, and management.',
    analogyTa: 'விமான நிலையத்தில் விமானங்களின் வருகை மற்றும் புறப்பாட்டை வழிநடத்தும் விமானப் போக்குவரத்துக் கட்டுப்பாட்டாளர்.',
    analogyEn: 'Like an air traffic controller directing and auto-balancing hundreds of planes.',
  },
  'nlp': {
    term: 'NLP (Natural Language Processing)',
    category: 'Artificial Intelligence',
    simpleTa: 'மனிதர்கள் பேசும் அல்லது எழுதும் மொழியை கணினிகள் படித்துப் புரிந்து கொள்ள உதவும் செயற்கை நுண்ணறிவு தொழில்நுட்பம்.',
    simpleEn: 'Natural Language Processing - AI algorithms that enable software to read, parse, and comprehend human text.',
    analogyTa: 'ரெஸ்யூமில் உள்ள வரிகளைப் படித்து, எவை தொழில்நுட்பத் திறன்கள் என்று தானாகவே அடிக்கோடிடும் ஆசிரியர்.',
    analogyEn: 'Like an intelligent recruiter scanning your paper resume and highlighting skills automatically.',
  },
  'git': {
    term: 'Git / GitHub',
    category: 'Version Control',
    simpleTa: 'நிரல் குறியீட்டில் செய்யப்படும் ஒவ்வொரு மாற்றத்தையும் பதிவு செய்து குழுவாக இணைந்து பணியாற்ற உதவும் தளம்.',
    simpleEn: 'A distributed version control system to track code history and collaborate with engineering teams.',
    analogyTa: 'ஆவணத்தின் ஒவ்வொரு முந்தைய நகலையும் மீட்டெடுக்க உதவும் கால இயந்திரம் (Time Machine) போன்றது.',
    analogyEn: 'Like infinite undo history and collaborative Google Docs for source code.',
  },
  'redis': {
    term: 'Redis',
    category: 'Caching & Store',
    simpleTa: 'அடிக்கடி தேவைப்படும் தரவுகளைக் கணினியின் விரைவு நினைவகத்தில் (RAM) சேமித்து நொடிப்பொழுதில் வழங்கும் அதிவேக சேமிப்பு.',
    simpleEn: 'An ultra-fast in-memory data store used as a cache to deliver data in sub-millisecond response times.',
    analogyTa: 'மேஜை டிராயருக்குள் கைக்கு எட்டும் தூரத்தில் வைத்திருக்கும் முக்கிய குறிப்பேடு போன்றது.',
    analogyEn: 'Like keeping your most urgent notes on your desk instead of walking to the storage basement.',
  },
};

export interface JargonTooltipProps {
  term: string;
  children?: React.ReactNode;
  inline?: boolean;
}

export function JargonTooltip({ term, children, inline = true }: JargonTooltipProps) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Normalize lookup key
  const normalizedKey = term.trim().toLowerCase();
  const definition = JARGON_DICTIONARY[normalizedKey] || {
    term,
    category: 'Technical Term',
    simpleTa: `${term} என்பது மென்பொருள் துறையில் பயன்படும் ஒரு முக்கிய தொழில்நுட்பத் திறன்.`,
    simpleEn: `${term} is a core technology component used in software engineering.`,
  };

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <span
      ref={containerRef}
      className={`relative ${inline ? 'inline-flex' : 'block'} items-baseline`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="inline-flex items-center gap-1 cursor-help border-b-2 border-dotted border-[#C8A84B] text-inherit font-inherit hover:border-[#7A4B43] transition-colors focus:outline-none"
        aria-label={`Definition for ${term}`}
        aria-expanded={open}
      >
        {children || term}
        <span className="text-[10px] text-[#C8A84B] font-bold select-none opacity-80">?</span>
      </button>

      {/* Popover Bubble */}
      {open && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 rounded-2xl bg-[#2B1B17] text-[#FAF6F4] p-4 text-xs shadow-2xl border border-[#C8A84B]/40 animate-in fade-in zoom-in-95 duration-150 select-text"
        >
          {/* Header pill */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <span className="font-serif font-bold text-sm text-[#FDF2ED]">
              {definition.term}
            </span>
            <span className="rounded-full bg-[#C8A84B]/20 px-2 py-0.5 text-[10px] font-bold text-[#C8A84B]">
              {definition.category}
            </span>
          </div>

          {/* Simple Explanation based on selected language */}
          <div className="space-y-2">
            {lang === 'ta' ? (
              <>
                <p className="font-sans font-medium text-[#FDF2ED] leading-relaxed">
                  {definition.simpleTa}
                </p>
                {definition.analogyTa && (
                  <div className="rounded-lg bg-white/10 p-2 text-[11px] text-[#C8A84B] border-l-2 border-[#C8A84B]">
                    <strong>உதாரணம்:</strong> {definition.analogyTa}
                  </div>
                )}
                <div className="text-[10px] text-[#FAF6F4]/60 pt-1 border-t border-white/10">
                  <span className="font-semibold text-white/80">English:</span> {definition.simpleEn}
                </div>
              </>
            ) : (
              <>
                <p className="font-sans font-medium text-[#FDF2ED] leading-relaxed">
                  {definition.simpleEn}
                </p>
                {definition.analogyEn && (
                  <div className="rounded-lg bg-white/10 p-2 text-[11px] text-[#C8A84B] border-l-2 border-[#C8A84B]">
                    <strong>Analogy:</strong> {definition.analogyEn}
                  </div>
                )}
                <div className="text-[10px] text-[#FAF6F4]/60 pt-1 border-t border-white/10">
                  <span className="font-semibold text-white/80">தமிழ் விளக்கம்:</span> {definition.simpleTa}
                </div>
              </>
            )}
          </div>

          {/* Tooltip downward caret arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#2B1B17]" />
        </div>
      )}
    </span>
  );
}

export default JargonTooltip;

import React, { useState, useRef, useEffect } from 'react';

export interface JargonDefinition {
  term: string;
  category: string;
  simpleEn: string;
  analogyEn?: string;
}

export const JARGON_DICTIONARY: Record<string, JargonDefinition> = {
  'rest api': {
    term: 'REST API',
    category: 'Networking & Web',
    simpleEn: 'A standardized way for two software systems to communicate and share data over the web.',
    analogyEn: 'Like a waiter carrying orders between a customer and the kitchen.',
  },
  'spring boot': {
    term: 'Spring Boot',
    category: 'Backend Framework',
    simpleEn: 'A popular Java framework used to rapidly build production-grade web backends and microservices.',
    analogyEn: 'Like a pre-fabricated building kit with all plumbing and wiring already configured.',
  },
  'react': {
    term: 'React',
    category: 'Frontend UI',
    simpleEn: 'A modern JavaScript library created by Meta for building interactive, component-based user interfaces.',
    analogyEn: 'Like assembling Lego blocks to construct a responsive, interactive web page.',
  },
  'docker': {
    term: 'Docker',
    category: 'DevOps & Containers',
    simpleEn: 'A platform that packages an app and its dependencies together into a standardized container.',
    analogyEn: 'Like a universal shipping container that fits cleanly onto any ship or truck.',
  },
  'ci/cd': {
    term: 'CI/CD',
    category: 'Automation',
    simpleEn: 'Continuous Integration & Continuous Delivery - automated pipelines that test and deploy code changes.',
    analogyEn: 'Like an automated quality assurance assembly line in a modern factory.',
  },
  'microservices': {
    term: 'Microservices',
    category: 'Architecture',
    simpleEn: 'An architecture where an application is divided into small, loosely-coupled, independently deployable services.',
    analogyEn: 'Like specialized independent departments in a hospital rather than a single doctor doing everything.',
  },
  'postgresql': {
    term: 'PostgreSQL',
    category: 'Database',
    simpleEn: 'A powerful, open-source relational database that stores data in structured tables with high reliability.',
    analogyEn: 'Like a rock-solid digital bank vault organizing spreadsheets and relational records.',
  },
  'jwt': {
    term: 'JWT (JSON Web Token)',
    category: 'Security & Auth',
    simpleEn: 'A secure, compact digital token that proves your authenticated identity between client and server.',
    analogyEn: 'Like an encrypted digital wristband granted after showing your ticket at a concert.',
  },
  'kubernetes': {
    term: 'Kubernetes (K8s)',
    category: 'DevOps & Scaling',
    simpleEn: 'An open-source container orchestration system for automating application deployment, scaling, and management.',
    analogyEn: 'Like an air traffic controller directing and auto-balancing hundreds of planes.',
  },
  'nlp': {
    term: 'NLP (Natural Language Processing)',
    category: 'Artificial Intelligence',
    simpleEn: 'Natural Language Processing - AI algorithms that enable software to read, parse, and comprehend human text.',
    analogyEn: 'Like an intelligent recruiter scanning your paper resume and highlighting skills automatically.',
  },
  'git': {
    term: 'Git / GitHub',
    category: 'Version Control',
    simpleEn: 'A distributed version control system to track code history and collaborate with engineering teams.',
    analogyEn: 'Like infinite undo history and collaborative Google Docs for source code.',
  },
  'redis': {
    term: 'Redis',
    category: 'Caching & Store',
    simpleEn: 'An ultra-fast in-memory data store used as a cache to deliver data in sub-millisecond response times.',
    analogyEn: 'Like keeping your most urgent notes on your desk instead of walking to the storage basement.',
  },
};

export interface JargonTooltipProps {
  term: string;
  children?: React.ReactNode;
  inline?: boolean;
}

export function JargonTooltip({ term, children, inline = true }: JargonTooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const normalizedKey = term.trim().toLowerCase();
  const definition = JARGON_DICTIONARY[normalizedKey] || {
    term,
    category: 'Technical Term',
    simpleEn: `${term} is a core technology component used in software engineering.`,
  };

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

      {open && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 rounded-2xl bg-[#2B1B17] text-[#FAF6F4] p-4 text-xs shadow-2xl border border-[#C8A84B]/40 animate-in fade-in zoom-in-95 duration-150 select-text"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <span className="font-serif font-bold text-sm text-[#FDF2ED]">
              {definition.term}
            </span>
            <span className="rounded-full bg-[#C8A84B]/20 px-2 py-0.5 text-[10px] font-bold text-[#C8A84B]">
              {definition.category}
            </span>
          </div>

          <div className="space-y-2">
            <p className="font-sans font-medium text-[#FDF2ED] leading-relaxed">
              {definition.simpleEn}
            </p>
            {definition.analogyEn && (
              <div className="rounded-lg bg-white/10 p-2 text-[11px] text-[#C8A84B] border-l-2 border-[#C8A84B]">
                <strong>Analogy:</strong> {definition.analogyEn}
              </div>
            )}
          </div>

          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#2B1B17]" />
        </div>
      )}
    </span>
  );
}

export default JargonTooltip;

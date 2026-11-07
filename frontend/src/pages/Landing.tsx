import { Link } from 'react-router-dom';

const features = [
  {
    title: 'AI Internship Matchmaking',
    body: 'Evaluates your verified skills, coursework, and technical projects against live industry requirements using semantic similarity.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    title: 'NLP CV Skill Extraction',
    body: 'Upload any PDF or DOCX resume. Our Apache Tika NLP engine extracts hard and soft skills into your verified profile in seconds.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    title: 'Skill Gap Diagnostic',
    body: 'Pinpoint exactly which technical proficiencies stand between you and your target software engineering or corporate role.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    title: 'Career Readiness Index',
    body: 'A single, calibrated readiness metric synthesised from your coursework, project portfolio, and verified GitHub & CV skills.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    title: 'Explainable AI Match Breakdown',
    body: 'Transparent breakdown drawers explain exactly why an internship matched your profile, including weighted factor analytics.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    title: 'Personalized Career Roadmap',
    body: 'Structured, milestone-based learning steps to guide you from foundational knowledge directly to interview-ready status.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    ),
  },
];

const stats = [
  { value: '5,000+', label: 'Active Students' },
  { value: '500+', label: 'Verified Internships' },
  { value: '200+', label: 'Partner Companies' },
  { value: '94%', label: 'Placement Fit Rate' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#FAF6F4] text-[#2B1B17] overflow-x-hidden selection:bg-[#E6A694]/30 selection:text-[#7A4B43]">
      {/* ── Background Subtle Glow ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#E6A694]/20 blur-[130px] rounded-full" />
        <div className="absolute top-[40%] -left-[10%] w-[450px] h-[450px] bg-[#7A4B43]/10 blur-[120px] rounded-full" />
      </div>

      {/* ── Navigation Header ── */}
      <header className="relative z-20 border-b border-[#E5D5CE] bg-[#FAF6F4]/90 backdrop-blur-md sticky top-0 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7A4B43] text-white shadow-sm group-hover:scale-105 transition-transform">
              <span className="font-serif font-black text-white text-2xl">P</span>
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#2B1B17]">
              Path<span className="text-[#7A4B43]">Finder</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold uppercase tracking-wider text-[#7A6A65]">
            <a href="#features" className="hover:text-[#7A4B43] transition-colors">Features</a>
            <a href="#stats" className="hover:text-[#7A4B43] transition-colors">Platform Stats</a>
            <a href="#how-it-works" className="hover:text-[#7A4B43] transition-colors">How It Works</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="btn btn-ghost px-5 py-2.5 text-sm font-semibold">Log In</Link>
            <Link to="/register" className="btn btn-primary px-6 py-2.5 text-sm font-semibold">Get Started Free</Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative z-10 mx-auto max-w-7xl px-8 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E5D5CE] bg-[#FDF2ED] px-4 py-1.5 text-xs font-bold text-[#7A4B43] shadow-xs mb-6 uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-[#E6A694] animate-ping" />
              <span>Next-Generation Career Intelligence</span>
            </div>

            <h1 className="font-serif text-5xl sm:text-6xl lg:text-[68px] font-bold tracking-tight leading-[1.08] text-[#2B1B17] mb-6">
              Find the right internship. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7A4B43] via-[#6B3E36] to-[#E6A694]">
                Bridge every skill gap.
              </span>
            </h1>

            <p className="text-xl text-[#7A6A65] max-w-xl leading-relaxed mb-8">
              PathFinder scans your resume, predicts company match percentages with Apache Tika NLP, and generates actionable learning roadmaps to land your dream role.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link to="/register" className="btn btn-primary px-8 py-3.5 text-base font-semibold">
                Get Started as a Student
              </Link>
              <Link to="/student/internships" className="btn btn-secondary px-7 py-3.5 text-base font-semibold">
                Browse Live Openings
              </Link>
            </div>

            {/* Quick trust strip */}
            <div className="mt-10 flex items-center gap-6 text-sm text-[#7A6A65] font-medium">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#2D6A4F]">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Zero keywords guesswork</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#2D6A4F]">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Google OAuth2 enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#2D6A4F]">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>PostgreSQL synced</span>
              </div>
            </div>
          </div>

          {/* Hero Interactive Card Preview */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-[#E5D5CE] bg-white p-7 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5D5CE] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-3 w-3 rounded-full bg-[#E6A694]" />
                  <div className="h-3 w-3 rounded-full bg-[#7A4B43]" />
                  <div className="h-3 w-3 rounded-full bg-[#2D6A4F]" />
                </div>
                <span className="badge badge-peach font-bold">AI Recommended Match</span>
              </div>

              {/* Sample Card */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#2B1B17]">Full-Stack Cloud Engineer</h3>
                    <p className="text-sm text-[#7A6A65] mt-1 font-semibold">Apex Innovations • Remote</p>
                  </div>
                  <div className="rounded-2xl border border-[#E5D5CE] bg-[#FDF2ED] px-3.5 py-2 text-center">
                    <div className="font-serif text-xl font-bold text-[#7A4B43] leading-none">94%</div>
                    <div className="text-[10px] uppercase font-bold text-[#7A6A65]">Fit score</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E5D5CE] bg-[#FAF6F4] p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#2B1B17]">Skill Alignment:</span>
                    <span className="font-bold text-[#2D6A4F]">5 / 6 Matched</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="skill-tag skill-tag-have text-sm font-semibold">Spring Boot</span>
                    <span className="skill-tag skill-tag-have text-sm font-semibold">React</span>
                    <span className="skill-tag skill-tag-have text-sm font-semibold">PostgreSQL</span>
                    <span className="skill-tag skill-tag-missing text-sm font-semibold">Docker</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm text-[#7A6A65]">
                    Stipend: <span className="font-semibold text-[#2B1B17]">$1,200/mo</span>
                  </div>
                  <span className="btn btn-primary py-2.5 px-4 text-sm font-semibold">
                    View AI Breakdown
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Metrics Strip ── */}
      <section id="stats" className="relative z-10 border-y border-[#E5D5CE] bg-white">
        <div className="mx-auto max-w-7xl px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, idx) => (
              <div key={idx} className="text-center md:border-r border-[#E5D5CE] last:border-none">
                <div className="font-serif text-5xl lg:text-6xl font-bold text-[#2B1B17] tracking-tight">
                  <span className="text-[#7A4B43]">
                    {s.value}
                  </span>
                </div>
                <div className="mt-2 text-sm font-bold uppercase tracking-wider text-[#7A6A65]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-8 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#2B1B17] mb-4">
            Engineered for High-Velocity Placements
          </h2>
          <p className="text-[#7A6A65] text-base sm:text-lg">
            PathFinder brings enterprise-grade analytics to your internship search, replacing guesswork with precision skills matching.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="card group hover:border-[#D6C1B8] hover:-translate-y-1 transition-all">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#FDF2ED] border border-[#E5D5CE] text-[#7A4B43] group-hover:scale-110 transition-all mb-5">
                {f.icon}
              </div>
              <h3 className="font-serif text-xl font-bold text-[#2B1B17] mb-2">{f.title}</h3>
              <p className="text-sm text-[#7A6A65] leading-relaxed font-medium">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="relative z-10 mx-auto max-w-7xl px-8 pb-24">
        <div className="rounded-3xl border border-[#6B3E36] bg-gradient-to-r from-[#7A4B43] via-[#6B3E36] to-[#5E342D] p-10 sm:p-14 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
              Ready to accelerate your career?
            </h2>
            <p className="text-[#FDF2ED]/90 text-base max-w-lg">
              Join thousands of students and leading tech employers connecting on PathFinder today.
            </p>
          </div>
          <div className="flex gap-4 shrink-0">
            <Link to="/register" className="btn bg-[#E6A694] text-white hover:bg-[#CD8C7A] shadow-md px-8 py-3.5 text-base font-bold">
              Create Student Account
            </Link>
            <Link to="/login" className="btn border-2 border-white/40 text-white hover:bg-white/10 px-7 py-3.5 text-base font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-[#E5D5CE] bg-white px-8 py-8 text-center text-sm text-[#7A6A65]">
        <p>© 2026 PathFinder Platform. All rights reserved. Built with Spring Boot, PostgreSQL, and React.</p>
      </footer>
    </div>
  );
}

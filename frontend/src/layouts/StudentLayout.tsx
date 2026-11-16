import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import GuidedTour from '../components/GuidedTour';

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const [tourOpen, setTourOpen] = useState(false);

  const navItems = [
    {
      to: '/student',
      label: lang === 'ta' ? 'முகப்பு பலகை' : 'Dashboard',
      end: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      to: '/student/profile',
      label: lang === 'ta' ? 'எனது சுயவிவரம்' : 'My Profile',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      to: '/student/internships',
      label: lang === 'ta' ? 'பயிற்சி வாய்ப்புகள்' : 'Explore Internships',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      to: '/student/applications',
      label: lang === 'ta' ? 'எனது விண்ணப்பங்கள்' : 'My Applications',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
      ),
    },
    {
      to: '/student/skills',
      label: lang === 'ta' ? 'தயார்நிலை அறிக்கை' : 'Skill Gap & Readiness',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      to: '/student/mock-interview',
      label: lang === 'ta' ? 'AI நேர்காணல்' : 'AI Mock Interview',
      tourAttr: 'tour-mock-interview',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      ),
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Student';
  const displayRole = user?.role ? user.role.replace('ROLE_', '') : 'STUDENT';
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email ? user.email.slice(0, 2).toUpperCase() : 'ST');

  return (
    <div className="flex min-h-screen bg-[#FAF6F4] text-[#2B1B17]">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <Link to="/" className="sidebar-brand group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7A4B43] text-white shadow-sm group-hover:scale-105 transition-transform">
            <span className="font-serif font-black text-white text-2xl">P</span>
          </div>
          <div className="leading-tight">
            <span className="font-serif text-xl font-bold tracking-tight text-[#2B1B17]">
              Path<span className="text-[#7A4B43]">Finder</span>
            </span>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#7A6A65]">Student Portal</span>
          </div>
        </Link>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">
            {lang === 'ta' ? 'வழிசெலுத்தல்' : 'Navigation'}
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-tour={item.tourAttr}
              className={({ isActive }) =>
                `sidebar-item group ${isActive ? 'sidebar-item-active' : ''}`
              }
            >
              <span className="transition-transform group-hover:scale-110">{item.icon}</span>
              <span className="text-[15px] font-semibold">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E5D5CE] text-sm font-bold text-[#7A4B43] shadow-xs">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-[#2B1B17]">{displayName}</div>
                <div className="truncate text-xs text-[#7A6A65]">{user?.email || displayRole}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title={lang === 'ta' ? 'வெளியேறு' : 'Sign out'}
              className="rounded-lg p-2 text-[#7A6A65] hover:bg-[#F2E8E4] hover:text-rose-600 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content wrapper ── */}
      <div className="ml-[270px] flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E5D5CE] bg-[#FAF6F4]/90 px-8 py-4 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[#2D6A4F] animate-pulse" />
              <span className="text-sm font-medium text-[#7A6A65]">
                {lang === 'ta' ? 'PathFinder AI இயந்திரம் இயங்குகிறது' : 'PathFinder AI Engine Online'}
              </span>
            </div>

            {/* Guided Tour Launcher */}
            <button
              type="button"
              onClick={() => setTourOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#C8A84B] bg-[#FDF2ED] px-3 py-1 text-xs font-bold text-[#7A4B43] hover:bg-[#F9DDD4] transition-all shadow-2xs"
              title={lang === 'ta' ? 'வழிகாட்டி சுற்றுலாவைத் தொடங்கவும்' : 'Launch guided walkthrough tour'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#C8A84B]">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              <span>{lang === 'ta' ? 'வழிகாட்டி' : 'Tour Guide'}</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher (EN | தமிழ்) */}
            <div className="flex items-center rounded-xl bg-[#FDF2ED] p-1 border border-[#E5D5CE] shadow-2xs">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  lang === 'en'
                    ? 'bg-[#7A4B43] text-white shadow-xs'
                    : 'text-[#7A6A65] hover:text-[#2B1B17]'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('ta')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  lang === 'ta'
                    ? 'bg-[#7A4B43] text-white shadow-xs'
                    : 'text-[#7A6A65] hover:text-[#2B1B17]'
                }`}
                title="தமிழுக்கு மாற்றவும்"
              >
                தமிழ்
              </button>
            </div>

            {/* Quick Action: AI Mock Interview (Step 3 Tour target) */}
            <Link
              to="/student/mock-interview"
              data-tour="tour-mock-interview"
              className="btn btn-secondary py-2 px-3.5 text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
              {lang === 'ta' ? 'AI நேர்காணல்' : 'AI Mock Interview'}
            </Link>

            {/* Quick Action: Upload CV (Step 1 Tour target) */}
            <Link
              to="/student/cv-review"
              data-tour="tour-cv-upload"
              className="btn btn-primary py-2 px-4 text-xs md:text-sm flex items-center gap-2"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              {lang === 'ta' ? 'CV-ஐ பதிவேற்றவும்' : 'Upload & Analyze CV'}
            </Link>

            <div className="h-5 w-px bg-[#E5D5CE]" />

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FDF2ED] border border-[#E5D5CE] text-sm font-bold text-[#7A4B43]">
                {initials}
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-[#7A6A65] hover:text-[#2B1B17] font-semibold transition-colors"
              >
                {lang === 'ta' ? 'வெளியேறு' : 'Sign out'}
              </button>
            </div>
          </div>
        </header>

        {/* Guided Tour Overlay */}
        <GuidedTour forceOpen={tourOpen} onClose={() => setTourOpen(false)} />

        {/* Page body */}
        <main className="flex-1 mx-auto w-full max-w-[1240px] px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

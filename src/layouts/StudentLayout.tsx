import { NavLink, Outlet, Link } from 'react-router-dom';
import { studentProfile } from '../data/mock';

const navItems = [
  {
    to: '/student',
    label: 'Dashboard',
    end: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: '/student/profile',
    label: 'My Profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    to: '/student/internships',
    label: 'Explore Internships',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    to: '/student/applications',
    label: 'My Applications',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
  {
    to: '/student/skills',
    label: 'Skill Gap & Readiness',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

export default function StudentLayout() {
  return (
    <div className="flex min-h-screen bg-paper">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <Link to="/" className="sidebar-brand">
          <img src="/logo.svg" alt="SkillBridgePlatform Logo" className="h-9 w-9" />
          <span className="font-serif text-[16px] leading-tight">SkillBridge<span className="text-signal">Platform</span></span>
        </Link>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="flex items-center gap-3">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-signal-soft text-[12px] font-bold text-signal">
              {studentProfile.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{studentProfile.name}</div>
              <div className="truncate text-[11px] text-ink-soft">{studentProfile.university}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="ml-[240px] flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-sand-line bg-paper-raised/80 px-8 py-3.5 backdrop-blur-md">
          <div />
          <div className="flex items-center gap-4">
            <Link to="/student/cv-review" className="btn btn-ghost py-2 text-[12px]">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Upload CV
              </span>
            </Link>
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-sand text-[12px] font-semibold">
              {studentProfile.avatar}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-[1100px] px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

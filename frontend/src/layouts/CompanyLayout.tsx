import { NavLink, Outlet, Link } from 'react-router-dom';
import { companyProfile } from '../data/mock';

const navItems = [
  {
    to: '/company',
    label: 'Dashboard Overview',
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
    to: '/company/profile',
    label: 'Company Profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M5 21V7l8-4v18" />
        <path d="M19 21V11l-6-4" />
        <line x1="9" y1="9" x2="9" y2="9.01" />
        <line x1="9" y1="13" x2="9" y2="13.01" />
        <line x1="9" y1="17" x2="9" y2="17.01" />
      </svg>
    ),
  },
  {
    to: '/company/internships',
    label: 'Manage Internships',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
  {
    to: '/company/applicants',
    label: 'Applicants & Shortlists',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function CompanyLayout() {
  return (
    <div className="flex min-h-screen bg-paper">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <Link to="/" className="sidebar-brand">
          <img src="/logo.svg" alt="SkillBridgePlatform Logo" className="h-9 w-9" />
          <div className="leading-tight">
            <span className="font-serif text-[16px]">SkillBridge<span className="text-signal">Platform</span></span>
            <div className="text-[10.5px] font-medium text-ink-soft">for companies</div>
          </div>
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
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">
              {companyProfile.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{companyProfile.name}</div>
              <div className="truncate text-[11px] text-ink-soft">{companyProfile.industry}</div>
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
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">
              {companyProfile.avatar}
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

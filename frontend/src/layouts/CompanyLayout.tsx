import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  {
    to: '/company',
    label: 'Dashboard Overview',
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
    to: '/company/profile',
    label: 'Company Profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
  {
    to: '/company/applicants',
    label: 'Applicants & Shortlists',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function CompanyLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Company';
  const displayRole = user?.role ? user.role.replace('ROLE_', '') : 'COMPANY';
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email ? user.email.slice(0, 2).toUpperCase() : 'CO');

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
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#7A6A65]">Corporate Portal</span>
          </div>
        </Link>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
              title="Sign out"
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
          <div className="flex items-center gap-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#2D6A4F] animate-pulse" />
            <span className="text-sm font-medium text-[#7A6A65]">Employer Recruitment Engine</span>
          </div>

          <div className="flex items-center gap-5">
            <Link to="/company/internships" className="btn btn-primary py-2.5 px-5 text-sm">
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Post New Internship
              </span>
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
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 mx-auto w-full max-w-[1240px] px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

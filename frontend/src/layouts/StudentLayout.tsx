import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentApi } from '../services/api';
import NotificationBell from '../components/NotificationBell';

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    studentApi.getProfile()
      .then((p) => {
        if (isMounted && p?.profilePicture) {
          setProfilePicture(p.profilePicture);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const navItems = [
    {
      to: '/student/profile',
      label: 'My Profile',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      to: '/student/internships',
      label: 'Explore Internships',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      to: '/student/applications',
      label: 'My Applications',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
      ),
    },
    {
      to: '/student/skills',
      label: 'Skill Gap & Readiness',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      to: '/student/mock-interview',
      label: 'AI Mock Interview',
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
          </div>
        </Link>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-item group ${isActive ? 'sidebar-item-active' : ''}`
              }
            >
              <span className="transition-transform group-hover:scale-110">{item.icon}</span>
              <span className="text-[15px] font-semibold">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer space-y-3">
          <div className="flex items-center gap-3 min-w-0">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt={displayName}
                className="h-10 w-10 shrink-0 rounded-xl object-cover border border-[#E5D5CE] shadow-xs"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E5D5CE] text-sm font-bold text-[#7A4B43] shadow-xs">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-[#2B1B17]">{displayName}</div>
              {user?.email ? (
                <div className="truncate text-xs text-[#7A6A65]">{user.email}</div>
              ) : null}
              <div className="mt-1">
                <span className="inline-flex items-center rounded-md bg-[#FAF6F4] border border-[#E5D5CE] px-2 py-0.5 text-[11px] font-bold text-[#7A4B43]">
                  STUDENT PORTAL
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#E5D5CE] bg-white px-3 py-2 text-xs font-bold text-[#7A6A65] hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition-colors shadow-2xs"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content wrapper ── */}
      <div className="ml-[270px] flex-1 flex flex-col min-h-screen">
        {/* Sticky top bar with Notification Bell */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E5D5CE] bg-[#FAF6F4]/90 backdrop-blur-md px-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A4B43]">PathFinder Student Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
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

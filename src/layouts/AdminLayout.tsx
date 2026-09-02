import { NavLink, Outlet, Link } from 'react-router-dom';

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/students', label: 'Students' },
  { to: '/admin/companies', label: 'Companies' },
  { to: '/admin/internships', label: 'Internships' },
  { to: '/admin/analytics', label: 'Analytics' },
];

export default function AdminLayout() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-sand-line bg-paper-raised px-8 py-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <img src="/logo.svg" alt="SkillBridgePlatform Logo" className="w-10 h-10" />
          <div className="font-serif text-[18px]">
            SkillBridgePlatform <span className="font-sans text-xs text-ink-soft">admin</span>
          </div>
        </Link>
        <div className="flex gap-[22px] text-sm text-ink-soft">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => (isActive ? 'font-semibold text-ink' : '')}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-white">
          AD
        </div>
      </div>
      <div className="mx-auto max-w-[1180px] px-8 py-8">
        <Outlet />
      </div>
    </div>
  );
}

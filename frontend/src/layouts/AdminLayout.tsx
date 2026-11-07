import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/students', label: 'Students' },
  { to: '/admin/companies', label: 'Companies' },
  { to: '/admin/internships', label: 'Internships' },
  { to: '/admin/analytics', label: 'Analytics' },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FAF6F4] text-[#2B1B17]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E5D5CE] bg-[#FAF6F4]/95 px-8 py-4 backdrop-blur-md shadow-xs">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7A4B43] text-white shadow-sm">
            <span className="font-serif font-black text-white text-xl">P</span>
          </div>
          <div className="font-serif text-xl font-bold text-[#2B1B17]">
            PathFinder <span className="ml-1.5 rounded-full border border-[#E5D5CE] bg-[#FDF2ED] px-2.5 py-0.5 font-sans text-xs font-bold uppercase tracking-wider text-[#7A4B43]">Admin</span>
          </div>
        </Link>

        <div className="flex gap-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#7A4B43] text-white shadow-md font-bold'
                    : 'text-[#7A6A65] hover:bg-[#F2E8E4] hover:text-[#2B1B17]'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FDF2ED] border border-[#E5D5CE] text-sm font-bold text-[#7A4B43]">
            AD
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-[#7A6A65] hover:text-rose-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

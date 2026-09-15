import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <img 
              src="/logo.svg" 
              alt="SkillBridgePlatform Logo"
              className="w-10 h-10"
            />
            <span className="text-xl font-bold text-blue-600">SkillBridgePlatform</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition">Home</Link>
            <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Login
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

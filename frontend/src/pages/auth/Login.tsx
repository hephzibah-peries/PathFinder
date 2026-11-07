import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await login({ email, password });
      const role = response.role?.toUpperCase() || 'STUDENT';
      if (role === 'COMPANY') {
        navigate('/company');
      } else if (role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#FAF6F4] text-[#2B1B17] p-6 selection:bg-[#E6A694]/30 selection:text-[#7A4B43]">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#E6A694]/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-[440px] rounded-3xl border border-[#E5D5CE] bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-3 mb-4 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7A4B43] text-white shadow-sm group-hover:scale-105 transition-transform">
              <span className="font-serif font-black text-white text-2xl">P</span>
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#2B1B17]">
              Path<span className="text-[#7A4B43]">Finder</span>
            </span>
          </Link>
          <h1 className="font-serif text-3xl font-bold text-[#2B1B17]">Welcome Back</h1>
          <p className="mt-1 text-sm text-[#7A6A65]">Sign in to your PathFinder account</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input text-sm"
              placeholder="you@university.edu"
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input text-sm"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between text-sm text-[#7A6A65]">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input type="checkbox" className="rounded bg-white border-[#E5D5CE] text-[#7A4B43] focus:ring-[#7A4B43]/20" />
              <span>Remember me</span>
            </label>
            <span className="font-semibold text-[#7A4B43] hover:text-[#5E342D] cursor-pointer">
              Forgot password?
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 text-sm font-semibold"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#E5D5CE]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#7A6A65]">or continue with</span>
          <div className="h-px flex-1 bg-[#E5D5CE]" />
        </div>

        <a
          href="/oauth2/authorization/google"
          className="btn btn-secondary flex w-full items-center justify-center gap-2.5 py-3 text-sm font-semibold"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google Single Sign-On
        </a>

        <p className="mt-6 text-center text-sm text-[#7A6A65]">
          Don&apos;t have an account yet?{' '}
          <Link to="/register" className="font-bold text-[#7A4B43] hover:text-[#5E342D]">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '../../components/auth/GoogleLogin';
import { healthApi, DbStatusResponse } from '../../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<DbStatusResponse>({
    status: 'LOADING',
    database: 'Checking database...',
    type: 'LOADING',
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errParam = params.get('error');
    if (errParam) {
      setError(decodeURIComponent(errParam));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function checkDb() {
      try {
        const res = await healthApi.getDbStatus();
        if (isMounted) {
          setDbStatus(res);
        }
      } catch {
        if (isMounted) {
          setDbStatus({
            status: 'DISCONNECTED',
            database: 'Backend Offline',
            type: 'OFFLINE',
          });
        }
      }
    }
    checkDb();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleGoogleSuccess = async (credential: string) => {
    setError(null);
    setLoading(true);

    try {
      console.log('[PathFinder Auth] Received Google credential token, submitting to /api/auth/google...');
      const response = await loginWithGoogle(credential);
      console.log('[PathFinder Auth] Google login successful. Authenticated as:', response.email, response.role);

      // Verify persistence in local storage
      const token = localStorage.getItem('pathfinder_token') || localStorage.getItem('token');
      const user = localStorage.getItem('pathfinder_user');
      console.log('[PathFinder Auth] Session storage verified:', { hasToken: !!token, hasUser: !!user });

      const role = response.role?.toUpperCase() || 'STUDENT';
      if (role === 'COMPANY') {
        navigate('/company');
      } else if (role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (err: any) {
      console.error('[PathFinder Auth] Google OAuth verification failed:', err);
      setError(err.message || 'Google authentication failed. Please verify your token and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (errorMsg: string) => {
    console.warn('[PathFinder Auth] Google Identity Services error:', errorMsg);
    setError(errorMsg);
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
          <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-900 animate-in fade-in">
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

        {/* ── Official Google Identity Services OAuth Component ── */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="continue_with"
          />
        </div>

        <p className="mt-6 text-center text-sm text-[#7A6A65]">
          Don&apos;t have an account yet?{' '}
          <Link to="/register" className="font-bold text-[#7A4B43] hover:text-[#5E342D]">
            Create account
          </Link>
        </p>

        {/* ── Live Database Connection Status Pill ── */}
        <div className="mt-5 pt-4 border-t border-[#E5D5CE]/60 flex items-center justify-center">
          <div
            id="live-db-pill"
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
              dbStatus.type === 'SUPABASE' || dbStatus.database.toLowerCase().includes('supabase')
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : dbStatus.type === 'H2' || dbStatus.database.toLowerCase().includes('h2')
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : dbStatus.type === 'LOADING'
                ? 'bg-slate-50 text-slate-700 border-slate-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
            title={`Active Database: ${dbStatus.database}`}
          >
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                dbStatus.type === 'SUPABASE' || dbStatus.database.toLowerCase().includes('supabase')
                  ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)] animate-pulse'
                  : dbStatus.type === 'H2' || dbStatus.database.toLowerCase().includes('h2')
                  ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]'
                  : dbStatus.type === 'LOADING'
                  ? 'bg-slate-400 animate-ping'
                  : 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]'
              }`}
            />
            <span className="tracking-wide">
              {dbStatus.type === 'SUPABASE' || dbStatus.database.toLowerCase().includes('supabase')
                ? 'DB: Supabase (Original)'
                : dbStatus.type === 'H2' || dbStatus.database.toLowerCase().includes('h2')
                ? 'DB: Local H2 (Dev Mode)'
                : dbStatus.type === 'LOADING'
                ? 'DB: Checking status...'
                : 'DB: Backend Offline'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

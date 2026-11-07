import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'COMPANY'>('STUDENT');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await register({ email, password, role });
      const userRole = response.role?.toUpperCase() || role;
      if (userRole === 'COMPANY') {
        navigate('/company');
      } else {
        navigate('/student');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#FAF6F4] text-[#2B1B17] p-6 selection:bg-[#E6A694]/30 selection:text-[#7A4B43]">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#E6A694]/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-[460px] rounded-3xl border border-[#E5D5CE] bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-3 mb-4 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7A4B43] text-white shadow-sm group-hover:scale-105 transition-transform">
              <span className="font-serif font-black text-white text-2xl">P</span>
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#2B1B17]">
              Path<span className="text-[#7A4B43]">Finder</span>
            </span>
          </Link>
          <h1 className="font-serif text-3xl font-bold text-[#2B1B17]">Create Account</h1>
          <p className="mt-1 text-sm text-[#7A6A65]">Join PathFinder to match with top internships</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">I am registering as</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('STUDENT')}
                className={`py-3 text-sm font-bold rounded-xl border transition-all ${
                  role === 'STUDENT'
                    ? 'border-[#7A4B43] bg-[#7A4B43] text-white shadow-md'
                    : 'border-[#E5D5CE] bg-white text-[#7A6A65] hover:text-[#2B1B17] hover:bg-[#F2E8E4]'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('COMPANY')}
                className={`py-3 text-sm font-bold rounded-xl border transition-all ${
                  role === 'COMPANY'
                    ? 'border-[#7A4B43] bg-[#7A4B43] text-white shadow-md'
                    : 'border-[#E5D5CE] bg-white text-[#7A6A65] hover:text-[#2B1B17] hover:bg-[#F2E8E4]'
                }`}
              >
                Employer
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input text-sm"
              placeholder="you@domain.com"
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

          <div>
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 text-sm font-semibold"
          >
            {loading ? 'Creating Account...' : 'Get Started'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#7A6A65]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#7A4B43] hover:text-[#5E342D]">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

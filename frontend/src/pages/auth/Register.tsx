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
    <div className="flex min-h-screen items-center justify-center bg-sand p-6">
      <div className="w-[440px] rounded-xl border border-sand-line bg-paper-raised p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <img src="/logo.svg" alt="PathFinder Logo" className="w-8 h-8" />
            <span className="font-serif text-xl font-bold">PathFinder</span>
          </Link>
          <h1 className="font-serif text-2xl font-bold text-ink">Create an account</h1>
          <p className="mt-1 text-sm text-ink-soft">Join PathFinder to match with internships</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">I am a</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('STUDENT')}
                className={`py-2 text-xs font-semibold rounded-lg border transition ${
                  role === 'STUDENT'
                    ? 'bg-signal text-white border-signal'
                    : 'bg-paper text-ink border-sand-line hover:bg-sand/40'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('COMPANY')}
                className={`py-2 text-xs font-semibold rounded-lg border transition ${
                  role === 'COMPANY'
                    ? 'bg-signal text-white border-signal'
                    : 'bg-paper text-ink border-sand-line hover:bg-sand/40'
                }`}
              >
                Company
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-sand-line bg-paper px-3 py-2.5 text-sm focus:outline focus:outline-2 focus:outline-signal"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-sand-line bg-paper px-3 py-2.5 text-sm focus:outline focus:outline-2 focus:outline-signal"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-sand-line bg-paper px-3 py-2.5 text-sm focus:outline focus:outline-2 focus:outline-signal"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-2.5 font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-ink-soft">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-signal hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}


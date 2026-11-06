import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { setToken, setStoredUser } from '../../services/api';

export default function OAuth2Redirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search || window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    const role = params.get('role') || 'STUDENT';

    if (token) {
      // 1. Store token in localStorage under 'token' and 'pathfinder_token'
      localStorage.setItem('token', token);
      localStorage.setItem('pathfinder_token', token);
      setToken(token);

      if (email) {
        localStorage.setItem('email', email);
        localStorage.setItem('role', role);
        setStoredUser({ email, role });
        // 2. Update AuthContext state
        loginWithToken(token, email, role);
      }

      // 3. Clean query params from URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // 4. Redirect based on role
      if (role.toUpperCase().includes('COMPANY')) {
        navigate('/company', { replace: true });
      } else if (role.toUpperCase().includes('ADMIN')) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    } else {
      navigate('/login?error=token_missing', { replace: true });
    }
  }, [location, loginWithToken, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="card text-center p-8 max-w-sm">
        <div className="flex justify-center mb-4">
          <svg className="animate-spin h-8 w-8 text-signal" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
        <h3 className="font-serif text-[18px] font-bold mb-1">Authenticating with Google...</h3>
        <p className="text-sm text-ink-soft">Redirecting you to your PathFinder dashboard.</p>
      </div>
    </div>
  );
}

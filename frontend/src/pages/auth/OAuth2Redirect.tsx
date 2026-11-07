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
    <div className="flex min-h-screen items-center justify-center bg-[#FAF6F4] text-[#2B1B17] p-6">
      <div className="card text-center p-8 max-w-sm rounded-3xl border border-[#E5D5CE] bg-white shadow-md">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#7A4B43] border-t-transparent" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-[#2B1B17] mb-1.5">Authenticating with Google...</h3>
        <p className="text-sm text-[#7A6A65]">Securely redirecting you to your PathFinder dashboard.</p>
      </div>
    </div>
  );
}

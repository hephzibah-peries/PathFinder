import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  authApi,
  getToken,
  setToken,
  removeToken,
  getStoredUser,
  setStoredUser,
  decodeJwtClaims,
  clearCompanyCache,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserSession,
} from '../services/api';

export type { UserSession };

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<AuthResponse>;
  register: (data: RegisterRequest) => Promise<AuthResponse>;
  loginWithGoogle: (idToken: string) => Promise<AuthResponse>;
  loginWithToken: (token: string, email: string, role: string) => void;
  logout: () => void;
  refreshUser: () => Promise<UserSession | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokenState, setTokenState] = useState<string | null>(() => getToken());
  const [userState, setUserState] = useState<UserSession | null>(() => {
    const stored = getStoredUser();
    if (stored) return stored;
    const token = getToken();
    if (token) {
      const claims = decodeJwtClaims(token);
      if (claims?.email && claims?.role) {
        return { email: claims.email, role: claims.role };
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Re-validate session with backend /api/auth/me on mount/refresh
  const validateSession = async (currentToken: string | null, currentUser: UserSession | null) => {
    if (!currentToken) {
      setUserState(null);
      setTokenState(null);
      setIsLoading(false);
      return;
    }

    // Check token expiration if claim exists
    const claims = decodeJwtClaims(currentToken);
    if (claims?.exp && claims.exp * 1000 < Date.now()) {
      console.warn('[PathFinder Auth] Session token has expired, logging out...');
      removeToken();
      setUserState(null);
      setTokenState(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await authApi.getMe();
      if (me?.email && me?.role) {
        // If a different user was previously stored, clean up old company cache
        if (currentUser && currentUser.email.toLowerCase() !== me.email.toLowerCase()) {
          clearCompanyCache();
        }
        const updatedUser: UserSession = { email: me.email, role: me.role };
        setStoredUser(updatedUser);
        setUserState(updatedUser);
      }
    } catch (err: any) {
      console.warn('[PathFinder Auth] Session re-validation failed:', err.message);
      // If server explicitly returned 401/403 or token is invalid, clear session
      const msg = err.message || '';
      if (msg.includes('401') || msg.includes('403') || msg.includes('Unauthorized') || msg.includes('Forbidden')) {
        removeToken();
        setUserState(null);
        setTokenState(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Check for OAuth2 redirect parameters in current URL
    const urlParams = new URLSearchParams(window.location.search);
    const oauthToken = urlParams.get('token');
    const oauthEmail = urlParams.get('email');
    const oauthRole = urlParams.get('role');

    if (oauthToken && oauthEmail) {
      const role = oauthRole || 'STUDENT';
      const prevUser = getStoredUser();
      if (prevUser && prevUser.email.toLowerCase() !== oauthEmail.toLowerCase()) {
        clearCompanyCache();
      }
      setToken(oauthToken);
      const newUser: UserSession = { email: oauthEmail, role };
      setStoredUser(newUser);
      setTokenState(oauthToken);
      setUserState(newUser);

      // Clean query parameters from URL without reloading
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      // Validate in background
      validateSession(oauthToken, newUser);
    } else {
      const storedToken = getToken();
      const storedUser = getStoredUser();
      setTokenState(storedToken);
      setUserState(storedUser);
      validateSession(storedToken, storedUser);
    }
  }, []);

  const refreshUser = async (): Promise<UserSession | null> => {
    const token = getToken();
    if (!token) return null;
    try {
      const me = await authApi.getMe();
      if (me?.email && me?.role) {
        const updatedUser: UserSession = { email: me.email, role: me.role };
        setStoredUser(updatedUser);
        setUserState(updatedUser);
        return updatedUser;
      }
    } catch {
      // ignore
    }
    return userState;
  };

  const login = async (data: LoginRequest): Promise<AuthResponse> => {
    const prevUser = getStoredUser();
    const res = await authApi.login(data);
    if (prevUser && prevUser.email.toLowerCase() !== res.email.toLowerCase()) {
      clearCompanyCache();
    }
    setToken(res.token);
    const userSession: UserSession = { email: res.email, role: res.role };
    setStoredUser(userSession);
    setTokenState(res.token);
    setUserState(userSession);
    return res;
  };

  const register = async (data: RegisterRequest): Promise<AuthResponse> => {
    clearCompanyCache();
    const res = await authApi.register(data);
    setToken(res.token);
    const userSession: UserSession = { email: res.email, role: res.role };
    setStoredUser(userSession);
    setTokenState(res.token);
    setUserState(userSession);
    return res;
  };

  const loginWithGoogle = async (idToken: string): Promise<AuthResponse> => {
    const prevUser = getStoredUser();
    const res = await authApi.loginWithGoogle(idToken);
    if (prevUser && prevUser.email.toLowerCase() !== res.email.toLowerCase()) {
      clearCompanyCache();
    }
    setToken(res.token);
    const userSession: UserSession = { email: res.email, role: res.role };
    setStoredUser(userSession);
    setTokenState(res.token);
    setUserState(userSession);
    return res;
  };

  const loginWithToken = (token: string, email: string, role: string) => {
    const prevUser = getStoredUser();
    if (prevUser && prevUser.email.toLowerCase() !== email.toLowerCase()) {
      clearCompanyCache();
    }
    setToken(token);
    const userSession: UserSession = { email, role };
    setStoredUser(userSession);
    setTokenState(token);
    setUserState(userSession);
  };

  const logout = () => {
    removeToken();
    setTokenState(null);
    setUserState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: userState,
        token: tokenState,
        isAuthenticated: !!tokenState && !!userState,
        isLoading,
        login,
        register,
        loginWithGoogle,
        loginWithToken,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

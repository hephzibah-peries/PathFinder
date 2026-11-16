import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  authApi,
  getToken,
  setToken,
  removeToken,
  getStoredUser,
  setStoredUser,
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokenState, setTokenState] = useState<string | null>(getToken());
  const [userState, setUserState] = useState<UserSession | null>(getStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Check for OAuth2 redirect parameters in current URL
    const urlParams = new URLSearchParams(window.location.search);
    const oauthToken = urlParams.get('token');
    const oauthEmail = urlParams.get('email');
    const oauthRole = urlParams.get('role');

    if (oauthToken && oauthEmail) {
      const role = oauthRole || 'STUDENT';
      setToken(oauthToken);
      setStoredUser({ email: oauthEmail, role });
      setTokenState(oauthToken);
      setUserState({ email: oauthEmail, role });

      // Clean query parameters from URL without reloading
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } else {
      const storedToken = getToken();
      const storedUser = getStoredUser();
      setTokenState(storedToken);
      setUserState(storedUser);
    }

    setIsLoading(false);
  }, []);

  const login = async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await authApi.login(data);
    setToken(res.token);
    setStoredUser({ email: res.email, role: res.role });
    setTokenState(res.token);
    setUserState({ email: res.email, role: res.role });
    return res;
  };

  const register = async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await authApi.register(data);
    setToken(res.token);
    setStoredUser({ email: res.email, role: res.role });
    setTokenState(res.token);
    setUserState({ email: res.email, role: res.role });
    return res;
  };

  const loginWithGoogle = async (idToken: string): Promise<AuthResponse> => {
    const res = await authApi.loginWithGoogle(idToken);
    setToken(res.token);
    setStoredUser({ email: res.email, role: res.role });
    setTokenState(res.token);
    setUserState({ email: res.email, role: res.role });
    return res;
  };

  const loginWithToken = (token: string, email: string, role: string) => {
    setToken(token);
    setStoredUser({ email, role });
    setTokenState(token);
    setUserState({ email, role });
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
        isAuthenticated: !!tokenState,
        isLoading,
        login,
        register,
        loginWithGoogle,
        loginWithToken,
        logout,
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

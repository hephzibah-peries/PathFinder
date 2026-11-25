import React, { useEffect, useRef, useState } from 'react';
import { getOAuth2AuthorizationUrl } from '../../services/api';

declare global {
  interface Window {
    google?: {
      accounts: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
        };
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            prompt?: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
              error_uri?: string;
            }) => void;
            error_callback?: (error: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export interface GoogleLoginProps {
  onSuccess: (credential: string) => void;
  onError?: (error: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  className?: string;
}

export const GoogleLogin: React.FC<GoogleLoginProps> = ({
  onSuccess,
  onError,
  text = 'continue_with',
  className = '',
}) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const tokenClientRef = useRef<any>(null);

  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '926122729245-dtgdbagf8cq4p7s5rhkc7l6g7gdk4b2s.apps.googleusercontent.com';

  useEffect(() => {
    // 1. Check if Google script is already loaded
    const existingScript = document.getElementById('google-gsi-client');
    if (existingScript && (window.google?.accounts?.oauth2 || window.google?.accounts?.id)) {
      setScriptLoaded(true);
      return;
    }

    // 2. Load Google Identity Services script
    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.warn('Could not load Google Identity Services script (e.g. ad blocker enabled). Fallback will be used.');
    };
    document.body.appendChild(script);
  }, []);

  // 3. Initialize OAuth 2.0 Token Client once GIS script is ready
  useEffect(() => {
    if (!scriptLoaded || !window.google?.accounts?.oauth2) {
      return;
    }

    try {
      // Initialize OAuth 2.0 Token Client for explicit user-triggered account selection
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        prompt: 'select_account',
        callback: (tokenResponse) => {
          setIsConnecting(false);
          if (tokenResponse?.error) {
            console.warn('[PathFinder Auth] Google OAuth popup response error:', tokenResponse.error);
            onError?.(tokenResponse.error_description || tokenResponse.error || 'Google Sign-In was cancelled or failed.');
            return;
          }
          if (tokenResponse?.access_token) {
            onSuccess(tokenResponse.access_token);
          } else {
            onError?.('No access token returned from Google.');
          }
        },
        error_callback: (err) => {
          setIsConnecting(false);
          console.warn('[PathFinder Auth] Google OAuth client error:', err);
          onError?.('Google Sign-In window encountered an error.');
        },
      });
    } catch (err: any) {
      console.error('Failed to initialize Google OAuth token client:', err);
    }
  }, [scriptLoaded, clientId, onSuccess, onError]);

  const handleButtonClick = () => {
    if (tokenClientRef.current) {
      setIsConnecting(true);
      try {
        // Explicitly prompt the user with account selector popup
        tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
      } catch (err: any) {
        setIsConnecting(false);
        console.error('Error opening Google Sign-In popup, redirecting to OAuth2 endpoint:', err);
        window.location.href = getOAuth2AuthorizationUrl('google');
      }
    } else {
      // Fallback: direct browser redirect to backend Spring Security OAuth2 login
      window.location.href = getOAuth2AuthorizationUrl('google');
    }
  };

  const getButtonText = () => {
    if (isConnecting) return 'Connecting to Google...';
    if (text === 'signin' || text === 'signin_with') return 'Sign in with Google';
    if (text === 'signup_with') return 'Sign up with Google';
    return 'Continue with Google';
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 
        Generic "Continue with Google" button.
        Zero personalized iframes, never reveals user's email, name or avatar on the page.
      */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isConnecting}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#E5D5CE] bg-white text-[#2B1B17] font-semibold text-sm hover:bg-[#FAF6F4] hover:border-[#D4BBAF] active:scale-[0.99] transition-all shadow-xs disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        title="Continue with Google"
      >
        {/* Official 4-color Google G Icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" className="flex-shrink-0" aria-hidden="true">
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
        <span>{getButtonText()}</span>
      </button>
    </div>
  );
};

export default GoogleLogin;

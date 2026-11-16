import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: string | number;
            }
          ) => void;
          prompt: () => void;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '926122729245-dtgdbagf8cq4p7s5rhkc7l6g7gdk4b2s.apps.googleusercontent.com';

  useEffect(() => {
    // 1. Check if Google script already present
    const existingScript = document.getElementById('google-gsi-client');
    if (existingScript && window.google?.accounts?.id) {
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
      console.warn('Could not load Google Identity Services script (e.g. ad blocker enabled).');
      setScriptError(true);
      onError?.('Google Sign-In script failed to load. Check your network or ad blocker.');
    };
    document.body.appendChild(script);
  }, [onError]);

  // 3. Initialize and render official button once script is ready
  useEffect(() => {
    if (!scriptLoaded || !window.google?.accounts?.id || !containerRef.current) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) {
            onSuccess(response.credential);
          } else {
            const err = 'No credential returned from Google.';
            console.error(err);
            onError?.(err);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Clear container and render button
      containerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        text,
        shape: 'pill',
        width: containerRef.current.offsetWidth || 376,
      });
    } catch (err: any) {
      console.error('Failed to initialize Google Sign-In:', err);
      onError?.(err.message || 'Failed to initialize Google Sign-In');
    }
  }, [scriptLoaded, clientId, onSuccess, onError, text]);

  // Fallback handler if clicked when official button hasn't replaced the UI yet
  const handleFallbackClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      // Direct redirect to Spring Security OAuth2 endpoint as fallback
      window.location.href = '/oauth2/authorization/google';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Official Google Button Render Container */}
      <div
        ref={containerRef}
        className="flex w-full justify-center min-h-[44px]"
      >
        {(!scriptLoaded || scriptError) && (
          <button
            type="button"
            onClick={handleFallbackClick}
            className="btn btn-secondary flex w-full items-center justify-center gap-2.5 py-3 text-sm font-semibold hover:border-[#C8A84B]/60 transition-all shadow-xs"
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
            Sign in with Google
          </button>
        )}
      </div>
    </div>
  );
};

export default GoogleLogin;

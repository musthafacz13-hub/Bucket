import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

export interface TurnstileWidgetRef {
  reset: () => void;
}

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: (errorCode: string) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

export const isProduction = (): boolean => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return Boolean(import.meta.env.PROD);
    }
  } catch {}
  return process.env.NODE_ENV === 'production';
};

/**
 * Reads the Cloudflare Turnstile public Site Key from environment variables.
 * In production, fallback test keys are strictly eliminated to prevent bypass or misconfiguration.
 */
export const getTurnstileSiteKey = (): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TURNSTILE_SITE_KEY) {
      const key = String(import.meta.env.VITE_TURNSTILE_SITE_KEY).trim();
      if (key) return key;
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env.VITE_TURNSTILE_SITE_KEY) {
      const key = String(process.env.VITE_TURNSTILE_SITE_KEY).trim();
      if (key) return key;
    }
  } catch {}
  return '';
};

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  ({ onSuccess, onError, onExpire, className = '', theme = 'light' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    const onExpireRef = useRef(onExpire);
    const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const siteKey = getTurnstileSiteKey();

    useEffect(() => {
      onSuccessRef.current = onSuccess;
      onErrorRef.current = onError;
      onExpireRef.current = onExpire;
    }, [onSuccess, onError, onExpire]);

    const resetWidget = () => {
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          // Ignore reset errors
        }
      }
    };

    useImperativeHandle(ref, () => ({
      reset: resetWidget,
    }));

    useEffect(() => {
      let isMounted = true;
      let hasRendered = false;
      const scriptId = 'cf-turnstile-script';

      if (!siteKey) {
        setLoadState('error');
        setErrorMessage('Security verification is not configured. Missing VITE_TURNSTILE_SITE_KEY.');
        return () => {
          isMounted = false;
        };
      }

      const renderWidget = () => {
        if (!isMounted || hasRendered || !containerRef.current || !window.turnstile) return;

        hasRendered = true;

        // Clean up previous widget instance if any
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {}
          widgetIdRef.current = null;
        }

        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              if (isMounted) {
                setErrorMessage(null);
                onSuccessRef.current(token);
              }
            },
            'error-callback': (code: string) => {
              if (isMounted) {
                let msg = `Verification challenge error (${code}). Please retry.`;
                if (code === '110200' || code === '300030') {
                  msg = 'Domain mismatch: please ensure this preview hostname is in Cloudflare Turnstile allowed domains.';
                } else if (code === '110600') {
                  msg = 'Invalid site key: please verify your Cloudflare Turnstile site key.';
                }
                setErrorMessage(msg);
                onErrorRef.current?.(msg);
              }
            },
            'expired-callback': () => {
              if (isMounted) {
                setErrorMessage('Verification expired. Please check the box again.');
                onExpireRef.current?.();
              }
            },
            theme,
            size: 'flexible',
          });

          widgetIdRef.current = id;
          setLoadState('ready');
        } catch (renderErr) {
          if (isMounted) {
            setLoadState('error');
            setErrorMessage('Could not initialize security verification.');
          }
        }
      };

      if (window.turnstile) {
        renderWidget();
      } else {
        // Load Turnstile script dynamically
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement('script');
          script.id = scriptId;
          script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        }

        const handleLoad = () => {
          if (isMounted) {
            renderWidget();
          }
        };

        const handleError = () => {
          if (isMounted) {
            setLoadState('error');
            setErrorMessage('Unable to load security verification challenge. Please check your connection.');
          }
        };

        script.addEventListener('load', handleLoad);
        script.addEventListener('error', handleError);

        // Fallback polling for Turnstile in case the script was already loading.
        const interval = window.turnstile
          ? undefined
          : setInterval(() => {
          if (window.turnstile) {
            if (interval) clearInterval(interval);
            handleLoad();
          }
        }, 100);

        return () => {
          isMounted = false;
          if (interval) clearInterval(interval);
          script?.removeEventListener('load', handleLoad);
          script?.removeEventListener('error', handleError);
          if (widgetIdRef.current && window.turnstile) {
            try {
              window.turnstile.remove(widgetIdRef.current);
            } catch {}
          }
        };
      }

      return () => {
        isMounted = false;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {}
        }
      };
    }, [siteKey, theme]);

    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex items-center justify-between text-[11px] text-[#646477]">
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#08C83D]" />
            <span>Security Verification</span>
          </span>
        </div>

        <div
          ref={containerRef}
          className="min-h-[65px] flex items-center justify-center p-2 rounded-lg border border-[#E8E8EE] bg-[#FAFAFC]"
        >
          {loadState === 'loading' && (
            <div className="flex items-center gap-2 text-xs text-[#8E8EA0] animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#646477]" />
              <span>Loading verification...</span>
            </div>
          )}
        </div>

        {errorMessage && (
          <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}
      </div>
    );
  }
);

TurnstileWidget.displayName = 'TurnstileWidget';

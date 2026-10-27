import React, { useEffect, useRef } from 'react';
import { ShieldAlert, AlertTriangle, X, Check, ExternalLink } from 'lucide-react';

interface ReplaceTurnstileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentSiteKey?: string;
}

export const ReplaceTurnstileModal: React.FC<ReplaceTurnstileModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentSiteKey,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    cancelButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="replace-turnstile-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white rounded-2xl border border-[#E8E8EE] shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#F0F0F4] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="replace-turnstile-title"
                className="text-base font-semibold text-[#191927]"
              >
                Replace Cloudflare Turnstile Configuration
              </h2>
              <p className="text-xs text-[#646477] mt-0.5">
                Safe replacement of existing CAPTCHA bot protection
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8E8EA0] hover:text-[#191927] rounded-lg hover:bg-[#F3F3F7] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-[#191927]">
          {/* Active Site Key Callout if configured */}
          {currentSiteKey && (
            <div className="p-3 bg-[#FAFAFC] border border-[#E8E8EE] rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#646477]">Current Active Site Key:</span>
              <code className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-[#E8E8EE] text-[#191927]">
                {currentSiteKey.length > 12
                  ? `${currentSiteKey.substring(0, 6)}...${currentSiteKey.slice(-4)}`
                  : currentSiteKey}
              </code>
            </div>
          )}

          {/* Warning Banner */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs">
              Please review the requirements below before proceeding with the configuration cleanup.
            </p>
          </div>

          {/* Explanatory Requirements List */}
          <div className="space-y-2.5 pt-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8EA0]">
              Configuration Checklist &amp; Impact
            </div>

            <ul className="space-y-2 text-xs text-[#646477] list-none">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                <span>The current CAPTCHA configuration will be replaced.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#191927] shrink-0 mt-1.5" />
                <span>I must create or select the intended Cloudflare Turnstile widget.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#191927] shrink-0 mt-1.5" />
                <span>I must configure the matching Secret Key securely in Supabase.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#191927] shrink-0 mt-1.5" />
                <span>I must provide the new public Site Key for the frontend.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                <span className="text-red-700 font-medium">
                  Authentication may fail until the replacement configuration is complete.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-[#FAFAFC] border-t border-[#E8E8EE] flex items-center justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#191927] bg-white hover:bg-[#F3F3F7] active:bg-[#EBEBEF] border border-[#E8E8EE] rounded-xl transition-colors cursor-pointer min-h-[38px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#191927] hover:bg-[#2C2C3F] active:bg-[#0E0E18] rounded-xl transition-colors cursor-pointer min-h-[38px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

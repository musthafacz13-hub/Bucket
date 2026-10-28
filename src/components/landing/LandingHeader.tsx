import React, { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';

interface LandingHeaderProps {
  onGetStarted: () => void;
  onScrollToSection: (sectionId: string) => void;
  onLogin?: () => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  onGetStarted,
  onScrollToSection,
  onLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (id: string) => {
    onScrollToSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E8E8EE] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => handleNavClick('hero')}
          className="flex items-center gap-2.5 rounded py-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927]"
          aria-label="Bucket home"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#191927] text-white" aria-hidden="true">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 11 17.5 20a2 2 0 0 1-2 1.8H8.5A2 2 0 0 1 6.5 20L5 11" />
              <path d="M4 11h16" />
              <path d="M9 11V6a3 3 0 0 1 6 0v5" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-[#191927]">Bucket</span>
        </button>

        <nav className="hidden items-center gap-6 text-xs font-medium text-[#646477] sm:flex" aria-label="Landing page">
          <button type="button" onClick={() => handleNavClick('preview')} className="py-2 transition-colors hover:text-[#191927]">
            The workspace
          </button>
          <button type="button" onClick={() => handleNavClick('benefits')} className="py-2 transition-colors hover:text-[#191927]">
            Why Bucket
          </button>
          <button type="button" onClick={() => handleNavClick('how-it-works')} className="py-2 transition-colors hover:text-[#191927]">
            How it works
          </button>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {onLogin && (
            <button
              type="button"
              onClick={onLogin}
              className="hidden rounded-lg px-2.5 py-2 text-xs font-medium text-[#646477] transition-colors hover:text-[#191927] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] sm:inline-flex"
            >
              Sign in
            </button>
          )}
          <button
            type="button"
            onClick={onGetStarted}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-[#191927] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2C2C3F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] focus-visible:ring-offset-2"
          >
            Get started
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-md p-2 text-[#646477] transition-colors hover:bg-[#FAFAFC] hover:text-[#191927] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] sm:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[#E8E8EE] bg-white px-4 py-3 sm:hidden">
          <div className="mx-auto grid max-w-5xl gap-1">
            <button type="button" onClick={() => handleNavClick('preview')} className="rounded-md px-3 py-2.5 text-left text-xs font-medium text-[#191927] hover:bg-[#FAFAFC]">
              The workspace
            </button>
            <button type="button" onClick={() => handleNavClick('benefits')} className="rounded-md px-3 py-2.5 text-left text-xs font-medium text-[#191927] hover:bg-[#FAFAFC]">
              Why Bucket
            </button>
            <button type="button" onClick={() => handleNavClick('how-it-works')} className="rounded-md px-3 py-2.5 text-left text-xs font-medium text-[#191927] hover:bg-[#FAFAFC]">
              How it works
            </button>
            {onLogin && (
              <button type="button" onClick={() => { setMobileMenuOpen(false); onLogin(); }} className="rounded-md px-3 py-2.5 text-left text-xs font-medium text-[#191927] hover:bg-[#FAFAFC]">
                Sign in
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

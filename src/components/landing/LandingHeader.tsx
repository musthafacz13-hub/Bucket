import React, { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';

interface LandingHeaderProps {
  onGetStarted: () => void;
  onEnterWorkspace: () => void;
  onScrollToSection: (sectionId: string) => void;
  onLogin?: () => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  onGetStarted,
  onEnterWorkspace,
  onScrollToSection,
  onLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (id: string) => {
    onScrollToSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-[#E8E8EE] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
        {/* Zone 1: Single Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('hero')}
          className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] rounded py-1 cursor-pointer"
          aria-label="Bucket Home"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#191927] text-white shrink-0"
            aria-hidden="true"
          >
            <svg
              className="w-3.5 h-3.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 11 17.5 20a2 2 0 0 1-2 1.8H8.5A2 2 0 0 1 6.5 20L5 11" />
              <path d="M4 11h16" />
              <path d="M9 11V6a3 3 0 0 1 6 0v5" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-[#191927]">
            Bucket
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden sm:flex items-center gap-5 text-xs font-medium text-[#646477]">
          <button
            type="button"
            onClick={() => handleNavClick('preview')}
            className="hover:text-[#191927] transition-colors cursor-pointer py-1"
          >
            Product Tour
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('benefits')}
            className="hover:text-[#191927] transition-colors cursor-pointer py-1"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('how-it-works')}
            className="hover:text-[#191927] transition-colors cursor-pointer py-1"
          >
            How it works
          </button>
          <button
            type="button"
            onClick={onEnterWorkspace}
            className="hover:text-[#191927] transition-colors cursor-pointer py-1"
          >
            Workspace
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onLogin && (
            <button
              type="button"
              onClick={onLogin}
              className="text-xs font-medium text-[#646477] hover:text-[#191927] transition-colors px-2.5 py-1.5 rounded-lg cursor-pointer"
            >
              Sign in
            </button>
          )}

          <button
            type="button"
            onClick={onGetStarted}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#191927] hover:bg-[#2C2C3F] active:bg-[#0E0E18] rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] min-h-[34px]"
          >
            <span>Get started</span>
            <ArrowRight className="w-3 h-3 opacity-80" />
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-1.5 text-[#646477] hover:text-[#191927] rounded-md transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-[#E8E8EE] bg-white px-4 py-3 space-y-1.5 animate-in fade-in duration-150">
          <button
            type="button"
            onClick={() => handleNavClick('preview')}
            className="w-full text-left px-3 py-2 text-xs font-medium text-[#191927] hover:bg-[#F3F3F7] rounded-md"
          >
            Product Tour
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('benefits')}
            className="w-full text-left px-3 py-2 text-xs font-medium text-[#191927] hover:bg-[#F3F3F7] rounded-md"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('how-it-works')}
            className="w-full text-left px-3 py-2 text-xs font-medium text-[#191927] hover:bg-[#F3F3F7] rounded-md"
          >
            How it works
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onEnterWorkspace();
            }}
            className="w-full text-left px-3 py-2 text-xs font-medium text-[#191927] hover:bg-[#F3F3F7] rounded-md"
          >
            Workspace
          </button>
          {onLogin && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogin();
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-[#191927] hover:bg-[#F3F3F7] rounded-md"
            >
              Sign in
            </button>
          )}
        </div>
      )}
    </header>
  );
};

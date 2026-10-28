import React, { useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  FileText,
  Calendar as CalendarIcon,
  Layers,
  Sparkles,
} from 'lucide-react';
import { LandingHeader } from './LandingHeader';
import { InterfacePreview } from './InterfacePreview';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin,
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#191927] flex flex-col selection:bg-[#08C83D]/15 selection:text-[#191927]">
      {/* 1. Compact Navigation Header */}
      <LandingHeader
        onGetStarted={onGetStarted}
        onScrollToSection={scrollToSection}
        onLogin={onLogin}
      />

      <main className="flex-1">
        {/* ============================================================== */}
        {/* SECTION 1 — HERO                                               */}
        {/* ============================================================== */}
        <section
          id="hero"
          className="pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-6 max-w-4xl mx-auto text-center"
        >
          {/* Natural Hook Kicker */}
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#646477] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#08C83D]" />
            <span>A calm space for personal ambitions</span>
          </div>

          {/* Exact Required Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#191927] leading-[1.08] max-w-3xl mx-auto">
            Make room for what matters.
          </h1>

          {/* Exact Required Supporting Text */}
          <p className="mt-5 text-base sm:text-lg md:text-xl text-[#646477] leading-relaxed max-w-xl mx-auto font-normal">
            Your goals, notes, and plans. One calm space.
          </p>

          {/* Call-to-Action Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#191927] hover:bg-[#2C2C3F] active:bg-[#0E0E18] rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] min-h-[44px]"
            >
              <span>Get started</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('preview')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-[#191927] bg-white hover:bg-[#F3F3F7] active:bg-[#EBEBEF] border border-[#E8E8EE] rounded-xl transition-colors cursor-pointer min-h-[44px]"
            >
              <span>Explore Bucket</span>
            </button>
          </div>

          {onLogin && (
            <div className="mt-4 text-xs text-[#646477]">
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={onLogin}
                className="font-medium text-[#191927] hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </div>
          )}
        </section>

        {/* ============================================================== */}
        {/* SECTION 2 — PRODUCT PREVIEW BOX                                */}
        {/* ============================================================== */}
        <section
          id="preview"
          className="pb-20 sm:pb-24 px-4 sm:px-6 max-w-5xl mx-auto scroll-mt-14"
        >
          <div className="text-center max-w-lg mx-auto mb-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#646477]">
              Interface Preview
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-[#191927]">
              Designed for clarity and momentum
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#646477] leading-relaxed">
              Explore the workspace architecture below. Try switching tabs and checking off items.
            </p>
          </div>

          {/* Genuine Interactive Schematic Preview */}
          <InterfacePreview
            onGetStarted={onGetStarted}
          />
        </section>

        {/* ============================================================== */}
        {/* SECTION 3 — BENEFIT BOXES                                      */}
        {/* ============================================================== */}
        <section
          id="benefits"
          className="py-16 sm:py-20 px-4 sm:px-6 bg-[#FAFAFC] border-y border-[#E8E8EE] scroll-mt-14"
        >
          <div className="max-w-5xl mx-auto">
            {/* Header & Natural Hook */}
            <div className="max-w-xl mx-auto text-center mb-12 sm:mb-16">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#646477]">
                Product Features
              </div>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-[#191927]">
                Keep the important things close.
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#646477] leading-relaxed">
                Start with one goal. Build from there. Everything in Bucket connects naturally
                so you never lose sight of your next step.
              </p>
            </div>

            {/* 4 Thoughtfully Designed Feature Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* BOX 1 — GOALS */}
              <div className="p-6 sm:p-7 rounded-xl border border-[#E8E8EE] bg-white hover:border-[#D1D1DB] transition-all flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-[#FAFAFC] border border-[#E8E8EE] flex items-center justify-center text-[#191927] mb-4">
                    <CheckSquare className="w-4 h-4 text-[#08C83D]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#191927]">
                    Know what you’re working toward.
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#646477] leading-relaxed">
                    Keep your goals organized and your next steps clear. Focus on active priorities
                    without drowning in overwhelming backlogs.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#F0F0F4] text-xs font-medium text-[#191927] flex items-center justify-between">
                  <span>Priority tiers · Target dates</span>
                  <span className="text-[#8E8EA0] text-[11px]">Milestones</span>
                </div>
              </div>

              {/* BOX 2 — NOTES */}
              <div className="p-6 sm:p-7 rounded-xl border border-[#E8E8EE] bg-white hover:border-[#D1D1DB] transition-all flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-[#FAFAFC] border border-[#E8E8EE] flex items-center justify-center text-[#191927] mb-4">
                    <FileText className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#191927]">
                    Keep your thoughts within reach.
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#646477] leading-relaxed">
                    Capture ideas, write notes, and organize what you want to remember.
                    Interactive markdown checklists check off with zero friction.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#F0F0F4] text-xs font-medium text-[#191927] flex items-center justify-between">
                  <span>Markdown · Fast checklists</span>
                  <span className="text-[#8E8EA0] text-[11px]">Linked notes</span>
                </div>
              </div>

              {/* BOX 3 — PLANNING */}
              <div className="p-6 sm:p-7 rounded-xl border border-[#E8E8EE] bg-white hover:border-[#D1D1DB] transition-all flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-[#FAFAFC] border border-[#E8E8EE] flex items-center justify-center text-[#191927] mb-4">
                    <CalendarIcon className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#191927]">
                    Give your plans a place.
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#646477] leading-relaxed">
                    See upcoming goal dates and keep your plans connected to your goals.
                    Your calendar derives automatically from your deadlines without double-entry.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#F0F0F4] text-xs font-medium text-[#191927] flex items-center justify-between">
                  <span>Automatic derivation · Monthly views</span>
                  <span className="text-[#8E8EA0] text-[11px]">Timeline</span>
                </div>
              </div>

              {/* BOX 4 — ONE WORKSPACE */}
              <div className="p-6 sm:p-7 rounded-xl border border-[#E8E8EE] bg-white hover:border-[#D1D1DB] transition-all flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-[#FAFAFC] border border-[#E8E8EE] flex items-center justify-center text-[#191927] mb-4">
                    <Layers className="w-4 h-4 text-[#8B5CF6]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#191927]">
                    Less scattered. More focused.
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#646477] leading-relaxed">
                    Bring your goals and notes together in one personal workspace.
                    Organize your ambitions into meaningful categories that reflect your life.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#F0F0F4] text-xs font-medium text-[#191927] flex items-center justify-between">
                  <span>Unified dashboard · Fast search</span>
                  <span className="text-[#8E8EA0] text-[11px]">Domains</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 5 — HOW IT WORKS                                       */}
        {/* ============================================================== */}
        <section
          id="how-it-works"
          className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto scroll-mt-14"
        >
          <div className="max-w-xl mx-auto text-center mb-12 sm:mb-16">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#646477]">
              Simple Cadence
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-[#191927]">
              Your ideas deserve a place to land.
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#646477] leading-relaxed">
              Three straightforward steps from initial inspiration to steady momentum.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-xl border border-[#E8E8EE] bg-white space-y-3 relative">
              <span className="text-xs font-mono font-bold text-[#8E8EA0] tracking-wider block">
                01
              </span>
              <h3 className="text-base font-bold text-[#191927]">Capture</h3>
              <p className="text-xs sm:text-sm text-[#646477] leading-relaxed">
                Write down a thought, note, or goal. Capture what is on your mind immediately
                before inspiration slips away.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-xl border border-[#E8E8EE] bg-white space-y-3 relative">
              <span className="text-xs font-mono font-bold text-[#8E8EA0] tracking-wider block">
                02
              </span>
              <h3 className="text-base font-bold text-[#191927]">Organize</h3>
              <p className="text-xs sm:text-sm text-[#646477] leading-relaxed">
                Keep related information together. Link notes directly to goals and assign
                realistic target dates.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-xl border border-[#E8E8EE] bg-white space-y-3 relative">
              <span className="text-xs font-mono font-bold text-[#8E8EA0] tracking-wider block">
                03
              </span>
              <h3 className="text-base font-bold text-[#191927]">Return</h3>
              <p className="text-xs sm:text-sm text-[#646477] leading-relaxed">
                Come back to your plans whenever you need them. Review your progress in a quiet,
                distraction-free space.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 6 — CLOSING CALL TO ACTION                             */}
        {/* ============================================================== */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#FAFAFC] border-t border-[#E8E8EE] text-center">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#191927]">
              Start with what matters.
            </h2>
            <p className="text-sm sm:text-base text-[#646477] leading-relaxed max-w-md mx-auto">
              Bring your goals and notes into one place. Make space for your next step.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onGetStarted}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#191927] hover:bg-[#2C2C3F] active:bg-[#0E0E18] rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] min-h-[44px]"
              >
                <span>Get started</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          </div>
        </section>
      </main>

      {/* ============================================================== */}
      {/* SECTION 7 — MINIMAL FOOTER                                     */}
      {/* ============================================================== */}
      <footer className="border-t border-[#E8E8EE] bg-white py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#646477]">
          {/* Brand & Wordmark */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-5 rounded flex items-center justify-center bg-[#191927] text-white shrink-0"
              aria-hidden="true"
            >
              <svg
                className="w-3 h-3 text-white"
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
            <span className="font-semibold text-[#191927]">Bucket</span>
            <span className="text-[#8E8EA0]">·</span>
            <span>One calm space for what matters.</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-5 font-medium">
            <button
              type="button"
              onClick={() => scrollToSection('preview')}
              className="hover:text-[#191927] transition-colors cursor-pointer"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('benefits')}
              className="hover:text-[#191927] transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#191927] transition-colors cursor-pointer"
            >
              How it works
            </button>
            {onLogin && (
              <button
                type="button"
                onClick={onLogin}
                className="hover:text-[#191927] transition-colors cursor-pointer"
              >
                Sign in
              </button>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-6 pt-4 border-t border-[#F0F0F4] text-[11px] text-[#8E8EA0] text-center sm:text-left">
          <span>© {new Date().getFullYear()} Bucket. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

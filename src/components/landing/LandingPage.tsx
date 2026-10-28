import React, { useEffect, useRef } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  FileText,
  Folder,
  Layers,
  Search,
} from 'lucide-react';
import { LandingHeader } from './LandingHeader';
import { InterfacePreview } from './InterfacePreview';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin?: () => void;
}

const Reveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add('is-visible');
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`landing-reveal ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-white text-[#191927] selection:bg-[#08C83D]/15 selection:text-[#191927]">
      <LandingHeader
        onGetStarted={onGetStarted}
        onScrollToSection={scrollToSection}
        onLogin={onLogin}
      />

      <main>
        <section id="hero" className="px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 scroll-mt-14">
          <div className="mx-auto grid max-w-5xl items-end gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-20">
            <Reveal>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#646477]">
                Personal goals and notes, together
              </p>
              <h1 className="max-w-3xl text-[2.75rem] font-semibold leading-[1.04] tracking-[-0.055em] text-[#191927] sm:text-6xl lg:text-[4.7rem]">
                Keep your plans in one place.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#646477] sm:text-lg">
                Bucket gives your goals, notes, categories, and progress a calm workspace—so the
                next step is easier to find.
              </p>
              <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#191927] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2C2C3F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] focus-visible:ring-offset-2 sm:w-auto"
                >
                  Create your workspace
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('preview')}
                  className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#646477] transition-colors hover:text-[#191927] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] focus-visible:ring-offset-2"
                >
                  See how it works
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              {onLogin && (
                <p className="mt-5 text-xs text-[#8E8EA0]">
                  Already using Bucket?{' '}
                  <button
                    type="button"
                    onClick={onLogin}
                    className="font-semibold text-[#191927] underline decoration-[#D1D1DB] underline-offset-4 transition-colors hover:decoration-[#191927]"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </Reveal>

            <Reveal className="border-l border-[#E8E8EE] pl-6 lg:mb-2" delay={120}>
              <p className="text-sm font-semibold leading-6 text-[#191927]">
                A small system for the things you do not want to lose track of.
              </p>
              <p className="mt-3 text-sm leading-6 text-[#646477]">
                Start with a goal, keep the context in a note, and use categories and dates to make
                the whole picture easier to return to.
              </p>
            </Reveal>
          </div>
        </section>

        <section id="preview" className="scroll-mt-14 border-y border-[#E8E8EE] bg-[#FAFAFC] px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <Reveal className="mb-8 max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#646477]">The workspace</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#191927] sm:text-4xl">
                Quiet structure for active thinking.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#646477] sm:text-base">
                The interface stays out of the way. Goals, notes, dates, and categories remain close
                enough to work together without becoming another system to manage.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <InterfacePreview />
            </Reveal>
          </div>
        </section>

        <section id="benefits" className="scroll-mt-14 px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#646477]">Built around the way plans change</p>
              <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#191927] sm:text-4xl">
                Direction, context, and a place to come back to.
              </h2>
            </Reveal>

            <div className="divide-y divide-[#E8E8EE] border-y border-[#E8E8EE]">
              <Reveal className="grid gap-4 py-6 sm:grid-cols-[52px_1fr] sm:gap-6" delay={80}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E8E8EE] text-[#191927]">
                  <CheckSquare className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#191927]">Goals make the next step visible.</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#646477]">
                    Keep priorities, status, and target dates together so progress is easy to review.
                  </p>
                </div>
              </Reveal>
              <Reveal className="grid gap-4 py-6 sm:grid-cols-[52px_1fr] sm:gap-6" delay={140}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E8E8EE] text-[#191927]">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#191927]">Notes keep the reasoning close.</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#646477]">
                    Capture detail, checklists, and decisions without scattering them across separate tools.
                  </p>
                </div>
              </Reveal>
              <Reveal className="grid gap-4 py-6 sm:grid-cols-[52px_1fr] sm:gap-6" delay={200}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E8E8EE] text-[#191927]">
                  <Layers className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#191927]">Categories make the whole workspace legible.</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#646477]">
                    Shape the space around the parts of life and work that matter to you.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-14 border-t border-[#E8E8EE] bg-[#FAFAFC] px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <Reveal className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#646477]">A simple cadence</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#191927] sm:text-4xl">
                Capture now. Organize when it helps. Return often.
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-0 border-y border-[#E8E8EE] md:grid-cols-3 md:divide-x md:divide-[#E8E8EE]">
              {[
                ['01', 'Capture', 'Write down a goal or note before it gets lost.'],
                ['02', 'Connect', 'Link context to the goal it belongs to, then add dates or categories when useful.'],
                ['03', 'Review', 'Use the dashboard, lists, calendar, and search to pick up where you left off.'],
              ].map(([number, title, copy], index) => (
                <Reveal key={number} className="border-b border-[#E8E8EE] py-7 last:border-b-0 md:border-b-0 md:px-8 md:first:pl-0 md:last:pr-0" delay={index * 80}>
                  <span className="font-mono text-xs font-semibold tracking-[0.18em] text-[#8E8EA0]">{number}</span>
                  <h3 className="mt-4 text-lg font-semibold text-[#191927]">{title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-[#646477]">{copy}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[#E8E8EE] px-4 py-16 text-center sm:px-6 sm:py-24">
          <Reveal className="mx-auto max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#646477]">Start with one thing</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#191927] sm:text-4xl">
              Make room for the next step.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#646477]">
              Create a personal workspace for the goals and notes you want to keep within reach.
            </p>
            <button
              type="button"
              onClick={onGetStarted}
              className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#191927] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2C2C3F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] focus-visible:ring-offset-2"
            >
              Create your workspace
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-[#E8E8EE] bg-white px-4 py-7 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 text-xs text-[#8E8EA0] sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold tracking-tight text-[#191927]">Bucket</span>
          <span>A calm workspace for goals, notes, and progress.</span>
        </div>
      </footer>
    </div>
  );
};

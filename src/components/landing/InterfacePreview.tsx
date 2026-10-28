import React, { useState } from 'react';
import {
  CalendarDays,
  CheckSquare,
  FileText,
  Folder,
  Plus,
  Search,
} from 'lucide-react';

type PreviewTab = 'goals' | 'notes' | 'calendar' | 'categories';

const tabs: Array<{ id: PreviewTab; label: string; icon: React.ReactNode }> = [
  { id: 'goals', label: 'Goals', icon: <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" /> },
  { id: 'notes', label: 'Notes', icon: <FileText className="h-3.5 w-3.5" aria-hidden="true" /> },
  { id: 'calendar', label: 'Calendar', icon: <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> },
  { id: 'categories', label: 'Categories', icon: <Folder className="h-3.5 w-3.5" aria-hidden="true" /> },
];

const emptyCopy: Record<PreviewTab, { title: string; description: string; action: string }> = {
  goals: {
    title: 'No goals yet',
    description: 'Your priorities will appear here once you create them.',
    action: 'New goal',
  },
  notes: {
    title: 'No notes yet',
    description: 'Keep the context behind your goals close by adding a note.',
    action: 'New note',
  },
  calendar: {
    title: 'A clear calendar',
    description: 'Goal dates will appear here when you add them to your workspace.',
    action: 'Add a goal date',
  },
  categories: {
    title: 'Your categories',
    description: 'Create categories that fit the parts of life you want to organize.',
    action: 'New category',
  },
};

export const InterfacePreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PreviewTab>('goals');
  const current = emptyCopy[activeTab];

  return (
    <div className="overflow-hidden rounded-xl border border-[#E8E8EE] bg-white shadow-[0_18px_50px_-28px_rgba(25,25,39,0.35)]">
      <div className="flex items-center justify-between border-b border-[#E8E8EE] bg-white px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-[#D1D1DB]" />
            <span className="h-2 w-2 rounded-full bg-[#D1D1DB]" />
            <span className="h-2 w-2 rounded-full bg-[#D1D1DB]" />
          </div>
          <span className="hidden font-mono text-[11px] text-[#8E8EA0] sm:inline">bucket / workspace</span>
        </div>
        <div className="flex items-center gap-3 text-[#8E8EA0]">
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-[11px]">Personal workspace</span>
        </div>
      </div>

      <div className="grid min-h-[340px] md:grid-cols-[156px_1fr]">
        <aside className="hidden border-r border-[#E8E8EE] bg-[#FAFAFC] p-3 md:block">
          <div className="mb-4 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8E8EA0]">Workspace</div>
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] ${
                  activeTab === tab.id
                    ? 'bg-white text-[#191927] shadow-[0_1px_2px_rgba(25,25,39,0.06)]'
                    : 'text-[#646477] hover:bg-white hover:text-[#191927]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="min-w-0 bg-[#FAFAFC]">
          <div className="flex gap-1 overflow-x-auto border-b border-[#E8E8EE] bg-white px-3 py-2 md:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2 text-[11px] font-semibold transition-colors ${
                  activeTab === tab.id ? 'bg-[#191927] text-white' : 'text-[#646477] hover:bg-[#FAFAFC]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between border-b border-[#E8E8EE] bg-white px-4 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8E8EA0]">{activeTab}</p>
              <h3 className="mt-1 text-base font-semibold tracking-tight text-[#191927]">A place to begin</h3>
            </div>
            <button
              type="button"
              aria-label={current.action}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#E8E8EE] px-2.5 py-2 text-[11px] font-semibold text-[#191927] transition-colors hover:bg-[#FAFAFC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{current.action}</span>
            </button>
          </div>

          <div className="flex min-h-[218px] items-center justify-center px-6 py-10 text-center sm:px-10">
            <div className="max-w-xs">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-[#E8E8EE] bg-white text-[#646477]">
                {tabs.find((tab) => tab.id === activeTab)?.icon}
              </div>
              <h4 className="mt-4 text-sm font-semibold text-[#191927]">{current.title}</h4>
              <p className="mt-1.5 text-xs leading-5 text-[#646477]">{current.description}</p>
              <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-[#8E8EA0]">
                Your workspace stays yours
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

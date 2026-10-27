import React, { useState } from 'react';
import {
  CheckSquare,
  FileText,
  Calendar as CalendarIcon,
  Folder,
  ArrowRight,
  ExternalLink,
  Check,
  Clock,
  Circle,
  Tag,
  Star,
  Layers,
} from 'lucide-react';

interface InterfacePreviewProps {
  onEnterWorkspace: () => void;
  onGetStarted?: () => void;
}

type PreviewTab = 'goals' | 'notes' | 'calendar' | 'categories';

interface PreviewGoal {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  priority: 'High' | 'Medium' | 'Low';
  targetDate: string;
  status: 'In Progress' | 'Completed' | 'Not Started';
}

interface PreviewNote {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  linkedGoal: string;
  isFavorite: boolean;
  checklist: { text: string; done: boolean }[];
  updatedAt: string;
}

const INITIAL_PREVIEW_GOALS: PreviewGoal[] = [
  {
    id: 'g-1',
    title: 'Prepare product launch roadmap',
    category: 'Projects',
    categoryColor: '#2563EB',
    priority: 'High',
    targetDate: '2026-11-15',
    status: 'In Progress',
  },
  {
    id: 'g-2',
    title: 'Establish morning running routine',
    category: 'Wellness',
    categoryColor: '#08C83D',
    priority: 'Medium',
    targetDate: '2026-12-01',
    status: 'In Progress',
  },
  {
    id: 'g-3',
    title: 'Complete foundational design system',
    category: 'Projects',
    categoryColor: '#2563EB',
    priority: 'High',
    targetDate: '2026-10-30',
    status: 'Completed',
  },
  {
    id: 'g-4',
    title: 'Organize personal digital library',
    category: 'Personal',
    categoryColor: '#8B5CF6',
    priority: 'Low',
    targetDate: '2026-12-20',
    status: 'Not Started',
  },
];

const INITIAL_PREVIEW_NOTES: PreviewNote[] = [
  {
    id: 'n-1',
    title: 'Sprint planning & deliverables',
    category: 'Projects',
    categoryColor: '#2563EB',
    linkedGoal: 'Prepare product launch roadmap',
    isFavorite: true,
    checklist: [
      { text: 'Finalize core user flows', done: true },
      { text: 'Review typography hierarchy', done: true },
      { text: 'Verify cross-browser responsiveness', done: false },
    ],
    updatedAt: 'Today',
  },
  {
    id: 'n-2',
    title: 'Weekly wellness milestones',
    category: 'Wellness',
    categoryColor: '#08C83D',
    linkedGoal: 'Establish morning running routine',
    isFavorite: false,
    checklist: [
      { text: 'Three 20-minute morning sessions', done: true },
      { text: 'Mobility and stretching routine', done: false },
    ],
    updatedAt: 'Yesterday',
  },
];

export const InterfacePreview: React.FC<InterfacePreviewProps> = ({
  onEnterWorkspace,
  onGetStarted,
}) => {
  const [activeTab, setActiveTab] = useState<PreviewTab>('goals');
  const [previewGoals, setPreviewGoals] = useState<PreviewGoal[]>(INITIAL_PREVIEW_GOALS);
  const [previewNotes, setPreviewNotes] = useState<PreviewNote[]>(INITIAL_PREVIEW_NOTES);

  // Purely in-memory client toggle for the interactive demonstration (never touches Supabase or localStorage)
  const toggleGoalStatus = (goalId: string) => {
    setPreviewGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const nextStatus =
          g.status === 'Completed' ? 'In Progress' : 'Completed';
        return { ...g, status: nextStatus };
      })
    );
  };

  const toggleChecklistItem = (noteId: string, itemIdx: number) => {
    setPreviewNotes((prev) =>
      prev.map((n) => {
        if (n.id !== noteId) return n;
        const newChecklist = n.checklist.map((item, idx) =>
          idx === itemIdx ? { ...item, done: !item.done } : item
        );
        return { ...n, checklist: newChecklist };
      })
    );
  };

  const toggleNoteFavorite = (noteId: string) => {
    setPreviewNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, isFavorite: !n.isFavorite } : n))
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-xl border border-[#E8E8EE] bg-white shadow-xs overflow-hidden transition-all text-left">
      {/* 1. Window Frame Bar */}
      <div className="bg-[#FAFAFC] border-b border-[#E8E8EE] px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {/* Subtle Window Dots */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E5E5EB]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#E5E5EB]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#E5E5EB]" />
          </div>
          <span className="text-[#8E8EA0] text-[11px] font-mono ml-2 hidden sm:inline">
            bucket.app / workspace
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[10px] text-[#8E8EA0] uppercase tracking-wider font-medium">
            Illustrative Preview
          </span>
          <button
            type="button"
            onClick={onEnterWorkspace}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#191927] hover:text-[#08C83D] transition-colors cursor-pointer"
          >
            <span>Open workspace</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Navigation Tabs */}
      <div className="border-b border-[#E8E8EE] px-4 sm:px-6 pt-3 pb-0 flex items-center justify-between gap-2 overflow-x-auto bg-white">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('goals')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'goals'
                ? 'border-[#191927] text-[#191927]'
                : 'border-transparent text-[#646477] hover:text-[#191927]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Goals</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'notes'
                ? 'border-[#191927] text-[#191927]'
                : 'border-transparent text-[#646477] hover:text-[#191927]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'border-[#191927] text-[#191927]'
                : 'border-transparent text-[#646477] hover:text-[#191927]'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-[#191927] text-[#191927]'
                : 'border-transparent text-[#646477] hover:text-[#191927]'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Categories</span>
          </button>
        </div>

        <span className="text-[11px] text-[#8E8EA0] hidden md:inline">
          Interactive demo · Click to explore
        </span>
      </div>

      {/* 3. Main Workspace Display Area */}
      <div className="p-4 sm:p-6 bg-[#FAFAFC]/50 min-h-[300px]">
        {/* VIEW 1: GOALS */}
        {activeTab === 'goals' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs text-[#646477] pb-1">
              <span className="font-medium text-[#191927]">Active Goals</span>
              <span>Click checkbox to toggle status</span>
            </div>

            <div className="bg-white rounded-lg border border-[#E8E8EE] divide-y divide-[#E8E8EE] overflow-hidden">
              {previewGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="px-3.5 py-3 flex items-center justify-between gap-3 hover:bg-[#FAFAFC] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleGoalStatus(goal.id)}
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        goal.status === 'Completed'
                          ? 'bg-[#08C83D] border-[#08C83D] text-white'
                          : 'border-[#D1D1DB] hover:border-[#191927] bg-white'
                      }`}
                      aria-label={`Toggle ${goal.title}`}
                    >
                      {goal.status === 'Completed' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-xs font-medium truncate ${
                          goal.status === 'Completed'
                            ? 'line-through text-[#8E8EA0]'
                            : 'text-[#191927]'
                        }`}
                      >
                        {goal.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-[#646477] mt-0.5">
                        <span className="flex items-center gap-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: goal.categoryColor }}
                          />
                          <span>{goal.category}</span>
                        </span>
                        <span>·</span>
                        <span
                          className={
                            goal.priority === 'High'
                              ? 'text-red-700 font-medium'
                              : goal.priority === 'Medium'
                              ? 'text-amber-700'
                              : 'text-[#646477]'
                          }
                        >
                          {goal.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div className="text-[11px] text-[#646477] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{goal.targetDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: NOTES */}
        {activeTab === 'notes' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs text-[#646477] pb-1">
              <span className="font-medium text-[#191927]">Connected Notes &amp; Checklists</span>
              <span>Click items to check off</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {previewNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-lg border border-[#E8E8EE] p-4 flex flex-col justify-between hover:border-[#D1D1DB] transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-[#191927] leading-snug">
                        {note.title}
                      </h4>
                      <button
                        type="button"
                        onClick={() => toggleNoteFavorite(note.id)}
                        className="text-[#8E8EA0] hover:text-amber-500 transition-colors p-0.5 cursor-pointer"
                        aria-label="Toggle favorite"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            note.isFavorite ? 'fill-amber-400 text-amber-500' : ''
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-[#646477] mt-1.5">
                      <Tag className="w-3 h-3" />
                      <span>Goal: {note.linkedGoal}</span>
                    </div>

                    {/* Interactive Checklist */}
                    <div className="mt-3 pt-2.5 border-t border-[#F0F0F4] space-y-1.5">
                      {note.checklist.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleChecklistItem(note.id, idx)}
                          className="w-full flex items-center gap-2 text-left text-xs cursor-pointer group"
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              item.done
                                ? 'bg-[#08C83D] border-[#08C83D] text-white'
                                : 'border-[#D1D1DB] group-hover:border-[#191927] bg-white'
                            }`}
                          >
                            {item.done && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                          </span>
                          <span
                            className={`truncate ${
                              item.done ? 'line-through text-[#8E8EA0]' : 'text-[#191927]'
                            }`}
                          >
                            {item.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-[#F0F0F4] flex items-center justify-between text-[10px] text-[#8E8EA0]">
                    <span className="flex items-center gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: note.categoryColor }}
                      />
                      <span>{note.category}</span>
                    </span>
                    <span>Updated {note.updatedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs text-[#646477] pb-1">
              <span className="font-medium text-[#191927]">Date-Linked Schedule</span>
              <span>Derived from goal target dates</span>
            </div>

            <div className="bg-white rounded-lg border border-[#E8E8EE] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[#191927]">
                <span>November 2026</span>
                <span className="text-[11px] font-normal text-[#646477]">Monthly View</span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[#8E8EA0] font-medium pb-1 border-b border-[#F0F0F4]">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Sample illustrative calendar mini grid */}
              <div className="grid grid-cols-7 gap-1.5 text-xs text-center">
                <div className="p-1.5 rounded text-[#8E8EA0]">1</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">2</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">3</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">4</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">5</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">6</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">7</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">8</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">9</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">10</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">11</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">12</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">13</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">14</div>
                {/* Active Goal Day */}
                <div className="p-1.5 rounded bg-blue-50 border border-blue-200 text-[#2563EB] font-bold relative">
                  <span>15</span>
                  <span className="block text-[8px] truncate mt-0.5 font-normal">
                    Roadmap
                  </span>
                </div>
                <div className="p-1.5 rounded text-[#8E8EA0]">16</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">17</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">18</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">19</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">20</div>
                <div className="p-1.5 rounded text-[#8E8EA0]">21</div>
              </div>

              <div className="text-[11px] text-[#646477] bg-[#FAFAFC] p-2.5 rounded-md border border-[#E8E8EE] flex items-center justify-between">
                <span>Goals with target dates automatically synchronize with your calendar.</span>
                <span className="text-[#191927] font-medium">No double entry</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs text-[#646477] pb-1">
              <span className="font-medium text-[#191927]">Domain Organization</span>
              <span>Color-coded focus areas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 bg-white rounded-lg border border-[#E8E8EE] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#2563EB]" />
                  <div>
                    <span className="text-xs font-semibold text-[#191927] block">Projects</span>
                    <span className="text-[11px] text-[#646477]">Work milestones &amp; launches</span>
                  </div>
                </div>
                <span className="text-xs text-[#8E8EA0]">Domain</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#E8E8EE] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#08C83D]" />
                  <div>
                    <span className="text-xs font-semibold text-[#191927] block">Wellness</span>
                    <span className="text-[11px] text-[#646477]">Health, habits &amp; fitness</span>
                  </div>
                </div>
                <span className="text-xs text-[#8E8EA0]">Domain</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#E8E8EE] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
                  <div>
                    <span className="text-xs font-semibold text-[#191927] block">Personal</span>
                    <span className="text-[11px] text-[#646477]">Books, ideas &amp; life plans</span>
                  </div>
                </div>
                <span className="text-xs text-[#8E8EA0]">Domain</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#E8E8EE] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                  <div>
                    <span className="text-xs font-semibold text-[#191927] block">Learning</span>
                    <span className="text-[11px] text-[#646477]">Courses, notes &amp; skills</span>
                  </div>
                </div>
                <span className="text-xs text-[#8E8EA0]">Domain</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Clarification & Navigation Bar */}
      <div className="px-4 sm:px-6 py-3 border-t border-[#E8E8EE] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#646477]">
        <div className="flex items-center gap-2 text-[11px]">
          <Layers className="w-3.5 h-3.5 text-[#8E8EA0]" />
          <span>Interactive preview · Zero data is written to your private account.</span>
        </div>

        {onGetStarted && (
          <button
            type="button"
            onClick={onGetStarted}
            className="inline-flex items-center gap-1.5 font-semibold text-[#191927] hover:text-[#08C83D] transition-colors cursor-pointer"
          >
            <span>Get started with Bucket</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

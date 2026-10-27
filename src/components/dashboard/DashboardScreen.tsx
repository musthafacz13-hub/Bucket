import React from 'react';
import { Goal, Note, OverviewMetrics } from '../../types';
import { MetricsGrid } from './MetricsGrid';
import { GoalProgress } from './GoalProgress';
import { RecentGoals } from './RecentGoals';
import { RecentNotes } from './RecentNotes';
import { UpcomingGoals } from './UpcomingGoals';
import { Plus } from 'lucide-react';

interface DashboardScreenProps {
  goals: Goal[];
  notes: Note[];
  metrics: OverviewMetrics;
  upcomingGoals: Goal[];
  recentGoals: Goal[];
  recentNotes: Note[];
  onNewGoal: () => void;
  onNewNote: () => void;
  onOpenDetails?: (goal: Goal) => void;
  onEditGoal: (goal: Goal) => void;
  onToggleComplete: (goalId: string) => void;
  onDeleteGoal: (goal: Goal) => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onToggleFavoriteNote: (noteId: string) => void;
  onExploreBucketList: () => void;
  onExploreNotes?: () => void;
  searchQuery: string;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  goals,
  metrics,
  upcomingGoals,
  recentGoals,
  recentNotes,
  onNewGoal,
  onNewNote,
  onOpenDetails,
  onEditGoal,
  onToggleComplete,
  onDeleteGoal,
  onEditNote,
  onDeleteNote,
  onToggleFavoriteNote,
  onExploreBucketList,
  onExploreNotes,
  searchQuery,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191927]">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#646477] mt-0.5">
            Your goals, notes, and progress in one place.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onNewNote}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#191927] bg-white border border-[#E8E8EE] rounded-lg hover:bg-[#F3F3F7] active:bg-[#EBEBEF] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#191927]"
          >
            <Plus className="w-3.5 h-3.5 text-[#646477]" />
            <span>New Note</span>
          </button>
          <button
            type="button"
            onClick={onNewGoal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#191927] hover:bg-[#2B2B40] active:bg-[#141420] rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#191927]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {/* Section A: Overview Metrics */}
      <MetricsGrid metrics={metrics} />

      {/* Section B: Goal Progress */}
      <GoalProgress metrics={metrics} />

      {/* Two-column layout for Recent Goals & Coming Up / Notes on wide screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Section C: Recent Goals */}
        <div className="lg:col-span-2 space-y-6">
          <RecentGoals
            goals={recentGoals}
            onNewGoal={onNewGoal}
            onOpenDetails={onOpenDetails}
            onEditGoal={onEditGoal}
            onToggleComplete={onToggleComplete}
            onDeleteGoal={onDeleteGoal}
            searchQuery={searchQuery}
          />

          {/* Section D: Recent Notes */}
          <RecentNotes
            notes={recentNotes}
            onNewNote={onNewNote}
            onEditNote={onEditNote}
            onDeleteNote={onDeleteNote}
            onToggleFavorite={onToggleFavoriteNote}
            onExploreNotes={onExploreNotes}
            searchQuery={searchQuery}
          />
        </div>

        {/* Right Column (1 span): Section E: Upcoming Goals */}
        <div className="lg:col-span-1 space-y-6">
          <UpcomingGoals
            upcomingGoals={upcomingGoals}
            onExploreBucketList={onExploreBucketList}
            onOpenDetails={onOpenDetails}
            onEditGoal={onEditGoal}
            onToggleComplete={onToggleComplete}
          />

          {/* Quick Helpful Context Card (Clean Notion-like workspace overview) */}
          <div className="p-4 rounded-xl border border-[#E8E8EE] bg-white text-xs text-[#646477] space-y-2">
            <div className="font-semibold text-[#191927]">Workspace Summary</div>
            <p className="leading-relaxed">
              Track lifelong aspirations, personal milestones, and quick captures. Everything is saved locally to your browser.
            </p>
            <div className="pt-2 border-t border-[#F0F0F4] flex items-center justify-between text-[11px] text-[#8E8EA0]">
              <span>Goals: {goals.length}</span>
              <span>Notes: {recentNotes.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

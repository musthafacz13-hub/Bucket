import React from 'react';
import { NavigationItem, Goal, Note } from '../../types';
import { LayoutDashboard, Plus, ArrowLeft } from 'lucide-react';

interface ComingSoonViewProps {
  section: NavigationItem;
  onNavigateDashboard: () => void;
  onNewGoal: () => void;
  onNewNote: () => void;
  goals: Goal[];
  notes: Note[];
}

export const ComingSoonView: React.FC<ComingSoonViewProps> = ({
  section,
  onNavigateDashboard,
  onNewGoal,
  onNewNote,
  goals,
}) => {
  const getSectionInfo = (item: NavigationItem) => {
    switch (item) {
      case 'bucket-list':
        return {
          title: 'Bucket List View',
          description:
            'A dedicated full-workspace list and board view for your bucket list items will be fully expanded in Phase 2.',
          actionText: 'New Goal',
          onAction: onNewGoal,
        };
      case 'notes':
        return {
          title: 'Notes Workspace',
          description:
            'The expanded long-form rich note management and archival system will be fully developed in Phase 2.',
          actionText: 'New Note',
          onAction: onNewNote,
        };
      case 'categories':
        return {
          title: 'Categories & Tags',
          description:
            'Custom category color-coding, nested hierarchies, and category-level goals will arrive in Phase 2.',
          actionText: 'Return to Dashboard',
          onAction: onNavigateDashboard,
        };
      case 'calendar':
        return {
          title: 'Target Calendar',
          description:
            'Monthly, weekly, and milestone timeline views for goal target dates will be delivered in Phase 2.',
          actionText: 'Return to Dashboard',
          onAction: onNavigateDashboard,
        };
      case 'analytics':
        return {
          title: 'Progress Analytics',
          description:
            'Historical completion trends, velocity metrics, and category distributions are planned for Phase 2.',
          actionText: 'Return to Dashboard',
          onAction: onNavigateDashboard,
        };
      case 'settings':
        return {
          title: 'Workspace Settings',
          description:
            'Local storage preferences, data export, and appearance customization will arrive in Phase 2.',
          actionText: 'Return to Dashboard',
          onAction: onNavigateDashboard,
        };
      default:
        return {
          title: 'Section',
          description: 'This section is planned for Phase 2.',
          actionText: 'Return to Dashboard',
          onAction: onNavigateDashboard,
        };
    }
  };

  const info = getSectionInfo(section);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Return button */}
      <button
        type="button"
        onClick={onNavigateDashboard}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#646477] hover:text-[#191927] transition-colors mb-6 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Dashboard</span>
      </button>

      {/* Main card */}
      <div className="bg-white border border-[#E8E8EE] rounded-xl p-8 sm:p-10 mb-8">
        <div className="max-w-xl">
          <span className="text-xs font-semibold text-[#646477] uppercase tracking-wider">
            Scope Notice · Future Phase
          </span>
          <h2 className="text-xl font-semibold text-[#191927] mt-2 mb-2">{info.title}</h2>
          <p className="text-sm text-[#646477] leading-relaxed mb-6">{info.description}</p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={info.onAction}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#191927] rounded-lg hover:bg-[#2B2B40] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{info.actionText}</span>
            </button>
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#191927] bg-[#FAFAFC] border border-[#E8E8EE] rounded-lg hover:bg-[#F3F3F7] transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#646477]" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

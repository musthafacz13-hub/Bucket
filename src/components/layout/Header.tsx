import React, { useState } from 'react';
import { NavigationItem } from '../../types';
import { Plus, Search, PanelLeft } from 'lucide-react';

interface HeaderProps {
  currentTab: NavigationItem;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenGlobalSearch: () => void;
  onOpenDrawer?: () => void;
  drawerTriggerRef?: React.RefObject<HTMLButtonElement | null>;
  onNewGoal: () => void;
  onNewNote: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenGlobalSearch,
  onOpenDrawer,
  drawerTriggerRef,
  onNewGoal,
  onNewNote,
}) => {
  const getTabTitle = (tab: NavigationItem) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard';
      case 'bucket-list':
        return 'Bucket List';
      case 'notes':
        return 'Notes';
      case 'categories':
        return 'Categories';
      case 'calendar':
        return 'Calendar';
      case 'analytics':
        return 'Analytics';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#E8E8EE] px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
      {/* Left: Open Notion on mobile / Workspace Breadcrumb on desktop */}
      <div className="flex items-center gap-2 min-w-0">
        {onOpenDrawer && (
          <button
            ref={drawerTriggerRef}
            type="button"
            onClick={onOpenDrawer}
            className="sm:hidden flex items-center gap-2 p-1 -ml-1 text-base font-bold tracking-tight text-[#191927] hover:text-[#3B3B52] active:opacity-75 transition-colors cursor-pointer bg-transparent border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] rounded"
            aria-label="Open Notion navigation drawer"
          >
            <PanelLeft className="w-4 h-4 text-[#646477] shrink-0" aria-hidden="true" />
            <span className="leading-none">Open Notion</span>
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2 min-w-0">
          <span className="text-xs text-[#8E8EA0]">Workspace</span>
          <span className="text-xs text-[#D0D0DC]">/</span>
          <h1 className="text-sm font-semibold text-[#191927] truncate">
            {getTabTitle(currentTab)}
          </h1>
        </div>
      </div>

      {/* Center / Search: Desktop Global Search trigger button */}
      <button
        type="button"
        onClick={onOpenGlobalSearch}
        className="flex-1 max-w-sm relative hidden sm:flex items-center justify-between pl-8 pr-2.5 py-1.5 text-xs text-[#8E8EA0] bg-[#FAFAFC] hover:bg-[#F3F3F7] border border-[#E8E8EE] hover:border-[#D0D0DC] rounded-lg transition-all text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927]"
        aria-label="Open search (Press Command K)"
      >
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8EA0] group-hover:text-[#191927] transition-colors pointer-events-none" />
        <span className="truncate">Search goals, notes, categories...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[#646477] bg-white border border-[#E8E8EE] rounded shadow-2xs shrink-0">
          <span className="text-[11px]">⌘</span>K
        </kbd>
      </button>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile search button */}
        <button
          type="button"
          onClick={onOpenGlobalSearch}
          className="sm:hidden p-2 text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Open search dialog"
          title="Search workspace"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onNewNote}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#191927] bg-white border border-[#E8E8EE] rounded-lg hover:bg-[#F3F3F7] active:bg-[#EBEBEF] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#191927] min-h-[34px]"
        >
          <Plus className="w-3.5 h-3.5 text-[#646477]" />
          <span>New Note</span>
        </button>

        <button
          type="button"
          onClick={onNewGoal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#191927] hover:bg-[#2B2B40] active:bg-[#141420] rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#191927] min-h-[34px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Goal</span>
        </button>
      </div>
    </header>
  );
};

import React, { useState, useRef } from 'react';
import { NavigationItem } from '../../types';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileDrawer } from './MobileDrawer';

import { AuthUser } from '../../services/authService';

interface AppShellProps {
  currentTab: NavigationItem;
  onSelectTab: (tab: NavigationItem) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenGlobalSearch: () => void;
  onNewGoal: () => void;
  onNewNote: () => void;
  goalCount: number;
  noteCount: number;
  categoryCount?: number;
  scheduledGoalCount?: number;
  onLoadFixtures: () => void;
  onClearData: () => void;
  onNavigateToLanding?: () => void;
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  onOpenGlobalSearch,
  onNewGoal,
  onNewNote,
  goalCount,
  noteCount,
  categoryCount,
  scheduledGoalCount,
  onLoadFixtures,
  onClearData,
  onNavigateToLanding,
  currentUser,
  onSignOut,
  children,
}) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const drawerTriggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#191927] flex flex-row antialiased">
      {/* Desktop Persistent Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        goalCount={goalCount}
        noteCount={noteCount}
        categoryCount={categoryCount}
        scheduledGoalCount={scheduledGoalCount}
        onOpenGlobalSearch={onOpenGlobalSearch}
        onLoadFixtures={onLoadFixtures}
        onClearData={onClearData}
        onNavigateToLanding={onNavigateToLanding}
        currentUser={currentUser}
        onSignOut={onSignOut}
      />

      {/* Main Workspace Canvas */}
      <div
        className="flex-1 flex flex-col min-w-0 pb-6 md:pb-8"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)',
        }}
      >
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onOpenGlobalSearch={onOpenGlobalSearch}
          onOpenDrawer={() => setIsMobileDrawerOpen(true)}
          drawerTriggerRef={drawerTriggerRef}
          onNewGoal={onNewGoal}
          onNewNote={onNewNote}
        />

        {/* Workspace Content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>

        {/* Mobile Slide-in Navigation Drawer ("Open Notion") */}
        <MobileDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          currentTab={currentTab}
          onSelectTab={onSelectTab}
          goalCount={goalCount}
          noteCount={noteCount}
          categoryCount={categoryCount}
          scheduledGoalCount={scheduledGoalCount}
          onOpenGlobalSearch={onOpenGlobalSearch}
          triggerRef={drawerTriggerRef}
          onNavigateToLanding={onNavigateToLanding}
          currentUser={currentUser}
          onSignOut={onSignOut}
        />
      </div>
    </div>
  );
};

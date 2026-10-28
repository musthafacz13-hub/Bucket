import React from 'react';
import { NavigationItem } from '../../types';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Tag,
  Calendar,
  BarChart2,
  Settings,
  Search,
  Home,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { AuthUser } from '../../services/authService';

interface SidebarProps {
  currentTab: NavigationItem;
  onSelectTab: (tab: NavigationItem) => void;
  goalCount: number;
  noteCount: number;
  categoryCount?: number;
  scheduledGoalCount?: number;
  onOpenGlobalSearch?: () => void;
  onNavigateToLanding?: () => void;
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  goalCount,
  noteCount,
  categoryCount,
  scheduledGoalCount,
  onOpenGlobalSearch,
  onNavigateToLanding,
  currentUser,
  onSignOut,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavigationItem,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'bucket-list' as NavigationItem,
      label: 'Bucket List',
      icon: CheckSquare,
      badge: goalCount > 0 ? goalCount : undefined,
    },
    {
      id: 'notes' as NavigationItem,
      label: 'Notes',
      icon: FileText,
      badge: noteCount > 0 ? noteCount : undefined,
    },
    {
      id: 'categories' as NavigationItem,
      label: 'Categories',
      icon: Tag,
      badge: categoryCount !== undefined && categoryCount > 0 ? categoryCount : undefined,
    },
    {
      id: 'calendar' as NavigationItem,
      label: 'Calendar',
      icon: Calendar,
      badge: scheduledGoalCount !== undefined && scheduledGoalCount > 0 ? scheduledGoalCount : undefined,
    },
    {
      id: 'analytics' as NavigationItem,
      label: 'Analytics',
      icon: BarChart2,
    },
    {
      id: 'settings' as NavigationItem,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside
      className="hidden md:flex flex-col w-64 bg-white border-r border-[#E8E8EE] h-screen sticky top-0 shrink-0 select-none"
      aria-label="Workspace Navigation"
    >
      {/* Brand / Wordmark */}
      <div className="h-14 px-5 flex items-center gap-2.5 border-b border-[#E8E8EE]">
        {/* Bucket Glyph / Minimalist Brand Icon */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#191927] text-white shrink-0"
          aria-hidden="true"
        >
          {/* Stylized bucket contour */}
          <svg
            className="w-4 h-4 text-white"
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
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-[#191927]">
            Bucket
          </span>
          <span className="text-[10px] text-[#646477] font-medium tracking-wide">
            Workspace
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main menu">
        {onOpenGlobalSearch && (
          <button
            type="button"
            onClick={onOpenGlobalSearch}
            className="w-full flex items-center justify-between px-3 py-2 mb-2 rounded-lg text-xs font-medium text-[#646477] bg-[#FAFAFC] hover:bg-[#F3F3F7] hover:text-[#191927] border border-[#E8E8EE] transition-colors group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927]"
            aria-label="Open search dialog (Press Command K)"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#8E8EA0] group-hover:text-[#191927] transition-colors" />
              <span>Search...</span>
            </div>
            <kbd className="text-[10px] text-[#8E8EA0] font-mono bg-white px-1.5 py-0.5 rounded border border-[#E8E8EE] shadow-2xs">
              ⌘K
            </kbd>
          </button>
        )}

        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#F3F3F7] text-[#191927] font-semibold'
                  : 'text-[#646477] hover:bg-[#FAFAFC] hover:text-[#191927]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#191927]' : 'text-[#8E8EA0]'
                  }`}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className="text-[11px] tabular-nums text-[#8E8EA0] px-1.5 py-0.2">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Account / Session Section */}
      {currentUser ? (
        <div className="px-3 pb-2 pt-1 border-t border-[#F0F0F4]">
          <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#FAFAFC] border border-[#E8E8EE]">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-6 h-6 rounded-full bg-[#191927] text-white flex items-center justify-center text-[10px] font-bold shrink-0"
                aria-hidden="true"
              >
                {(currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-semibold text-[#191927] truncate">
                  {currentUser.name || currentUser.email}
                </p>
                {currentUser.name && (
                  <p className="text-[10px] text-[#8E8EA0] truncate">{currentUser.email}</p>
                )}
              </div>
            </div>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="p-1 text-[#8E8EA0] hover:text-red-600 rounded transition-colors cursor-pointer shrink-0 ml-1"
                title="Sign out of Bucket"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : onNavigateToLanding ? (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={onNavigateToLanding}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#646477] hover:bg-[#FAFAFC] hover:text-[#191927] border border-[#E8E8EE] transition-colors cursor-pointer"
            title="Return to the Bucket public landing page"
          >
            <div className="flex items-center gap-2">
              <Home className="w-3.5 h-3.5 text-[#8E8EA0]" />
              <span>Landing Page</span>
            </div>
            <span className="text-[10px] text-[#8E8EA0] font-medium">Home</span>
          </button>
        </div>
      ) : null}

    </aside>
  );
};

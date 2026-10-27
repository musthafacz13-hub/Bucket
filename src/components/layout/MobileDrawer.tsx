import React, { useEffect, useRef } from 'react';
import { NavigationItem } from '../../types';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Tag,
  Calendar,
  BarChart2,
  Settings,
  X,
  Search,
  Home,
  LogOut,
} from 'lucide-react';
import { AuthUser } from '../../services/authService';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: NavigationItem;
  onSelectTab: (tab: NavigationItem) => void;
  goalCount: number;
  noteCount: number;
  categoryCount?: number;
  scheduledGoalCount?: number;
  onOpenGlobalSearch?: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  onNavigateToLanding?: () => void;
  currentUser?: AuthUser | null;
  onSignOut?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  goalCount,
  noteCount,
  categoryCount,
  scheduledGoalCount,
  onOpenGlobalSearch,
  triggerRef,
  onNavigateToLanding,
  currentUser,
  onSignOut,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Prevent background scrolling while drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Focus trap, Escape listener, and restore focus to trigger
  useEffect(() => {
    if (!isOpen) return;

    // Focus close button initially
    const closeBtn = drawerRef.current?.querySelector<HTMLElement>('button[aria-label="Close navigation drawer"]');
    closeBtn?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const drawer = drawerRef.current;
        if (!drawer) return;

        const focusable = drawer.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to trigger
      if (triggerRef?.current && document.contains(triggerRef.current)) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const navItems = [
    {
      id: 'dashboard' as NavigationItem,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'bucket-list' as NavigationItem,
      label: 'Goals',
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
    <div
      className="md:hidden fixed inset-0 z-50 bg-[#191927]/50 backdrop-blur-xs flex animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Workspace navigation drawer"
    >
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        className="w-72 max-w-[85vw] bg-white h-full border-r border-[#E8E8EE] shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
        }}
      >
        <div className="flex flex-col">
          {/* Drawer Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-[#E8E8EE]">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#191927] text-white shrink-0"
                aria-hidden="true"
              >
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
                <span className="text-sm font-semibold tracking-tight text-[#191927]">Bucket</span>
                <span className="text-[10px] text-[#646477] font-medium tracking-wide">Workspace</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927]"
              aria-label="Close navigation drawer"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Search Shortcut Button */}
          {onOpenGlobalSearch && (
            <div className="p-3 pb-1 border-b border-[#F0F0F4]">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGlobalSearch();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#646477] bg-[#FAFAFC] hover:bg-[#F3F3F7] hover:text-[#191927] border border-[#E8E8EE] transition-colors group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927]"
                aria-label="Open global search (⌘K)"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-[#8E8EA0] group-hover:text-[#191927] transition-colors" />
                  <span>Search workspace...</span>
                </div>
                <kbd className="text-[10px] text-[#8E8EA0] font-mono bg-white px-1.5 py-0.5 rounded border border-[#E8E8EE]">
                  ⌘K
                </kbd>
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1" aria-label="Mobile workspace menu">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors min-h-[44px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] ${
                    isActive
                      ? 'bg-[#F3F3F7] text-[#191927] font-semibold'
                      : 'text-[#646477] hover:bg-[#FAFAFC] hover:text-[#191927]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-3">
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
            <div className="px-3 pb-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAFAFC] border border-[#E8E8EE]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full bg-[#191927] text-white flex items-center justify-center text-xs font-bold shrink-0"
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
                    onClick={() => {
                      onClose();
                      onSignOut();
                    }}
                    className="p-1.5 text-[#8E8EA0] hover:text-red-600 rounded transition-colors cursor-pointer shrink-0 ml-1"
                    title="Sign out of Bucket"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : onNavigateToLanding ? (
            <div className="px-3 pb-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToLanding();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-[#646477] hover:bg-[#FAFAFC] hover:text-[#191927] border border-[#E8E8EE] transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <Home className="w-4 h-4 text-[#8E8EA0]" />
                  <span>Landing Page</span>
                </div>
                <span className="text-[10px] text-[#8E8EA0]">Home</span>
              </button>
            </div>
          ) : null}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#E8E8EE] bg-[#FAFAFC] text-[11px] text-[#8E8EA0] flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span>Bucket Workspace</span>
            <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-[#E8E8EE] text-[#646477]">
              v1.0
            </span>
          </div>
          <span className="text-[10px] text-[#A0A0B5]">Stored locally in browser</span>
        </div>
      </div>
    </div>
  );
};

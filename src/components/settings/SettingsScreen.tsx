import React, { useState, useId, useEffect, useRef } from 'react';
import {
  WorkspacePreferences,
  ThemeMode,
  getStorageUsageEstimate,
} from '../../utils/storage';
import { CalendarViewMode } from '../calendar/CalendarScreen';
import {
  Sun,
  Moon,
  Laptop,
  Calendar,
  FileText,
  Trash2,
  AlertTriangle,
  HardDrive,
  UserRound,
  Mail,
  LogOut,
  Save,
  RotateCcw,
} from 'lucide-react';
import type { AuthUser } from '../../services/authService';

interface SettingsScreenProps {
  preferences: WorkspacePreferences;
  onUpdatePreferences: (updated: Partial<WorkspacePreferences>) => void;
  goalCount: number;
  noteCount: number;
  categoryCount: number;
  onClearWorkspaceData: () => void;
  currentUser: AuthUser | null;
  onUpdateProfile: (name: string, email: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  onSignOut: () => Promise<void>;
  onClearCache: () => number;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  preferences,
  onUpdatePreferences,
  goalCount,
  noteCount,
  categoryCount,
  onClearWorkspaceData,
  currentUser,
  onUpdateProfile,
  onSignOut,
  onClearCache,
}) => {
  // Confirmation Modal States
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);

  useEffect(() => {
    setProfileName(currentUser?.name || '');
    setProfileEmail(currentUser?.email || '');
  }, [currentUser]);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSavingProfile) return;
    setIsSavingProfile(true);
    setProfileMessage(null);
    const result = await onUpdateProfile(profileName, profileEmail);
    setProfileMessage(result.success ? 'Profile updated.' : result.error || 'Profile could not be updated.');
    setIsSavingProfile(false);
  };

  const handleClearCache = () => {
    const removed = onClearCache();
    setCacheMessage(removed ? `Cleared ${removed} disposable cache item${removed === 1 ? '' : 's'}.` : 'No disposable cache was stored. Your saved workspace data was kept.');
  };

  // Storage usage estimate
  const storageStats = getStorageUsageEstimate();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6 animate-in fade-in duration-150">
      {/* Title */}
      <div className="border-b border-[#E8E8EE] pb-5">
        <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#8E8EA0] mb-2">Workspace controls</p>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#191927] tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-[#646477] mt-1">
          Customize workspace appearance, defaults, and manage local browser storage.
        </p>
      </div>

      {/* 1. Profile */}
      <section className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8E8EE] shadow-[0_14px_36px_-28px_rgba(25,25,39,0.55)] space-y-5" aria-labelledby="profile-heading">
        <div className="flex items-start justify-between gap-4 border-b border-[#F0F0F4] pb-3">
          <div>
            <h2 id="profile-heading" className="text-sm font-semibold text-[#191927]">Profile</h2>
            <p className="text-xs text-[#646477] mt-0.5">Manage the account currently signed in to Bucket.</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#191927] text-white flex items-center justify-center text-sm font-semibold shrink-0" aria-hidden="true">
            {(profileName || profileEmail || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#191927]"><UserRound className="w-3.5 h-3.5 text-[#8E8EA0]" /> Display name</span>
              <input value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={120} placeholder="Your name" className="w-full rounded-lg border border-[#E8E8EE] bg-white px-3 py-2 text-sm text-[#191927] outline-none focus:border-[#191927]" />
            </label>
            <label className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#191927]"><Mail className="w-3.5 h-3.5 text-[#8E8EA0]" /> Email</span>
              <input type="email" value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} required maxLength={254} className="w-full rounded-lg border border-[#E8E8EE] bg-white px-3 py-2 text-sm text-[#191927] outline-none focus:border-[#191927]" />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" disabled={isSavingProfile || !profileEmail.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#191927] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2C2C3F] disabled:cursor-not-allowed disabled:opacity-50">
              <Save className="w-3.5 h-3.5" /> {isSavingProfile ? 'Saving...' : 'Save profile'}
            </button>
            <button type="button" onClick={() => void onSignOut()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E8EE] bg-white px-3 py-2 text-xs font-semibold text-[#646477] hover:text-[#191927]">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
            {profileMessage && <span className="text-xs text-[#646477]" role="status">{profileMessage}</span>}
          </div>
        </form>
        <p className="text-[11px] leading-5 text-[#8E8EA0]">Email changes may require confirmation from the new address. Account deletion is not offered here because this frontend has no secure server-side deletion operation.</p>
      </section>

      {/* 2. Appearance Section */}
      <section className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8E8EE] shadow-[0_14px_36px_-28px_rgba(25,25,39,0.55)] space-y-5" aria-labelledby="appearance-heading">
        <div className="border-b border-[#F0F0F4] pb-3">
          <h2 id="appearance-heading" className="text-sm font-semibold text-[#191927]">
            Appearance & Theme
          </h2>
          <p className="text-xs text-[#646477] mt-0.5">
            Select your preferred interface color mode.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Light Theme Option */}
          <button
            type="button"
            onClick={() => onUpdatePreferences({ theme: 'light' })}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] ${
              preferences.theme === 'light'
                ? 'bg-[#F5F5FA] border-[#191927] ring-1 ring-[#191927] shadow-xs'
                : 'bg-white border-[#E8E8EE] hover:border-[#191927]/40'
            }`}
            aria-pressed={preferences.theme === 'light'}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Sun className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#191927]">Light</div>
              <p className="text-[11px] text-[#646477] mt-0.5">
                Crisp, white-first minimal layout.
              </p>
            </div>
          </button>

          {/* Dark Theme Option */}
          <button
            type="button"
            onClick={() => onUpdatePreferences({ theme: 'dark' })}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] ${
              preferences.theme === 'dark'
                ? 'bg-[#F5F5FA] border-[#191927] ring-1 ring-[#191927] shadow-xs'
                : 'bg-white border-[#E8E8EE] hover:border-[#191927]/40'
            }`}
            aria-pressed={preferences.theme === 'dark'}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
              <Moon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#191927]">Dark</div>
              <p className="text-[11px] text-[#646477] mt-0.5">
                Low-light dark palette.
              </p>
            </div>
          </button>

          {/* System Theme Option */}
          <button
            type="button"
            onClick={() => onUpdatePreferences({ theme: 'system' })}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] ${
              preferences.theme === 'system'
                ? 'bg-[#F5F5FA] border-[#191927] ring-1 ring-[#191927] shadow-xs'
                : 'bg-white border-[#E8E8EE] hover:border-[#191927]/40'
            }`}
            aria-pressed={preferences.theme === 'system'}
          >
            <div className="w-8 h-8 rounded-lg bg-[#FAFAFC] border border-[#E8E8EE] flex items-center justify-center text-[#646477] shrink-0">
              <Laptop className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#191927]">System</div>
              <p className="text-[11px] text-[#646477] mt-0.5">
                Syncs with OS appearance.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* 2. Workspace Defaults */}
      <section className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8E8EE] shadow-[0_14px_36px_-28px_rgba(25,25,39,0.55)] space-y-5" aria-labelledby="preferences-heading">
        <div className="border-b border-[#F0F0F4] pb-3">
          <h2 id="preferences-heading" className="text-sm font-semibold text-[#191927]">
            Workspace Defaults
          </h2>
          <p className="text-xs text-[#646477] mt-0.5">
            Configure initial screen layouts and views.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Default Calendar View */}
          <div className="p-4 rounded-xl border border-[#E8E8EE] bg-[#FAFAFC] space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#8E8EA0]" aria-hidden="true" />
              <label htmlFor="calendar-view-select" className="text-xs font-semibold text-[#191927]">
                Default Calendar View
              </label>
            </div>
            <p className="text-[11px] text-[#646477]">
              Initial view mode when opening the Calendar screen.
            </p>
            <div className="inline-flex items-center p-1 bg-white rounded-lg border border-[#E8E8EE] w-full text-xs mt-2">
              {(
                [
                  { id: 'month', label: 'Month' },
                  { id: 'week', label: 'Week' },
                  { id: 'day', label: 'Day' },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onUpdatePreferences({ defaultCalendarView: v.id })}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] ${
                    preferences.defaultCalendarView === v.id
                      ? 'bg-[#191927] text-white shadow-2xs'
                      : 'text-[#646477] hover:text-[#191927]'
                  }`}
                  aria-pressed={preferences.defaultCalendarView === v.id}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Default Notes View */}
          <div className="p-4 rounded-xl border border-[#E8E8EE] bg-[#FAFAFC] space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#8E8EA0]" aria-hidden="true" />
              <span className="text-xs font-semibold text-[#191927]">
                Default Notes Layout
              </span>
            </div>
            <p className="text-[11px] text-[#646477]">
              Initial layout style when navigating to Notes.
            </p>
            <div className="inline-flex items-center p-1 bg-white rounded-lg border border-[#E8E8EE] w-full text-xs mt-2">
              {(
                [
                  { id: 'grid', label: 'Card Grid' },
                  { id: 'list', label: 'Compact List' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onUpdatePreferences({ defaultNotesView: m.id })}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] ${
                    preferences.defaultNotesView === m.id
                      ? 'bg-[#191927] text-white shadow-2xs'
                      : 'text-[#646477] hover:text-[#191927]'
                  }`}
                  aria-pressed={preferences.defaultNotesView === m.id}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Local Data & Storage */}
      <section className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8E8EE] shadow-[0_14px_36px_-28px_rgba(25,25,39,0.55)] space-y-5" aria-labelledby="storage-heading">
        <div className="border-b border-[#F0F0F4] pb-3">
          <h2 id="storage-heading" className="text-sm font-semibold text-[#191927]">
            Local Data & Privacy
          </h2>
          <p className="text-xs text-[#646477] mt-0.5">
            Bucket uses Supabase for signed-in workspace data and keeps only selected state in this browser.
          </p>
        </div>

        {/* Informational Callout */}
        <div className="p-4 bg-[#FAFAFC] border border-[#E8E8EE] rounded-xl flex items-start gap-3 text-xs text-[#646477]">
          <HardDrive className="w-4 h-4 text-[#8E8EA0] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold text-[#191927]">Bucket&apos;s local browser storage</p>
            <p className="leading-relaxed">
              This estimate covers Bucket-owned persistent localStorage records only. It does not measure laptop storage, browser-wide cache, sessionStorage, IndexedDB, or Cache Storage.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#E8E8EE] bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[#191927] flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5 text-[#646477]" /> Clear disposable cache</div>
            <p className="text-[11px] text-[#646477] mt-1">Removes only keys explicitly marked as temporary. It does not sign you out or delete workspace records.</p>
          </div>
          <button type="button" onClick={handleClearCache} className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#191927] bg-white hover:bg-[#F3F3F7] border border-[#E8E8EE] rounded-lg">
            Clear Cache
          </button>
          {cacheMessage && <span className="text-[11px] text-[#646477]" role="status">{cacheMessage}</span>}
        </div>

        {/* Storage Usage Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 bg-white border border-[#E8E8EE] rounded-xl text-center">
            <span className="text-[11px] text-[#8E8EA0]">Workspace goals</span>
            <div className="text-base font-semibold text-[#191927] tabular-nums mt-0.5">
              {goalCount}
            </div>
          </div>
          <div className="p-3 bg-white border border-[#E8E8EE] rounded-xl text-center">
            <span className="text-[11px] text-[#8E8EA0]">Workspace notes</span>
            <div className="text-base font-semibold text-[#191927] tabular-nums mt-0.5">
              {noteCount}
            </div>
          </div>
          <div className="p-3 bg-white border border-[#E8E8EE] rounded-xl text-center">
            <span className="text-[11px] text-[#8E8EA0]">Categories</span>
            <div className="text-base font-semibold text-[#191927] tabular-nums mt-0.5">
              {categoryCount}
            </div>
          </div>
          <div className="p-3 bg-white border border-[#E8E8EE] rounded-xl text-center">
            <span className="text-[11px] text-[#8E8EA0]">Bucket local data</span>
            <div className="text-base font-semibold text-[#191927] tabular-nums mt-0.5">
              {storageStats.available ? storageStats.formattedSize : 'Unavailable'}
            </div>
          </div>
        </div>

        {/* Destructive Actions Area */}
        <div className="pt-4 border-t border-[#F0F0F4] space-y-3">
          <span className="text-xs font-semibold text-[#191927]">Workspace Actions</span>

          <div className="grid grid-cols-1 gap-3">
            {/* Clear All Data */}
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/20 flex flex-col justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Clear Workspace Data</span>
                </div>
                <p className="text-[11px] text-[#646477] mt-1">
                  Permanently delete all goals, notes, and categories from this browser.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-white hover:bg-red-50 active:bg-red-100 border border-red-300 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <span>Clear All Data...</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Confirmation Modal: Clear All Data */}
      {isClearModalOpen && (
        <ClearDataModal
          isOpen={isClearModalOpen}
          onClose={() => setIsClearModalOpen(false)}
          onConfirm={() => {
            setIsClearModalOpen(false);
            onClearWorkspaceData();
          }}
          totalItems={goalCount + noteCount + categoryCount}
        />
      )}

    </div>
  );
};

/**
 * Clear Data Confirmation Modal with explicit checkbox requirement
 */
const ClearDataModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalItems: number;
}> = ({ isOpen, onClose, onConfirm, totalItems }) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#191927]/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-modal-title"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-[#E8E8EE] shadow-2xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 id="clear-modal-title" className="text-sm font-semibold text-[#191927]">
              Clear Workspace Data?
            </h3>
            <p className="text-xs text-[#646477] mt-1 leading-relaxed">
              This action will permanently delete all {totalItems} items (goals, notes, and custom categories) stored in this browser.
            </p>
          </div>
        </div>

        <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
          <p className="font-semibold">Irreversible Action</p>
          <p className="text-[11px] text-red-700 leading-relaxed">
            There is no server or cloud backup to restore your data once cleared.
          </p>
        </div>

        <label className="flex items-start gap-2.5 text-xs text-[#191927] cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="w-4 h-4 rounded text-red-600 focus:ring-red-500 mt-0.5 cursor-pointer"
          />
          <span className="leading-snug">
            I understand that all local data will be permanently erased.
          </span>
        </label>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F0F4]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-[#646477] hover:text-[#191927] bg-[#FAFAFC] hover:bg-[#F3F3F7] rounded-lg border border-[#E8E8EE] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!acknowledged}
            onClick={onConfirm}
            className="px-4 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
          >
            Permanently Clear Data
          </button>
        </div>
      </div>
    </div>
  );
};

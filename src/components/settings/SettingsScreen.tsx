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
  Database,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  X,
  HardDrive,
  Info,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { ReplaceTurnstileModal } from './ReplaceTurnstileModal';
import { getTurnstileSiteKey } from '../auth/TurnstileWidget';

interface SettingsScreenProps {
  preferences: WorkspacePreferences;
  onUpdatePreferences: (updated: Partial<WorkspacePreferences>) => void;
  goalCount: number;
  noteCount: number;
  categoryCount: number;
  onClearWorkspaceData: () => void;
  onResetWorkspaceData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  preferences,
  onUpdatePreferences,
  goalCount,
  noteCount,
  categoryCount,
  onClearWorkspaceData,
  onResetWorkspaceData,
}) => {
  // Confirmation Modal States
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isReplaceTurnstileModalOpen, setIsReplaceTurnstileModalOpen] = useState(false);
  const [turnstileConfigStatus, setTurnstileConfigStatus] = useState<'configured' | 'cleared'>(() =>
    getTurnstileSiteKey() ? 'configured' : 'cleared'
  );

  // Storage usage estimate
  const storageStats = getStorageUsageEstimate();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Title */}
      <div className="border-b border-[#E8E8EE] pb-5">
        <h1 className="text-xl sm:text-2xl font-semibold text-[#191927] tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-[#646477] mt-1">
          Customize workspace appearance, defaults, and manage local browser storage.
        </p>
      </div>

      {/* 1. Appearance Section */}
      <section className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8E8EE] space-y-4" aria-labelledby="appearance-heading">
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
      <section className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8E8EE] space-y-4" aria-labelledby="preferences-heading">
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

      {/* 3. Security & Bot Protection (Cloudflare Turnstile) */}
      <section className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8E8EE] space-y-4" aria-labelledby="security-heading">
        <div className="border-b border-[#F0F0F4] pb-3">
          <h2 id="security-heading" className="text-sm font-semibold text-[#191927]">
            Security &amp; Bot Protection
          </h2>
          <p className="text-xs text-[#646477] mt-0.5">
            Cloudflare Turnstile CAPTCHA protects authentication endpoints from automated abuse.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#E8E8EE] bg-[#FAFAFC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#08C83D] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#191927]">
                Cloudflare Turnstile Integration
              </div>
              <p className="text-[11px] text-[#646477] mt-0.5">
                {turnstileConfigStatus === 'configured'
                  ? 'Configured and active via VITE_TURNSTILE_SITE_KEY.'
                  : 'Configuration cleared. Ready to accept new VITE_TURNSTILE_SITE_KEY.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsReplaceTurnstileModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#191927] bg-white hover:bg-[#F3F3F7] active:bg-[#EBEBEF] border border-[#E8E8EE] rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927]"
          >
            <span>Replace CAPTCHA Configuration...</span>
          </button>
        </div>
      </section>

      {/* 4. Local Data & Storage */}
      <section className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8E8EE] space-y-4" aria-labelledby="storage-heading">
        <div className="border-b border-[#F0F0F4] pb-3">
          <h2 id="storage-heading" className="text-sm font-semibold text-[#191927]">
            Local Data & Privacy
          </h2>
          <p className="text-xs text-[#646477] mt-0.5">
            Bucket keeps 100% of your personal workspace data stored locally in this browser.
          </p>
        </div>

        {/* Informational Callout */}
        <div className="p-4 bg-[#FAFAFC] border border-[#E8E8EE] rounded-xl flex items-start gap-3 text-xs text-[#646477]">
          <HardDrive className="w-4 h-4 text-[#8E8EA0] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold text-[#191927]">Offline & Private Local Storage</p>
            <p className="leading-relaxed">
              Your goals, notes, categories, and settings are saved directly in your browser's Local Storage. No external servers or cloud accounts are used.
            </p>
          </div>
        </div>

        {/* Storage Usage Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 bg-white border border-[#E8E8EE] rounded-xl text-center">
            <span className="text-[11px] text-[#8E8EA0]">Stored Goals</span>
            <div className="text-base font-semibold text-[#191927] tabular-nums mt-0.5">
              {goalCount}
            </div>
          </div>
          <div className="p-3 bg-white border border-[#E8E8EE] rounded-xl text-center">
            <span className="text-[11px] text-[#8E8EA0]">Stored Notes</span>
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
            <span className="text-[11px] text-[#8E8EA0]">Estimated Size</span>
            <div className="text-base font-semibold text-[#191927] tabular-nums mt-0.5">
              {storageStats.formattedSize}
            </div>
          </div>
        </div>

        {/* Destructive Actions Area */}
        <div className="pt-4 border-t border-[#F0F0F4] space-y-3">
          <span className="text-xs font-semibold text-[#191927]">Workspace Actions</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Reset to Sample Fixtures */}
            <div className="p-4 rounded-xl border border-[#E8E8EE] bg-white flex flex-col justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[#191927] flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-[#646477]" />
                  <span>Reset to Sample Data</span>
                </div>
                <p className="text-[11px] text-[#646477] mt-1">
                  Replace current workspace data with fresh sample goals, notes, and categories.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#191927] bg-[#FAFAFC] hover:bg-[#F3F3F7] active:bg-[#EBEBEF] border border-[#E8E8EE] rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927]"
              >
                <span>Reset to Sample Data...</span>
              </button>
            </div>

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

      {/* Confirmation Modal: Replace Cloudflare Turnstile Configuration */}
      {isReplaceTurnstileModalOpen && (
        <ReplaceTurnstileModal
          isOpen={isReplaceTurnstileModalOpen}
          onClose={() => setIsReplaceTurnstileModalOpen(false)}
          currentSiteKey={getTurnstileSiteKey()}
          onConfirm={() => {
            setIsReplaceTurnstileModalOpen(false);
            setTurnstileConfigStatus('cleared');
          }}
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

/**
 * Reset Data Confirmation Modal
 */
const ResetDataModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
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
      aria-labelledby="reset-modal-title"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-[#E8E8EE] shadow-2xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 id="reset-modal-title" className="text-sm font-semibold text-[#191927]">
              Reset to Sample Data?
            </h3>
            <p className="text-xs text-[#646477] mt-1 leading-relaxed">
              This will replace all goals, notes, and categories currently in your workspace with Bucket's default sample fixture items.
            </p>
          </div>
        </div>

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
            onClick={onConfirm}
            className="px-4 py-1.5 text-xs font-medium text-white bg-[#191927] hover:bg-[#2B2B40] active:bg-[#141420] rounded-lg transition-colors cursor-pointer"
          >
            Confirm Reset
          </button>
        </div>
      </div>
    </div>
  );
};

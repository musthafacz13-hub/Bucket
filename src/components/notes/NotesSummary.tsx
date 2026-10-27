import React, { useMemo } from 'react';
import { Note } from '../../types';
import { calculateNoteMetrics } from '../../utils/calculations';
import { FileText, Star, Clock, Type } from 'lucide-react';

interface NotesSummaryProps {
  notes: Note[];
}

export const NotesSummary: React.FC<NotesSummaryProps> = ({ notes }) => {
  const metrics = useMemo(() => calculateNoteMetrics(notes), [notes]);

  const totalWords = useMemo(() => {
    return notes.reduce((acc, note) => {
      if (!note.content) return acc;
      const words = note.content.trim().split(/\s+/).filter(Boolean).length;
      return acc + words;
    }, 0);
  }, [notes]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Total Notes */}
      <div className="bg-white p-4 rounded-xl border border-[#E8E8EE] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#646477] mb-2">
          <span className="text-xs font-medium">Total Notes</span>
          <FileText className="w-4 h-4 text-[#8E8EA0]" aria-hidden="true" />
        </div>
        <div>
          <span className="text-2xl font-bold tracking-tight text-[#191927] tabular-nums">
            {metrics.totalNotes}
          </span>
          <span className="text-[11px] text-[#8E8EA0] ml-2">documents</span>
        </div>
      </div>

      {/* Favorites */}
      <div className="bg-white p-4 rounded-xl border border-[#E8E8EE] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#646477] mb-2">
          <span className="text-xs font-medium">Favorites</span>
          <Star className="w-4 h-4 text-[#191927]" fill="#F9E94E" aria-hidden="true" />
        </div>
        <div>
          <span className="text-2xl font-bold tracking-tight text-[#191927] tabular-nums">
            {metrics.favoritesCount}
          </span>
          <span className="text-[11px] text-[#8E8EA0] ml-2">starred</span>
        </div>
      </div>

      {/* Recently Active */}
      <div className="bg-white p-4 rounded-xl border border-[#E8E8EE] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#646477] mb-2">
          <span className="text-xs font-medium">Recent (7d)</span>
          <Clock className="w-4 h-4 text-[#08C83D]" aria-hidden="true" />
        </div>
        <div>
          <span className="text-2xl font-bold tracking-tight text-[#191927] tabular-nums">
            {metrics.recentlyUpdatedCount}
          </span>
          <span className="text-[11px] text-[#8E8EA0] ml-2">updated</span>
        </div>
      </div>

      {/* Words Captured */}
      <div className="bg-white p-4 rounded-xl border border-[#E8E8EE] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#646477] mb-2">
          <span className="text-xs font-medium">Total Words</span>
          <Type className="w-4 h-4 text-[#8E8EA0]" aria-hidden="true" />
        </div>
        <div>
          <span className="text-2xl font-bold tracking-tight text-[#191927] tabular-nums">
            {totalWords.toLocaleString()}
          </span>
          <span className="text-[11px] text-[#8E8EA0] ml-2">words written</span>
        </div>
      </div>
    </div>
  );
};

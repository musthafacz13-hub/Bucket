import React from 'react';

interface CategoryTagProps {
  category: string;
  color?: string;
  className?: string;
}

/**
 * Maps categories to the approved 6-color reference palette:
 * - PINK: #F6C6DA (Personal, Creative, Lifestyle)
 * - LIGHT BLUE: #A9C9F5 (Learning, Skills, Technology)
 * - YELLOW: #F9E94E (Adventure, Travel, Experiences)
 * - GREEN: #08C83D (Fitness, Health, Wellness)
 * - DARK NAVY: #191927 (Career, Financial, General)
 *
 * Adheres strictly to Zero-Pill discipline: unboxed text with a subtle dot accent.
 */
export function getCategoryAccentColor(category: string): string {
  const norm = category.toLowerCase().trim();
  if (norm.includes('creative') || norm.includes('personal') || norm.includes('art') || norm.includes('life')) {
    return '#F6C6DA'; // Approved Pink
  }
  if (norm.includes('learn') || norm.includes('skill') || norm.includes('read') || norm.includes('code')) {
    return '#A9C9F5'; // Approved Light Blue
  }
  if (norm.includes('travel') || norm.includes('adventure') || norm.includes('explore') || norm.includes('trip')) {
    return '#F9E94E'; // Approved Yellow
  }
  if (norm.includes('fit') || norm.includes('health') || norm.includes('sport') || norm.includes('run')) {
    return '#08C83D'; // Approved Green
  }
  return '#191927'; // Approved Dark Navy
}

export const CategoryTag: React.FC<CategoryTagProps> = ({ category, color, className = '' }) => {
  const trimmed = category ? category.trim() : '';

  if (!trimmed || trimmed.toLowerCase() === 'unassigned') {
    return (
      <span
        className={`inline-flex items-center text-xs text-[#8E8EA0] italic ${className}`}
        title="Unassigned category"
      >
        <span>Unassigned</span>
      </span>
    );
  }

  const accentColor = color || getCategoryAccentColor(trimmed);

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs text-[#191927] font-medium ${className}`}
      title={`Category: ${trimmed}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0 border border-[#191927]/15"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />
      <span>{trimmed}</span>
    </span>
  );
};

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  heading: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  heading,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#E8E8EE] rounded-xl bg-[#FAFAFC] ${className}`}
    >
      {Icon && (
        <div className="w-10 h-10 mb-3 rounded-lg flex items-center justify-center text-[#646477] bg-white border border-[#E8E8EE]">
          <Icon className="w-5 h-5 text-[#646477]" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-[#191927] mb-1">{heading}</h3>
      <p className="text-xs text-[#646477] max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-medium text-[#191927] bg-white border border-[#E8E8EE] rounded-lg hover:bg-[#F3F3F7] active:bg-[#EBEBEF] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191927]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

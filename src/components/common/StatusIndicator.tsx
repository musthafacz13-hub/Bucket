import React from 'react';
import { GoalStatus, GoalPriority } from '../../types';
import { Check, Clock, CircleDot } from 'lucide-react';

interface StatusIndicatorProps {
  status: GoalStatus;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'Completed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium text-[#191927] ${className}`}
          title="Status: Completed"
        >
          <span
            className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-[#08C83D] text-white shrink-0"
            aria-hidden="true"
          >
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </span>
          <span>Completed</span>
        </span>
      );
    case 'In Progress':
      return (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium text-[#191927] ${className}`}
          title="Status: In Progress"
        >
          <span
            className="w-3.5 h-3.5 rounded-full flex items-center justify-center border border-[#191927] text-[#191927] shrink-0"
            style={{ backgroundColor: '#A9C9F5' }}
            aria-hidden="true"
          >
            <Clock className="w-2.5 h-2.5 stroke-[2.5]" />
          </span>
          <span>In Progress</span>
        </span>
      );
    case 'Not Started':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium text-[#646477] ${className}`}
          title="Status: Not Started"
        >
          <span
            className="w-3.5 h-3.5 rounded-full flex items-center justify-center border border-[#E8E8EE] bg-white text-[#646477] shrink-0"
            aria-hidden="true"
          >
            <CircleDot className="w-2.5 h-2.5 stroke-[2]" />
          </span>
          <span>Not Started</span>
        </span>
      );
  }
};

interface PriorityIndicatorProps {
  priority: GoalPriority;
  className?: string;
}

export const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({ priority, className = '' }) => {
  let indicatorColor = '#646477';
  if (priority === 'High') {
    indicatorColor = '#191927';
  } else if (priority === 'Medium') {
    indicatorColor = '#646477';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs text-[#646477] ${className}`}
      title={`Priority: ${priority}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: indicatorColor }}
        aria-hidden="true"
      />
      <span>{priority}</span>
    </span>
  );
};

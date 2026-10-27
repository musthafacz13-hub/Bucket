import React from 'react';
import { OverviewMetrics } from '../../types';

interface BucketListSummaryProps {
  metrics: OverviewMetrics;
}

export const BucketListSummary: React.FC<BucketListSummaryProps> = ({ metrics }) => {
  const remaining = Math.max(0, metrics.totalGoals - metrics.completed);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#E8E8EE] rounded-xl bg-white overflow-hidden">
      {/* 1. Total Goals */}
      <div className="p-4 sm:p-5 border-b sm:border-b-0 border-r border-[#E8E8EE]">
        <span className="text-xs font-medium text-[#646477]">Total Goals</span>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-[#191927] tabular-nums">
            {metrics.totalGoals}
          </span>
          <span className="text-xs text-[#8E8EA0]">all items</span>
        </div>
      </div>

      {/* 2. In Progress */}
      <div className="p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-[#E8E8EE]">
        <span className="text-xs font-medium text-[#646477]">In Progress</span>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-[#191927] tabular-nums">
            {metrics.inProgress}
          </span>
          <span className="text-xs text-[#8E8EA0]">active</span>
        </div>
      </div>

      {/* 3. Completed */}
      <div className="p-4 sm:p-5 border-r border-[#E8E8EE]">
        <span className="text-xs font-medium text-[#646477]">Completed</span>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-[#191927] tabular-nums">
            {metrics.completed}
          </span>
          <span className="text-xs text-[#8E8EA0]">achieved</span>
        </div>
      </div>

      {/* 4. Remaining */}
      <div className="p-4 sm:p-5">
        <span className="text-xs font-medium text-[#646477]">Remaining</span>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-[#191927] tabular-nums">
            {remaining}
          </span>
          <span className="text-xs text-[#8E8EA0]">to accomplish</span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { OverviewMetrics } from '../../types';

interface MetricsGridProps {
  metrics: OverviewMetrics;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#E8E8EE] rounded-xl bg-white overflow-hidden">
      {/* Metric 1: Total Goals */}
      <div className="p-4 sm:p-5 flex flex-col justify-between border-b lg:border-b-0 border-r border-[#E8E8EE]">
        <span className="text-xs font-medium text-[#646477]">Total Goals</span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#191927] tabular-nums">
            {metrics.totalGoals}
          </span>
          <span className="text-xs text-[#8E8EA0]">tracked</span>
        </div>
      </div>

      {/* Metric 2: In Progress */}
      <div className="p-4 sm:p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#E8E8EE]">
        <span className="text-xs font-medium text-[#646477]">In Progress</span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#191927] tabular-nums">
            {metrics.inProgress}
          </span>
          <span className="text-xs text-[#8E8EA0]">active</span>
        </div>
      </div>

      {/* Metric 3: Completed */}
      <div className="p-4 sm:p-5 flex flex-col justify-between border-r border-[#E8E8EE]">
        <span className="text-xs font-medium text-[#646477]">Completed</span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#191927] tabular-nums">
            {metrics.completed}
          </span>
          <span className="text-xs text-[#8E8EA0]">achieved</span>
        </div>
      </div>

      {/* Metric 4: Completion Rate */}
      <div className="p-4 sm:p-5 flex flex-col justify-between">
        <span className="text-xs font-medium text-[#646477]">Completion Rate</span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#191927] tabular-nums">
            {metrics.completionRate}%
          </span>
          <span className="text-xs text-[#8E8EA0]">of list</span>
        </div>
      </div>
    </div>
  );
};

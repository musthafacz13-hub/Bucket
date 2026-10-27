import React from 'react';
import { OverviewMetrics } from '../../types';

interface GoalProgressProps {
  metrics: OverviewMetrics;
}

export const GoalProgress: React.FC<GoalProgressProps> = ({ metrics }) => {
  const remaining = Math.max(0, metrics.totalGoals - metrics.completed);

  return (
    <section className="bg-white border border-[#E8E8EE] rounded-xl p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-[#191927]">Your Progress</h2>
          <p className="text-xs text-[#646477]">See how your goals are moving forward.</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#08C83D]" aria-hidden="true" />
            <span className="text-[#191927] font-medium tabular-nums">{metrics.completed}</span>
            <span className="text-[#646477]">completed</span>
          </div>
          <span className="text-[#E8E8EE]" aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E8E8EE]" aria-hidden="true" />
            <span className="text-[#191927] font-medium tabular-nums">{remaining}</span>
            <span className="text-[#646477]">remaining</span>
          </div>
        </div>
      </div>

      {/* Accessible Progress Bar */}
      <div className="space-y-2">
        <div
          role="progressbar"
          aria-valuenow={metrics.completionRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Goal completion progress: ${metrics.completionRate}%`}
          className="w-full h-3 bg-[#F0F0F4] rounded-full overflow-hidden p-0.5 border border-[#E8E8EE]"
        >
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${metrics.completionRate}%`,
              backgroundColor: '#08C83D',
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-[#646477]">
          <span>
            {metrics.totalGoals === 0
              ? 'No goals logged yet'
              : `${metrics.completed} of ${metrics.totalGoals} goals completed`}
          </span>
          <span className="font-semibold text-[#191927] tabular-nums">
            {metrics.completionRate}%
          </span>
        </div>
      </div>
    </section>
  );
};

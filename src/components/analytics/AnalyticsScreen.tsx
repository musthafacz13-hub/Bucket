import React, { useState, useMemo } from 'react';
import { Goal, Category } from '../../types';
import {
  calculateAnalyticsOverview,
  calculateCategoryAnalytics,
  calculatePriorityAnalytics,
  calculateDeadlineBreakdown,
  calculateGoalTrends,
  TimeRangeOption,
} from '../../utils/analytics';
import { formatDate } from '../../utils/date';
import { CategoryTag } from '../common/CategoryTag';
import { StatusIndicator, PriorityIndicator } from '../common/StatusIndicator';
import { EmptyState } from '../common/EmptyState';
import {
  BarChart2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  Plus,
} from 'lucide-react';

interface AnalyticsScreenProps {
  goals: Goal[];
  categories: Category[];
  onOpenGoalDetails: (goal: Goal) => void;
  onNewGoal: () => void;
  onNavigateGoalsWithCategory?: (categoryName: string) => void;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  goals,
  categories,
  onOpenGoalDetails,
  onNewGoal,
  onNavigateGoalsWithCategory,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('30d');

  // Derive high-level metrics
  const overview = useMemo(() => calculateAnalyticsOverview(goals), [goals]);

  // Derive category analytics
  const { categoryStats, unassignedStat } = useMemo(
    () => calculateCategoryAnalytics(goals, categories),
    [goals, categories]
  );

  // Derive priority stats
  const priorityStats = useMemo(() => calculatePriorityAnalytics(goals), [goals]);

  // Derive deadline breakdown
  const deadlineBreakdown = useMemo(() => calculateDeadlineBreakdown(goals), [goals]);

  // Derive trends over verifiable creation timestamps
  const trends = useMemo(() => calculateGoalTrends(goals, timeRange), [goals, timeRange]);

  // Max value for trend chart scaling
  const maxTrendValue = useMemo(() => {
    let max = 1;
    for (const dp of trends.dataPoints) {
      if (dp.createdCount > max) max = dp.createdCount;
    }
    return max;
  }, [trends]);

  if (goals.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <EmptyState
          icon={BarChart2}
          heading="No Goals in Workspace Yet"
          description="Analytics will automatically compute and reflect real-time progress, category distribution, and deadline metrics as soon as you create your first goals."
          actionLabel="Create First Goal"
          onAction={onNewGoal}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Screen Title & Top Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E8EE] pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#191927] tracking-tight">
            Analytics & Performance
          </h1>
          <p className="text-xs sm:text-sm text-[#646477] mt-1">
            Real-time completion rates, category distributions, priority breakdowns, and deadline tracking.
          </p>
        </div>

        {/* Time-Range Selector */}
        <div
          className="inline-flex items-center p-1 bg-[#F3F3F7] rounded-lg border border-[#E8E8EE] self-start sm:self-auto text-xs"
          role="group"
          aria-label="Analytics trend time range"
        >
          {(
            [
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: 'all', label: 'All Time' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTimeRange(t.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] ${
                timeRange === t.id
                  ? 'bg-white text-[#191927] shadow-2xs font-semibold'
                  : 'text-[#646477] hover:text-[#191927]'
              }`}
              aria-pressed={timeRange === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Goals */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8E8EE] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#646477]">
            <span>Total Goals</span>
            <Layers className="w-4 h-4 text-[#8E8EA0]" aria-hidden="true" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-semibold text-[#191927] tabular-nums tracking-tight">
              {overview.totalGoals}
            </span>
            <p className="text-[11px] text-[#8E8EA0] mt-1">
              {overview.activeGoals} active &middot; {overview.completedGoals} completed
            </p>
          </div>
        </div>

        {/* Completed & Rate */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8E8EE] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#646477]">
            <span>Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-[#08C83D]" aria-hidden="true" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold text-[#191927] tabular-nums tracking-tight">
                {overview.completionRate}%
              </span>
              <span className="text-xs text-[#08C83D] font-medium">
                ({overview.completedGoals}/{overview.totalGoals})
              </span>
            </div>
            {/* Progress Mini Bar */}
            <div className="w-full h-1.5 bg-[#F0F0F4] rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-[#08C83D] rounded-full transition-all duration-300"
                style={{ width: `${overview.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Overdue Goals */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8E8EE] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#646477]">
            <span>Overdue Goals</span>
            <AlertTriangle
              className={`w-4 h-4 ${overview.overdueCount > 0 ? 'text-red-500' : 'text-[#8E8EA0]'}`}
              aria-hidden="true"
            />
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight ${
                overview.overdueCount > 0 ? 'text-red-600' : 'text-[#191927]'
              }`}
            >
              {overview.overdueCount}
            </span>
            <p className="text-[11px] text-[#8E8EA0] mt-1">
              {overview.overdueCount === 0 ? 'All deadlines current' : 'Requires immediate attention'}
            </p>
          </div>
        </div>

        {/* Due Today & Upcoming */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8E8EE] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#646477]">
            <span>Due Today & No Date</span>
            <Calendar className="w-4 h-4 text-[#A9C9F5]" aria-hidden="true" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold text-[#191927] tabular-nums tracking-tight">
                {overview.dueTodayCount}
              </span>
              <span className="text-xs text-[#646477]">due today</span>
            </div>
            <p className="text-[11px] text-[#8E8EA0] mt-1">
              {overview.noTargetDateCount} {overview.noTargetDateCount === 1 ? 'goal' : 'goals'} without target date
            </p>
          </div>
        </div>
      </div>

      {/* Progress Trends Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8E8EE] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#F0F0F4] pb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#191927]">
              Goal Activity Trends ({timeRange === '7d' ? 'Last 7 Days' : timeRange === '30d' ? 'Last 30 Days' : timeRange === '90d' ? 'Last 90 Days' : 'All Time'})
            </h2>
            <p className="text-xs text-[#646477] mt-0.5">
              Volume of goals created and active progress in selected period.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-[#191927] font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#191927]" />
              <span>Created ({trends.totalInRange})</span>
            </span>
            <span className="flex items-center gap-1.5 text-[#08C83D] font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#08C83D]" />
              <span>Completed ({trends.completedInRange})</span>
            </span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-2">
          {trends.totalInRange === 0 ? (
            <div className="py-12 text-center text-xs text-[#8E8EA0]">
              No goals were recorded in this time window.
            </div>
          ) : (
            <div className="space-y-2">
              <div
                className="h-44 sm:h-52 flex items-end justify-between gap-1 sm:gap-2 pt-6 px-1 border-b border-[#E8E8EE]"
                role="img"
                aria-label="Goal activity bar chart"
              >
                {trends.dataPoints.map((dp, idx) => {
                  const heightPercent = Math.max(8, Math.round((dp.createdCount / maxTrendValue) * 100));
                  const completedPercent = dp.createdCount > 0 ? Math.round((dp.completedCount / dp.createdCount) * 100) : 0;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity absolute bottom-full mb-2 bg-[#191927] text-white text-[10px] rounded px-2 py-1 pointer-events-none whitespace-nowrap shadow-md z-10">
                        <div className="font-semibold">{dp.label}</div>
                        <div>Created: {dp.createdCount}</div>
                        <div>Completed: {dp.completedCount}</div>
                      </div>

                      {/* Stacked Bar */}
                      <div
                        className="w-full max-w-[28px] bg-[#191927] rounded-t transition-all flex flex-col justify-end overflow-hidden"
                        style={{ height: `${heightPercent}%` }}
                      >
                        {dp.completedCount > 0 && (
                          <div
                            className="w-full bg-[#08C83D] transition-all"
                            style={{ height: `${completedPercent}%` }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Labels */}
              <div className="flex justify-between text-[10px] text-[#8E8EA0] px-1 overflow-x-hidden">
                {trends.dataPoints.map((dp, idx) => {
                  // Only display alternating labels on mobile to avoid overlap
                  const showLabel = idx === 0 || idx === trends.dataPoints.length - 1 || idx % Math.ceil(trends.dataPoints.length / 5) === 0;
                  return (
                    <span key={idx} className={`truncate text-center ${showLabel ? 'visible' : 'invisible'}`}>
                      {dp.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Accurate Data Notice */}
        <div className="flex items-start gap-2 p-3 bg-[#FAFAFC] border border-[#E8E8EE] rounded-xl text-xs text-[#646477]">
          <Info className="w-4 h-4 text-[#8E8EA0] shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">
            <strong className="text-[#191927]">Timestamp Integrity:</strong> Trends reflect verified goal creation timestamps (<code className="text-[11px] bg-white px-1 py-0.5 rounded border border-[#E8E8EE]">createdAt</code>) and current status. Bucket preserves exact state history without fabricating unrecorded completion moments.
          </p>
        </div>
      </div>

      {/* Two Column Layout: Categories & Priorities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Analytics */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8E8EE] space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0F0F4] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#191927]">Category Performance</h2>
              <p className="text-xs text-[#646477]">Goal distribution and completion rate by category.</p>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            {categoryStats.length === 0 && unassignedStat.total === 0 ? (
              <p className="text-xs text-[#8E8EA0] py-4 text-center">No category data recorded.</p>
            ) : (
              <>
                {categoryStats.map((cat) => (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                          aria-hidden="true"
                        />
                        <span className="font-medium text-[#191927] truncate">{cat.name}</span>
                        {onNavigateGoalsWithCategory && cat.total > 0 && (
                          <button
                            type="button"
                            onClick={() => onNavigateGoalsWithCategory(cat.name)}
                            className="text-[10px] text-[#646477] hover:text-[#191927] hover:underline"
                            title={`View goals in ${cat.name}`}
                          >
                            View &rarr;
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 tabular-nums text-xs text-[#646477]">
                        <span>
                          {cat.completed}/{cat.total} done
                        </span>
                        <span className="font-semibold text-[#191927] w-9 text-right">
                          {cat.completionRate}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-[#F3F3F7] rounded-full overflow-hidden flex">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${cat.completionRate}%`,
                          backgroundColor: cat.color || '#08C83D',
                        }}
                      />
                    </div>
                  </div>
                ))}

                {/* Unassigned Goals Row if any */}
                {unassignedStat.total > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-[#F0F0F4]">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#8E8EA0] shrink-0" aria-hidden="true" />
                        <span className="font-medium text-[#646477]">Unassigned Category</span>
                      </div>
                      <div className="flex items-center gap-2 tabular-nums text-xs text-[#646477]">
                        <span>
                          {unassignedStat.completed}/{unassignedStat.total} done
                        </span>
                        <span className="font-semibold text-[#191927] w-9 text-right">
                          {unassignedStat.completionRate}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-[#F3F3F7] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#8E8EA0] rounded-full transition-all duration-300"
                        style={{ width: `${unassignedStat.completionRate}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Priority & Deadline Status Breakdown */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8E8EE] space-y-4">
          <div className="border-b border-[#F0F0F4] pb-3">
            <h2 className="text-sm font-semibold text-[#191927]">Priority & Deadlines</h2>
            <p className="text-xs text-[#646477]">Breakdown by urgency level and scheduled target dates.</p>
          </div>

          {/* Priority Distribution */}
          <div className="space-y-3">
            <span className="text-[11px] font-semibold text-[#8E8EA0] uppercase tracking-wider">
              By Priority Level
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {priorityStats.map((p) => (
                <div
                  key={p.priority}
                  className="p-3 rounded-xl border border-[#E8E8EE] bg-[#FAFAFC] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <PriorityIndicator priority={p.priority} />
                  </div>
                  <div className="mt-3">
                    <div className="text-lg font-semibold text-[#191927] tabular-nums">
                      {p.total}
                    </div>
                    <div className="text-[10px] text-[#646477] mt-0.5">
                      {p.completed} completed ({p.completionRate}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deadline Distribution */}
          <div className="space-y-3 pt-3 border-t border-[#F0F0F4]">
            <span className="text-[11px] font-semibold text-[#8E8EA0] uppercase tracking-wider">
              By Deadline Status
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg border border-[#E8E8EE] bg-white text-center">
                <div className="text-[11px] text-red-600 font-medium">Overdue</div>
                <div className="text-base font-semibold text-red-600 mt-0.5 tabular-nums">
                  {deadlineBreakdown.overdue.length}
                </div>
              </div>
              <div className="p-2.5 rounded-lg border border-[#E8E8EE] bg-white text-center">
                <div className="text-[11px] text-[#191927] font-medium">Due Today</div>
                <div className="text-base font-semibold text-[#191927] mt-0.5 tabular-nums">
                  {deadlineBreakdown.dueToday.length}
                </div>
              </div>
              <div className="p-2.5 rounded-lg border border-[#E8E8EE] bg-white text-center">
                <div className="text-[11px] text-[#646477] font-medium">This Week</div>
                <div className="text-base font-semibold text-[#191927] mt-0.5 tabular-nums">
                  {deadlineBreakdown.dueThisWeek.length}
                </div>
              </div>
              <div className="p-2.5 rounded-lg border border-[#E8E8EE] bg-white text-center">
                <div className="text-[11px] text-[#8E8EA0] font-medium">No Date</div>
                <div className="text-base font-semibold text-[#646477] mt-0.5 tabular-nums">
                  {deadlineBreakdown.noDeadline.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Urgent Goals Section (Overdue or Due Today) */}
      {(overview.overdueGoals.length > 0 || overview.dueTodayGoals.length > 0) && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8E8EE] space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0F0F4] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#191927] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" aria-hidden="true" />
                <span>Immediate Attention Required</span>
              </h2>
              <p className="text-xs text-[#646477] mt-0.5">
                Active goals that are overdue or scheduled for completion today.
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#F0F0F4]">
            {/* Overdue goals */}
            {overview.overdueGoals.map((goal) => (
              <div
                key={goal.id}
                onClick={() => onOpenGoalDetails(goal)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-[#FAFAFC] px-2 rounded-lg cursor-pointer transition-colors"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenGoalDetails(goal);
                  }
                }}
                aria-label={`Open goal: ${goal.title}, overdue`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#191927] truncate">{goal.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 font-semibold rounded border border-red-200">
                      Overdue
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#646477] flex-wrap">
                    {goal.category && <CategoryTag category={goal.category} />}
                    <StatusIndicator status={goal.status} />
                    <PriorityIndicator priority={goal.priority} />
                    <span className="text-[11px] text-red-600 font-medium">
                      Target: {formatDate(goal.targetDate)}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8E8EA0] shrink-0" aria-hidden="true" />
              </div>
            ))}

            {/* Due today goals */}
            {overview.dueTodayGoals.map((goal) => (
              <div
                key={goal.id}
                onClick={() => onOpenGoalDetails(goal)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-[#FAFAFC] px-2 rounded-lg cursor-pointer transition-colors"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenGoalDetails(goal);
                  }
                }}
                aria-label={`Open goal: ${goal.title}, due today`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#191927] truncate">{goal.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-yellow-50 text-yellow-800 font-semibold rounded border border-yellow-200">
                      Due Today
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#646477] flex-wrap">
                    {goal.category && <CategoryTag category={goal.category} />}
                    <StatusIndicator status={goal.status} />
                    <PriorityIndicator priority={goal.priority} />
                    <span className="text-[11px] text-[#646477] font-medium">
                      Target: Today ({formatDate(goal.targetDate)})
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8E8EA0] shrink-0" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

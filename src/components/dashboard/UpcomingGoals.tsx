import React from 'react';
import { Goal } from '../../types';
import { formatDate, getDaysRemaining } from '../../utils/date';
import { StatusIndicator } from '../common/StatusIndicator';
import { CategoryTag } from '../common/CategoryTag';
import { Calendar, ArrowRight, Edit2 } from 'lucide-react';

interface UpcomingGoalsProps {
  upcomingGoals: Goal[];
  onExploreBucketList: () => void;
  onOpenDetails?: (goal: Goal) => void;
  onEditGoal: (goal: Goal) => void;
  onToggleComplete: (goalId: string) => void;
}

export const UpcomingGoals: React.FC<UpcomingGoalsProps> = ({
  upcomingGoals,
  onExploreBucketList,
  onOpenDetails,
  onEditGoal,
}) => {
  return (
    <section className="bg-white border border-[#E8E8EE] rounded-xl overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-[#E8E8EE] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#191927]">Coming Up</h2>
          <p className="text-xs text-[#646477]">Goals you have planned for the days ahead.</p>
        </div>

        {upcomingGoals.length > 0 && (
          <button
            type="button"
            onClick={onExploreBucketList}
            className="text-xs font-medium text-[#191927] hover:text-[#2B2B40] flex items-center gap-1 group py-1"
          >
            <span>All Goals</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      <div className="p-4 sm:p-6">
        {upcomingGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#E8E8EE] rounded-xl bg-[#FAFAFC]">
            <div className="w-10 h-10 mb-3 rounded-lg flex items-center justify-center text-[#646477] bg-white border border-[#E8E8EE]">
              <Calendar className="w-5 h-5 text-[#646477]" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-[#191927] mb-1">Nothing planned yet.</h3>
            <p className="text-xs text-[#646477] max-w-sm mb-4 leading-relaxed">
              Add a target date to a goal and it will appear here.
            </p>
            <button
              type="button"
              onClick={onExploreBucketList}
              className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-medium text-[#191927] bg-white border border-[#E8E8EE] rounded-lg hover:bg-[#F3F3F7] active:bg-[#EBEBEF] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191927] min-h-[36px]"
            >
              Explore Bucket List
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#F0F0F4]">
            {upcomingGoals.map((goal) => {
              const countdown = getDaysRemaining(goal.targetDate);

              return (
                <div
                  key={goal.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 group hover:bg-[#FAFAFC] px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Yellow accent marker for upcoming planned goals */}
                    <span
                      className="w-2 h-2 mt-1.5 rounded-full shrink-0 border border-[#191927]/30"
                      style={{ backgroundColor: '#F9E94E' }}
                      title="Upcoming target date"
                      aria-hidden="true"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          onClick={() => onOpenDetails?.(goal)}
                          className={`text-sm font-medium transition-colors ${
                            onOpenDetails ? 'cursor-pointer hover:underline' : ''
                          } text-[#191927] truncate`}
                        >
                          {goal.title}
                        </span>
                        {countdown && (
                          <span
                            className="text-[11px] font-medium text-[#191927] px-1.5 py-0.5 rounded tabular-nums"
                            style={{ backgroundColor: '#F9E94E' }}
                          >
                            {countdown}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#646477] mt-0.5 flex-wrap">
                        <CategoryTag category={goal.category} />
                        <span aria-hidden="true" className="text-[#D0D0DC]">·</span>
                        <span className="tabular-nums">Target: {formatDate(goal.targetDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0">
                    <StatusIndicator status={goal.status} />
                    <button
                      type="button"
                      onClick={() => onEditGoal(goal)}
                      className="p-1.5 text-[#646477] hover:text-[#191927] hover:bg-white rounded-md border border-transparent hover:border-[#E8E8EE] transition-all opacity-90 sm:opacity-0 group-hover:opacity-100 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      aria-label={`Edit upcoming goal "${goal.title}"`}
                      title="Edit goal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

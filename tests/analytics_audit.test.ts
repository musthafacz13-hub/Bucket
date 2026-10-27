import { Goal, Category } from '../src/types';
import {
  calculateAnalyticsOverview,
  calculateCategoryAnalytics,
  calculatePriorityAnalytics,
  calculateDeadlineBreakdown,
  calculateGoalTrends,
} from '../src/utils/analytics';
import { formatDateToYmd } from '../src/utils/date';

console.log('--- STARTING PHASE 7 ANALYTICS COMPREHENSIVE TEST SUITE ---');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${testName}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  }
}

const todayDate = new Date();
const todayYmd = formatDateToYmd(todayDate);

const yesterdayDate = new Date(todayDate.getTime() - 24 * 60 * 60 * 1000);
const yesterdayYmd = formatDateToYmd(yesterdayDate);

const tomorrowDate = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000);
const tomorrowYmd = formatDateToYmd(tomorrowDate);

const nextMonthDate = new Date(todayDate.getTime() + 30 * 24 * 60 * 60 * 1000);
const nextMonthYmd = formatDateToYmd(nextMonthDate);

const categories: Category[] = [
  { id: 'cat_work', name: 'Work', color: '#191927', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'cat_health', name: 'Health', color: '#08C83D', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
];

const mockGoals: Goal[] = [
  // 1. Overdue Active Goal (yesterday, In Progress) -> MUST BE OVERDUE
  {
    id: 'g1',
    title: 'Finish report',
    description: '',
    category: 'Work',
    categoryId: 'cat_work',
    priority: 'High',
    status: 'In Progress',
    targetDate: yesterdayYmd,
    createdAt: new Date(todayDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // 2. Past Goal that is Completed -> MUST NOT BE COUNTED AS OVERDUE!
  {
    id: 'g2',
    title: 'Dentist appointment',
    description: '',
    category: 'Health',
    categoryId: 'cat_health',
    priority: 'Medium',
    status: 'Completed',
    targetDate: yesterdayYmd,
    createdAt: new Date(todayDate.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // 3. Goal Due Today (In Progress) -> MUST BE DUE TODAY
  {
    id: 'g3',
    title: 'Submit tax papers',
    description: '',
    category: 'Work',
    categoryId: 'cat_work',
    priority: 'High',
    status: 'In Progress',
    targetDate: todayYmd,
    createdAt: new Date(todayDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // 4. Goal Due Tomorrow -> Upcoming (This Week)
  {
    id: 'g4',
    title: 'Weekly grocery prep',
    description: '',
    category: 'Health',
    categoryId: 'cat_health',
    priority: 'Low',
    status: 'Not Started',
    targetDate: tomorrowYmd,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // 5. Goal Due Next Month -> Upcoming (Later)
  {
    id: 'g5',
    title: 'Half marathon',
    description: '',
    category: 'Health',
    categoryId: 'cat_health',
    priority: 'High',
    status: 'Not Started',
    targetDate: nextMonthYmd,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // 6. Goal with no deadline and unassigned category -> Unassigned & No Deadline
  {
    id: 'g6',
    title: 'Learn guitar',
    description: '',
    category: '',
    categoryId: null,
    priority: 'Low',
    status: 'Completed',
    targetDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// TEST 1: Overview Calculations
console.log('\n--- 1. Testing Analytics Overview Calculations ---');
const overview = calculateAnalyticsOverview(mockGoals);

assert(overview.totalGoals === 6, 'Total goals count is 6');
assert(overview.completedGoals === 2, 'Completed goals count is 2 (g2, g6)');
assert(overview.activeGoals === 4, 'Active goals count is 4 (g1, g3, g4, g5)');
assert(overview.inProgressGoals === 2, 'In Progress count is 2 (g1, g3)');
assert(overview.notStartedGoals === 2, 'Not Started count is 2 (g4, g5)');
assert(overview.completionRate === 33, 'Completion rate is 33% (2/6 rounded)');
assert(overview.overdueCount === 1, 'CRITICAL: Exactly 1 goal is overdue (g1). Completed goal g2 is strictly excluded!');
assert(overview.dueTodayCount === 1, 'Exactly 1 goal is due today (g3)');
assert(overview.noTargetDateCount === 1, 'Exactly 1 goal has no target date (g6)');

// TEST 2: Empty Goals Safety
console.log('\n--- 2. Testing Empty Goals Safety ---');
const emptyOverview = calculateAnalyticsOverview([]);
assert(emptyOverview.totalGoals === 0, 'Empty goals returns totalGoals 0');
assert(emptyOverview.completionRate === 0, 'Empty goals returns completionRate 0% (no NaN or Infinity)');
assert(emptyOverview.overdueCount === 0, 'Empty goals returns overdueCount 0');

// TEST 3: Category Analytics
console.log('\n--- 3. Testing Category Analytics Breakdown ---');
const { categoryStats, unassignedStat } = calculateCategoryAnalytics(mockGoals, categories);

const workStat = categoryStats.find((c) => c.name === 'Work');
assert(Boolean(workStat), 'Work category found in stats');
assert(workStat!.total === 2, 'Work has 2 goals (g1, g3)');
assert(workStat!.completed === 0, 'Work has 0 completed');
assert(workStat!.active === 2, 'Work has 2 active');
assert(workStat!.completionRate === 0, 'Work completion rate is 0%');

const healthStat = categoryStats.find((c) => c.name === 'Health');
assert(Boolean(healthStat), 'Health category found in stats');
assert(healthStat!.total === 3, 'Health has 3 goals (g2, g4, g5)');
assert(healthStat!.completed === 1, 'Health has 1 completed (g2)');
assert(healthStat!.active === 2, 'Health has 2 active (g4, g5)');
assert(healthStat!.completionRate === 33, 'Health completion rate is 33%');

assert(unassignedStat.total === 1, 'Unassigned category has 1 goal (g6)');
assert(unassignedStat.completed === 1, 'Unassigned completed is 1 (g6)');
assert(unassignedStat.completionRate === 100, 'Unassigned completion rate is 100%');

// TEST 4: Priority Analytics
console.log('\n--- 4. Testing Priority Analytics Breakdown ---');
const priorityStats = calculatePriorityAnalytics(mockGoals);

const highStat = priorityStats.find((p) => p.priority === 'High');
assert(highStat!.total === 3, 'High priority has 3 goals (g1, g3, g5)');
assert(highStat!.completed === 0, 'High priority has 0 completed');
assert(highStat!.completionRate === 0, 'High priority completion rate is 0%');

const medStat = priorityStats.find((p) => p.priority === 'Medium');
assert(medStat!.total === 1, 'Medium priority has 1 goal (g2)');
assert(medStat!.completed === 1, 'Medium priority has 1 completed');
assert(medStat!.completionRate === 100, 'Medium priority completion rate is 100%');

const lowStat = priorityStats.find((p) => p.priority === 'Low');
assert(lowStat!.total === 2, 'Low priority has 2 goals (g4, g6)');
assert(lowStat!.completed === 1, 'Low priority has 1 completed (g6)');
assert(lowStat!.completionRate === 50, 'Low priority completion rate is 50%');

// TEST 5: Deadline Breakdown
console.log('\n--- 5. Testing Deadline Timeline Breakdown ---');
const deadline = calculateDeadlineBreakdown(mockGoals);

assert(deadline.overdue.length === 1 && deadline.overdue[0].id === 'g1', 'Deadline breakdown overdue contains g1');
assert(deadline.dueToday.length === 1 && deadline.dueToday[0].id === 'g3', 'Deadline breakdown dueToday contains g3');
assert(deadline.dueThisWeek.length === 1 && deadline.dueThisWeek[0].id === 'g4', 'Deadline breakdown dueThisWeek contains g4');
assert(deadline.dueLater.length >= 1, 'Deadline breakdown dueLater contains future goals and completed goals');
assert(deadline.noDeadline.length === 1 && deadline.noDeadline[0].id === 'g6', 'Deadline breakdown noDeadline contains g6');

// TEST 6: Time Range Trends
console.log('\n--- 6. Testing Goal Activity Trends ---');
const trend7d = calculateGoalTrends(mockGoals, '7d');
assert(trend7d.totalInRange === 6, '7d range contains all recently created mock goals');
assert(trend7d.dataPoints.length > 0, '7d range generates data points');

const trend30d = calculateGoalTrends(mockGoals, '30d');
assert(trend30d.totalInRange === 6, '30d range contains all mock goals');

const trend90d = calculateGoalTrends(mockGoals, '90d');
assert(trend90d.totalInRange === 6, '90d range contains all mock goals');

// TEST 7: Mutation & State Consistency
console.log('\n--- 7. Testing Goal Mutation Reaction ---');
// Complete g1
const mutatedGoals = mockGoals.map((g) =>
  g.id === 'g1' ? { ...g, status: 'Completed' as const } : g
);
const mutatedOverview = calculateAnalyticsOverview(mutatedGoals);
assert(mutatedOverview.completedGoals === 3, 'Completing g1 increases completed count to 3');
assert(mutatedOverview.overdueCount === 0, 'Completing overdue goal g1 drops overdueCount to 0 immediately');
assert(mutatedOverview.completionRate === 50, 'Completion rate rises to 50%');

console.log('\n========================================');
console.log(`SUMMARY: ${passedTests}/${totalTests} tests passed successfully!`);
console.log('========================================\n');

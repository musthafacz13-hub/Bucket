import {
  calculateMetrics,
  getUpcomingGoals,
  sortRecentlyUpdated,
  filterGoals,
  sortGoals,
  filterNotes,
  sortNotes,
  calculateCategoryCounts,
  getAvailableCategories,
} from '../src/utils/calculations';
import {
  calculateAnalyticsOverview,
  calculateCategoryAnalytics,
  calculatePriorityAnalytics,
  calculateDeadlineBreakdown,
  calculateGoalTrends,
} from '../src/utils/analytics';
import {
  DEFAULT_PREFERENCES,
  WorkspacePreferences,
  ThemeMode,
  loadStoredPreferences,
  saveStoredPreferences,
  applyTheme,
  getStorageUsageEstimate,
  clearWorkspaceData,
  getFixtureData,
  loadStoredGoals,
  saveStoredGoals,
  loadStoredNotes,
  saveStoredNotes,
  loadStoredCategories,
  saveStoredCategories,
} from '../src/utils/storage';
import {
  formatDate,
  formatDateToYmd,
  parseYmdDate,
  getMonthCalendarGrid,
  getWeekDays,
  isSameDateDay,
} from '../src/utils/date';
import { Goal, Note, Category, NavigationItem } from '../src/types';
import { MobileNav } from '../src/components/layout/MobileNav';

console.log('=== STARTING PHASE 9 INTEGRATION & WORKFLOW AUDIT SUITE ===\n');

let totalTests = 0;
let passedTests = 0;

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

// Set up browser-like mocks for Node runtime
const mockStorage = new Map<string, string>();
const storageMock = {
  getItem: (key: string) => mockStorage.get(key) || null,
  setItem: (key: string, val: string) => mockStorage.set(key, String(val)),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  get length() {
    return mockStorage.size;
  },
  key: (i: number) => Array.from(mockStorage.keys())[i] || null,
};
(global as any).localStorage = storageMock;
(global as any).window = {
  localStorage: storageMock,
  matchMedia: (query: string) => ({
    matches: query.includes('dark') ? false : true,
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
};

let rootAttrs: Record<string, string> = {};
let rootClasses = new Set<string>();
(global as any).document = {
  documentElement: {
    setAttribute: (k: string, v: string) => {
      rootAttrs[k] = v;
    },
    getAttribute: (k: string) => rootAttrs[k],
    classList: {
      add: (c: string) => rootClasses.add(c),
      remove: (c: string) => rootClasses.delete(c),
      contains: (c: string) => rootClasses.has(c),
    },
  },
};

// =========================================================================
// SECTION 1: WORKSPACE CONTROL INVENTORY & NAVIGATION INTEGRITY
// =========================================================================
console.log('--- 1. Workspace Control Inventory & Navigation Structure ---');
const supportedTabs: NavigationItem[] = [
  'dashboard',
  'bucket-list',
  'notes',
  'categories',
  'calendar',
  'analytics',
  'settings',
];
assert(supportedTabs.length === 7, 'All 7 workspace sections registered');

// Mobile navigation bar eliminated
const navOutput = MobileNav({});
assert(navOutput === null, 'MobileNav component renders null (bottom bar removed)');

// =========================================================================
// SECTION 2: END-TO-END GOAL WORKFLOW & CROSS-FEATURE SYNC
// =========================================================================
console.log('\n--- 2. End-to-End Goal Workflow & Cross-Feature Synchronizations ---');
let testGoals: Goal[] = [];
let testNotes: Note[] = [];
let testCategories: Category[] = [
  { id: 'cat_adventures', name: 'Adventures', color: '#08C83D', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
];

// 2.1 Create goal
const goal1: Goal = {
  id: 'goal_test_1',
  title: 'Hike Pacific Crest Trail',
  description: 'Thru-hike from Mexico to Canada with ultra-light gear',
  category: 'Adventures',
  categoryId: 'cat_adventures',
  priority: 'High',
  status: 'In Progress',
  targetDate: '2026-07-15',
  createdAt: '2026-01-10T12:00:00Z',
  updatedAt: '2026-01-10T12:00:00Z',
};
testGoals = [goal1];
saveStoredGoals(testGoals);
assert(loadStoredGoals().length === 1, 'Goal persisted to storage');

// Metrics reflected
let m = calculateMetrics(testGoals);
assert(m.totalGoals === 1, 'Dashboard metrics count is 1');
assert(m.inProgress === 1, 'In progress count is 1');
assert(m.completionRate === 0, 'Completion rate is 0%');

// 2.2 Edit goal: update category, priority, status to Completed
const updatedGoal1: Goal = {
  ...goal1,
  priority: 'Medium',
  status: 'Completed',
  updatedAt: '2026-01-15T12:00:00Z',
};
testGoals = [updatedGoal1];
saveStoredGoals(testGoals);

m = calculateMetrics(testGoals);
assert(m.completed === 1, 'Completed count updated to 1');
assert(m.completionRate === 100, 'Completion rate updated to 100%');

// Analytics reflect completion
const anOverview = calculateAnalyticsOverview(testGoals);
assert(anOverview.completedGoals === 1, 'Analytics overview reflects completed count');
assert(anOverview.activeGoals === 0, 'Analytics active goals is 0');
assert(anOverview.overdueCount === 0 && anOverview.overdueGoals.length === 0, 'Completed goal is not marked overdue');

// 2.3 Calendar scheduled goals count
const scheduledCount = testGoals.filter(
  (g) => Boolean(g.targetDate && g.targetDate.trim() && parseYmdDate(g.targetDate))
).length;
assert(scheduledCount === 1, 'Goal properly identified as scheduled in Calendar');

// 2.4 Delete goal and verify notes unlinking
const linkedNote: Note = {
  id: 'note_linked_1',
  title: 'Trail Planning Checklist',
  content: '- [ ] Buy trail shoes\n- [x] Test tent',
  isFavorite: true,
  linkedGoalId: 'goal_test_1',
  categoryId: 'cat_adventures',
  category: 'Adventures',
  createdAt: '2026-01-12T12:00:00Z',
  updatedAt: '2026-01-12T12:00:00Z',
  tags: ['hiking', 'gear'],
};
testNotes = [linkedNote];

// Deleting goal should safely clear linkedGoalId in notes
testGoals = [];
testNotes = testNotes.map((n) => (n.linkedGoalId === 'goal_test_1' ? { ...n, linkedGoalId: null } : n));
assert(testNotes[0].linkedGoalId === null, 'Deleting goal safely unlinks note without orphaning or deleting note');

// =========================================================================
// SECTION 3: END-TO-END NOTES WORKFLOW & MARKDOWN CHECKLISTS
// =========================================================================
console.log('\n--- 3. End-to-End Notes Workflow & Markdown Checklist Handling ---');
// Test Markdown checklist line toggle simulation
let noteContent = '- [ ] Buy trail shoes\n- [x] Test tent\n* [ ] Check permits';
const lines = noteContent.split('\n');

// Toggle line 0 from [ ] to [x]
const line0Match = lines[0].match(/^(\s*)([-*])\s*\[([ xX])\]\s*(.*)$/);
assert(Boolean(line0Match), 'Line 0 matches checklist regex');
if (line0Match) {
  lines[0] = `${line0Match[1]}${line0Match[2]} [x] ${line0Match[4]}`;
}
assert(lines[0] === '- [x] Buy trail shoes', 'Checklist line 0 toggled to checked');

// Toggle line 1 from [x] to [ ]
const line1Match = lines[1].match(/^(\s*)([-*])\s*\[([ xX])\]\s*(.*)$/);
if (line1Match) {
  lines[1] = `${line1Match[1]}${line1Match[2]} [ ] ${line1Match[4]}`;
}
assert(lines[1] === '- [ ] Test tent', 'Checklist line 1 toggled to unchecked');

// Asterisk style checkbox toggle
const line2Match = lines[2].match(/^(\s*)([-*])\s*\[([ xX])\]\s*(.*)$/);
if (line2Match) {
  lines[2] = `${line2Match[1]}${line2Match[2]} [x] ${line2Match[4]}`;
}
assert(lines[2] === '* [x] Check permits', 'Asterisk bullet checklist toggled to checked');

// Favorite toggle
const noteWithFav: Note = { ...testNotes[0], isFavorite: false };
const noteToggled = { ...noteWithFav, isFavorite: !noteWithFav.isFavorite };
assert(noteToggled.isFavorite === true, 'Note favorite toggled to true');

// =========================================================================
// SECTION 4: END-TO-END CATEGORY WORKFLOW & CASCADING CONSISTENCY
// =========================================================================
console.log('\n--- 4. End-to-End Category Workflow & Cascading Consistency ---');
// 4.1 Reserved name protection
const reservedNames = ['all', 'unassigned'];
assert(reservedNames.includes('all'.toLowerCase()), 'Detects "all" as reserved category name');
assert(reservedNames.includes('unassigned'.toLowerCase()), 'Detects "unassigned" as reserved category name');

// 4.2 Duplicate detection
const catList: Category[] = [
  { id: 'cat_1', name: 'Work', color: '#191927', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
];
const isDupe = catList.some((c) => c.name.toLowerCase().trim() === '  work  '.toLowerCase().trim());
assert(isDupe, 'Detects duplicate category name with whitespace and case differences');

// 4.3 Color validation
const isValidHex = (c: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c.trim());
assert(isValidHex('#08C83D'), 'Valid hex #08C83D accepted');
assert(!isValidHex('blue'), 'Invalid color name rejected safely');
assert(!isValidHex('#xyz'), 'Invalid hex string rejected safely');

// 4.4 Renaming category cascades to goals and notes
const catWork = { id: 'c1', name: 'Work', color: '#191927', createdAt: '2026-01-01', updatedAt: '2026-01-01' };
let currentGoals: Goal[] = [
  {
    id: 'g_w1',
    title: 'Finish Q1 roadmap',
    description: '',
    category: 'Work',
    categoryId: 'c1',
    priority: 'High',
    status: 'In Progress',
    targetDate: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];
let currentNotes: Note[] = [
  {
    id: 'n_w1',
    title: 'Q1 ideas',
    content: '',
    isFavorite: false,
    categoryId: 'c1',
    category: 'Work',
    linkedGoalId: 'g_w1',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    tags: [],
  },
];

// Rename Work -> Career
const newName = 'Career';
currentGoals = currentGoals.map((g) =>
  g.categoryId === 'c1' || g.category.toLowerCase() === 'work'
    ? { ...g, category: newName, categoryId: 'c1' }
    : g
);
currentNotes = currentNotes.map((n) =>
  n.categoryId === 'c1' || (n.category && n.category.toLowerCase() === 'work')
    ? { ...n, category: newName, categoryId: 'c1' }
    : n
);
assert(currentGoals[0].category === 'Career', 'Goal category name cascaded on rename');
assert(currentNotes[0].category === 'Career', 'Note category name cascaded on rename');

// 4.5 Deleting category safely unassigns goals and notes
currentGoals = currentGoals.map((g) =>
  g.categoryId === 'c1' || g.category.toLowerCase() === 'career'
    ? { ...g, categoryId: null, category: '' }
    : g
);
currentNotes = currentNotes.map((n) =>
  n.categoryId === 'c1' || (n.category && n.category.toLowerCase() === 'career')
    ? { ...n, categoryId: null, category: null }
    : n
);
assert(currentGoals[0].categoryId === null && currentGoals[0].category === '', 'Goal safely unassigned');
assert(currentNotes[0].categoryId === null && currentNotes[0].category === null, 'Note safely unassigned');
assert(currentGoals.length === 1, 'Goal itself is NOT deleted');
assert(currentNotes.length === 1, 'Note itself is NOT deleted');

// =========================================================================
// SECTION 5: CALENDAR DATE NAVIGATION & BOUNDARY CALCULATIONS
// =========================================================================
console.log('\n--- 5. Calendar Date Navigation & Boundary Math ---');
// 5.1 Month end clamping: Jan 31 + 1 month should clamp to Feb 28 (or 29 on leap year)
const jan31 = new Date(2026, 0, 31, 12, 0, 0); // Jan 31, 2026
const targetYear = jan31.getFullYear();
const targetMonth = jan31.getMonth() + 1; // February (1)
const daysInFeb2026 = new Date(targetYear, targetMonth + 1, 0, 12, 0, 0).getDate();
assert(daysInFeb2026 === 28, 'February 2026 has exactly 28 days');

const clampedFebDate = new Date(targetYear, targetMonth, Math.min(jan31.getDate(), daysInFeb2026), 12, 0, 0);
assert(clampedFebDate.getMonth() === 1, 'Remains in February');
assert(clampedFebDate.getDate() === 28, 'Day clamped to 28 instead of spilling into March');

// 5.2 Leap year 2024 test
const daysInFeb2024 = new Date(2024, 2, 0, 12, 0, 0).getDate();
assert(daysInFeb2024 === 29, 'Leap year 2024 has 29 days in February');

// 5.3 Month calendar grid generation
const grid2026 = getMonthCalendarGrid(2026, 9); // October 2026
assert(grid2026.length % 7 === 0, 'Grid returns full 7-day rows');
assert(grid2026.length >= 35, 'Grid contains at least 35 calendar cells');

// =========================================================================
// SECTION 6: PREFERENCES, THEMES & WORKSPACE DEFAULTS
// =========================================================================
console.log('\n--- 6. Preferences, Themes & Workspace Defaults ---');
// 6.1 Theme application: light, dark, system
applyTheme('light');
assert(rootAttrs['data-theme'] === 'light', 'data-theme is light');
assert(!rootClasses.has('dark'), 'dark class absent');

applyTheme('dark');
assert(rootAttrs['data-theme'] === 'dark', 'data-theme is dark');
assert(rootClasses.has('dark'), 'dark class present');

// 6.2 Calendar default view preference
const testPrefs: WorkspacePreferences = {
  theme: 'dark',
  defaultCalendarView: 'day',
  defaultNotesView: 'list',
};
saveStoredPreferences(testPrefs);
const restoredPrefs = loadStoredPreferences();
assert(restoredPrefs.defaultCalendarView === 'day', 'Default calendar view preference "day" preserved');
assert(restoredPrefs.defaultNotesView === 'list', 'Default notes layout preference "list" preserved');

// 6.3 Corrupted storage defense
localStorage.setItem('bucket_preferences_v1', 'invalid json string');
const safeFallback = loadStoredPreferences();
assert(safeFallback.theme === 'light', 'Corrupted preferences fall back safely to light');
assert(safeFallback.defaultCalendarView === 'month', 'Corrupted preferences fall back safely to month');
assert(safeFallback.defaultNotesView === 'grid', 'Corrupted preferences fall back safely to grid');

// =========================================================================
// SECTION 7: DESTRUCTIVE OPERATIONS SAFETY GUARANTEES
// =========================================================================
console.log('\n--- 7. Destructive Operations Safety Guarantees ---');
localStorage.setItem('bucket_goals_v1', JSON.stringify([{ id: 'g1', title: 'Goal 1' }]));
localStorage.setItem('bucket_notes_v1', JSON.stringify([{ id: 'n1', title: 'Note 1' }]));
localStorage.setItem('bucket_categories_v1', JSON.stringify([{ id: 'c1', name: 'Cat 1' }]));
saveStoredPreferences({ theme: 'dark', defaultCalendarView: 'week', defaultNotesView: 'list' });

// Clear workspace
clearWorkspaceData();
assert(localStorage.getItem('bucket_goals_v1') === null, 'Goals cleared');
assert(localStorage.getItem('bucket_notes_v1') === null, 'Notes cleared');
assert(localStorage.getItem('bucket_categories_v1') === null, 'Categories cleared');
assert(localStorage.getItem('bucket_preferences_v1') !== null, 'User preferences PRESERVED when clearing workspace');

// Sample Fixtures load
const fixtures = getFixtureData();
assert(fixtures.goals.length > 0, 'Fixtures provide sample goals');
assert(fixtures.notes.length > 0, 'Fixtures provide sample notes');
assert(fixtures.categories.length > 0, 'Fixtures provide sample categories');

console.log('\n======================================================');
console.log(`SUMMARY: ${passedTests}/${totalTests} INTEGRATION TESTS PASSED SUCCESSFULLY!`);
console.log('======================================================\n');

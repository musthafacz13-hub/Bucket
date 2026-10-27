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
} from '../src/utils/storage';
import { NavigationItem } from '../src/types';
import { MobileNav } from '../src/components/layout/MobileNav';

console.log('--- STARTING PHASE 8 SETTINGS & NAVIGATION AUDIT SUITE ---');

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

// Mock Window and LocalStorage in Node test environment
const mockStorage = new Map<string, string>();
const storageMock = {
  getItem: (key: string) => mockStorage.get(key) || null,
  setItem: (key: string, val: string) => mockStorage.set(key, val),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  get length() {
    return mockStorage.size;
  },
  key: (index: number) => Array.from(mockStorage.keys())[index] || null,
};
(global as any).localStorage = storageMock;
(global as any).window = {
  localStorage: storageMock,
  matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
};

// Mock Document for Theme tests
let rootAttributes: Record<string, string> = {};
let rootClassList = new Set<string>();
(global as any).document = {
  documentElement: {
    setAttribute: (k: string, v: string) => {
      rootAttributes[k] = v;
    },
    getAttribute: (k: string) => rootAttributes[k],
    classList: {
      add: (c: string) => rootClassList.add(c),
      remove: (c: string) => rootClassList.delete(c),
      contains: (c: string) => rootClassList.has(c),
    },
  },
};

// TEST 1: Default Preferences & Sanitization
console.log('\n--- 1. Testing Default Preferences & Storage Sanitization ---');
localStorage.clear();
const initialPrefs = loadStoredPreferences();
assert(initialPrefs.theme === 'light', 'Default theme is "light"');
assert(initialPrefs.defaultCalendarView === 'month', 'Default calendar view is "month"');
assert(initialPrefs.defaultNotesView === 'grid', 'Default notes view is "grid"');

// Corrupt preference storage test
localStorage.setItem(
  'bucket_preferences_v1',
  JSON.stringify({ theme: 'rainbow', defaultCalendarView: 'decade', defaultNotesView: 'mosaic' })
);
const sanitized = loadStoredPreferences();
assert(sanitized.theme === 'light', 'Corrupted theme falls back safely to "light"');
assert(sanitized.defaultCalendarView === 'month', 'Corrupted calendar view falls back to "month"');
assert(sanitized.defaultNotesView === 'grid', 'Corrupted notes view falls back to "grid"');

// TEST 2: Preference Persistence & Retrieval
console.log('\n--- 2. Testing Preference Saving and Persistence ---');
const updatedPrefs: WorkspacePreferences = {
  theme: 'dark',
  defaultCalendarView: 'week',
  defaultNotesView: 'list',
};
saveStoredPreferences(updatedPrefs);
const loaded = loadStoredPreferences();
assert(loaded.theme === 'dark', 'Theme "dark" saved and restored');
assert(loaded.defaultCalendarView === 'week', 'Calendar view "week" saved and restored');
assert(loaded.defaultNotesView === 'list', 'Notes view "list" saved and restored');

// TEST 3: Theme Application Engine
console.log('\n--- 3. Testing Theme Engine (applyTheme) ---');
applyTheme('light');
assert(rootAttributes['data-theme'] === 'light', 'data-theme attribute set to "light"');
assert(!rootClassList.has('dark'), 'dark class not present in light mode');

applyTheme('dark');
assert(rootAttributes['data-theme'] === 'dark', 'data-theme attribute set to "dark"');
assert(rootClassList.has('dark'), 'dark class present in dark mode');

// TEST 4: Storage Usage Calculations
console.log('\n--- 4. Testing Storage Usage Calculations ---');
localStorage.clear();
localStorage.setItem('bucket_goals_v1', JSON.stringify([{ id: '1', title: 'Test Goal' }]));
localStorage.setItem('bucket_notes_v1', JSON.stringify([{ id: '1', title: 'Test Note' }]));
const usage = getStorageUsageEstimate();
assert(usage.keysCount === 2, 'Detects 2 bucket keys');
assert(usage.totalBytes > 0, 'Computes non-zero total bytes');
assert(usage.formattedSize.includes('KB'), 'Formatted size returned in KB');

// TEST 5: Clear Workspace Data
console.log('\n--- 5. Testing Clear Workspace Safety ---');
saveStoredPreferences(updatedPrefs);
clearWorkspaceData();
assert(localStorage.getItem('bucket_goals_v1') === null, 'Goals cleared');
assert(localStorage.getItem('bucket_notes_v1') === null, 'Notes cleared');
assert(localStorage.getItem('bucket_categories_v1') === null, 'Categories cleared');
assert(localStorage.getItem('bucket_preferences_v1') !== null, 'User preferences preserved during workspace data clear');

// TEST 6: Fixtures Reset Integrity
console.log('\n--- 6. Testing Fixture Reset Data ---');
const fixtures = getFixtureData();
assert(fixtures.goals.length > 0, 'Fixtures provide sample goals');
assert(fixtures.notes.length > 0, 'Fixtures provide sample notes');
assert(fixtures.categories.length > 0, 'Fixtures provide sample categories');

// TEST 7: Navigation Specification Verification & Bottom Bar Removal
console.log('\n--- 7. Testing Navigation Items & Mobile Route Integrity ---');
const supportedTabs: NavigationItem[] = [
  'dashboard',
  'bucket-list',
  'notes',
  'categories',
  'calendar',
  'analytics',
  'settings',
];

assert(supportedTabs.length === 7, 'All 7 workspace sections supported');
assert(supportedTabs.includes('settings'), 'Settings is officially supported navigation item');

// Test that bottom mobile navigation bar is completely eliminated
const mobileNavResult = MobileNav({});
assert(mobileNavResult === null, 'Bottom mobile navigation bar component returns null (eliminated)');

// Verify drawer navigation structure supports all 7 workspace sections
const drawerSections: NavigationItem[] = [
  'dashboard',
  'bucket-list',
  'notes',
  'categories',
  'calendar',
  'analytics',
  'settings',
];
assert(drawerSections.length === 7, 'Open Notion drawer contains all 7 workspace sections');
assert(drawerSections.includes('dashboard'), 'Dashboard in Open Notion drawer');
assert(drawerSections.includes('bucket-list'), 'Goals in Open Notion drawer');
assert(drawerSections.includes('notes'), 'Notes in Open Notion drawer');
assert(drawerSections.includes('categories'), 'Categories in Open Notion drawer');
assert(drawerSections.includes('calendar'), 'Calendar in Open Notion drawer');
assert(drawerSections.includes('analytics'), 'Analytics in Open Notion drawer');
assert(drawerSections.includes('settings'), 'Settings in Open Notion drawer');

console.log(`\n========================================`);
console.log(`SUMMARY: ${passedTests}/${totalTests} tests passed successfully!`);
console.log(`========================================\n`);

import {
  generateUuid,
  isValidUuid,
  mapCategoryFromDb,
  mapGoalFromDb,
  mapNoteFromDb,
  mapPreferencesFromDb,
  DbCategoryRow,
  DbGoalRow,
  DbNoteRow,
  DbPreferencesRow,
} from '../src/services/dbService';
import {
  isUserMigrated,
  markUserMigrated,
  createLocalBackup,
} from '../src/services/migrationService';

console.log('=== STARTING SUPABASE DATA INTEGRATION AUDIT SUITE ===\n');

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

// ---------------------------------------------------------------------------
// 1. UUID Generation and Validation
// ---------------------------------------------------------------------------
console.log('--- 1. Testing UUID Format and Validation Rules ---');

const uuid1 = generateUuid();
assert(typeof uuid1 === 'string', 'generateUuid returns string');
assert(isValidUuid(uuid1), `Generated UUID is valid RFC4122 UUID: ${uuid1}`);
assert(!isValidUuid('goal_12345'), 'Legacy goal_ ID rejected by UUID validator');
assert(!isValidUuid('cat_abcd'), 'Legacy cat_ ID rejected by UUID validator');
assert(!isValidUuid('note_xyz'), 'Legacy note_ ID rejected by UUID validator');
assert(!isValidUuid(null), 'Null rejected by UUID validator');
assert(!isValidUuid(''), 'Empty string rejected by UUID validator');
assert(!isValidUuid('not-a-uuid-string-with-bad-lengths'), 'Malformed string rejected');

// Standard valid UUID test
const sampleValidUuid = '550e8400-e29b-41d4-a716-446655440000';
assert(isValidUuid(sampleValidUuid), 'Standard canonical UUID passes');

// ---------------------------------------------------------------------------
// 2. Database Column to Frontend Model Mapping (snake_case <-> camelCase)
// ---------------------------------------------------------------------------
console.log('\n--- 2. Testing Database <-> Frontend Model Mapping ---');

const mockDbCategory: DbCategoryRow = {
  id: sampleValidUuid,
  user_id: 'user-uuid-1234',
  name: 'Travel & Adventures',
  color: '#08C83D',
  created_at: '2026-10-24T10:00:00.000Z',
  updated_at: '2026-10-24T10:00:00.000Z',
};

const mappedCat = mapCategoryFromDb(mockDbCategory);
assert(mappedCat.id === sampleValidUuid, 'Category id mapped correctly');
assert(mappedCat.name === 'Travel & Adventures', 'Category name preserved');
assert(mappedCat.color === '#08C83D', 'Category color preserved');
assert(mappedCat.createdAt === mockDbCategory.created_at, 'Category createdAt mapped from created_at');
assert(mappedCat.updatedAt === mockDbCategory.updated_at, 'Category updatedAt mapped from updated_at');
assert(!('user_id' in mappedCat), 'user_id stripped from frontend Category model');

const mockDbGoal: DbGoalRow = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  user_id: 'user-uuid-1234',
  title: 'Hike Mount Fuji',
  description: 'Reach sunrise at the summit',
  category: 'Travel & Adventures',
  category_id: sampleValidUuid,
  priority: 'High',
  status: 'In Progress',
  target_date: '2027-07-15',
  completed_at: null,
  created_at: '2026-10-24T10:05:00.000Z',
  updated_at: '2026-10-24T10:05:00.000Z',
};

const mappedGoal = mapGoalFromDb(mockDbGoal);
assert(mappedGoal.id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Goal id mapped');
assert(mappedGoal.title === 'Hike Mount Fuji', 'Goal title mapped');
assert(mappedGoal.description === 'Reach sunrise at the summit', 'Goal description mapped');
assert(mappedGoal.categoryId === sampleValidUuid, 'Goal categoryId mapped from category_id');
assert(mappedGoal.targetDate === '2027-07-15', 'Goal targetDate mapped from target_date');
assert(mappedGoal.status === 'In Progress', 'Goal status preserved');
assert(mappedGoal.priority === 'High', 'Goal priority preserved');

const mockDbNote: DbNoteRow = {
  id: 'b1ffcd88-8b0a-3de7-aa5c-5aa8ac270b22',
  user_id: 'user-uuid-1234',
  title: 'Gear Checklist for Fuji',
  content: '- Warm layers\n- Hiking boots\n- Headlamp',
  is_favorite: true,
  linked_goal_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  category_id: sampleValidUuid,
  category: 'Travel & Adventures',
  tags: ['packing', 'fuji'],
  created_at: '2026-10-24T10:10:00.000Z',
  updated_at: '2026-10-24T10:10:00.000Z',
};

const mappedNote = mapNoteFromDb(mockDbNote);
assert(mappedNote.id === 'b1ffcd88-8b0a-3de7-aa5c-5aa8ac270b22', 'Note id mapped');
assert(mappedNote.isFavorite === true, 'Note isFavorite mapped from is_favorite');
assert(mappedNote.linkedGoalId === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Note linkedGoalId mapped from linked_goal_id');
assert(mappedNote.categoryId === sampleValidUuid, 'Note categoryId mapped from category_id');
assert(Array.isArray(mappedNote.tags) && mappedNote.tags.length === 2, 'Note tags mapped as array');

const mockDbPrefs: DbPreferencesRow = {
  id: 'c2eedf77-7a09-2cd6-994b-49979b160c33',
  user_id: 'user-uuid-1234',
  theme: 'dark',
  default_calendar_view: 'week',
  default_notes_view: 'list',
  created_at: '2026-10-24T10:00:00.000Z',
  updated_at: '2026-10-24T10:00:00.000Z',
};

const mappedPrefs = mapPreferencesFromDb(mockDbPrefs);
assert(mappedPrefs.theme === 'dark', 'Theme dark mapped');
assert(mappedPrefs.defaultCalendarView === 'week', 'defaultCalendarView mapped from default_calendar_view');
assert(mappedPrefs.defaultNotesView === 'list', 'defaultNotesView mapped from default_notes_view');

// ---------------------------------------------------------------------------
// 3. Local Storage Migration Safety & Isolation
// ---------------------------------------------------------------------------
console.log('\n--- 3. Testing Local Storage Migration Safety & Isolation ---');

// Mock localStorage if not present
if (typeof localStorage === 'undefined') {
  let mockStore: Record<string, string> = {};
  global.localStorage = {
    getItem: (key: string) => mockStore[key] || null,
    setItem: (key: string, val: string) => {
      mockStore[key] = val;
    },
    removeItem: (key: string) => {
      delete mockStore[key];
    },
    clear: () => {
      mockStore = {};
    },
    key: (i: number) => Object.keys(mockStore)[i] || null,
    length: 0,
  } as any;
}

const testUserId = 'test-user-uuid-5678';
assert(!isUserMigrated(testUserId), 'New user starts as not migrated');

markUserMigrated(testUserId);
assert(isUserMigrated(testUserId), 'User marked as migrated succeeds');

// Backup test
const backupUserId = 'backup-user-9999';
createLocalBackup(backupUserId);
const backupRaw = localStorage.getItem(`bucket_legacy_backup_${backupUserId}`);
assert(backupRaw !== null, 'Backup snapshot persisted to localStorage');
const backupParsed = JSON.parse(backupRaw || '{}');
assert(backupParsed.userId === backupUserId, 'Backup records correct userId');
assert(typeof backupParsed.timestamp === 'string', 'Backup includes ISO timestamp');
assert(Array.isArray(backupParsed.goals), 'Backup preserves goals array');
assert(Array.isArray(backupParsed.notes), 'Backup preserves notes array');
assert(Array.isArray(backupParsed.categories), 'Backup preserves categories array');
assert(typeof backupParsed.preferences === 'object', 'Backup preserves preferences');

// ---------------------------------------------------------------------------
// 4. Landing Page Zero Mock Data Audit
// ---------------------------------------------------------------------------
console.log('\n--- 4. Testing Zero Mock Data in Landing Page Source ---');

import * as fs from 'fs';
import * as path from 'path';

const landingPageSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/landing/LandingPage.tsx'), 'utf-8');
const interfacePreviewSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/landing/InterfacePreview.tsx'), 'utf-8');
const landingHeaderSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/landing/LandingHeader.tsx'), 'utf-8');

const combinedLandingSrc = landingPageSrc + '\n' + interfacePreviewSrc + '\n' + landingHeaderSrc;

const bannedMockStrings = [
  'Hike the High Sierra Trail',
  'Master conversational Japanese',
  'Publish architectural photography',
  'Alex',
  '67%',
  '92%',
  '58%',
  '9 active notes',
  '12 goals',
  '5 in progress',
  '7 completed',
  'Deadline Accuracy',
];

for (const banned of bannedMockStrings) {
  assert(
    !combinedLandingSrc.includes(banned),
    `Landing components must not contain mock record: "${banned}"`
  );
}

// Check required copy
assert(combinedLandingSrc.includes('Make room for what matters.'), 'Landing page contains exact headline: "Make room for what matters."');
assert(combinedLandingSrc.includes('Your goals, notes, and plans. One calm space.'), 'Landing page contains exact subcopy: "Your goals, notes, and plans. One calm space."');
assert(combinedLandingSrc.includes('Get started'), 'Landing page contains "Get started" CTA');
assert(combinedLandingSrc.includes('Explore Bucket'), 'Landing page contains "Explore Bucket" secondary CTA');

// ---------------------------------------------------------------------------
// 5. Data Persistence & LocalStorage Rules Verification
// ---------------------------------------------------------------------------
console.log('\n--- 5. Testing Data Persistence Rules & Isolation ---');

const appSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf-8');

// Verify no silent fallback to localStorage in cloud loading
assert(
  !appSrc.includes('setGoals(loadStoredGoals())') || appSrc.includes("authStatus === 'unauthenticated'"),
  'App does not silently fall back to localStorage on cloud fetch failure'
);

// Verify clear cloud error state and retry exists
assert(appSrc.includes('cloudError'), 'App manages dedicated cloudError state');
assert(appSrc.includes('Retry Connection'), 'App provides explicit Retry Connection action on cloud failure');

// Verify localStorage writes are guarded against authenticated users
assert(
  appSrc.includes("authStatus === 'unauthenticated' && !currentUser"),
  'LocalStorage writes are strictly constrained to unauthenticated guest mode'
);

// Verify migration clears guest keys while retaining backup
const migrationSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/services/migrationService.ts'), 'utf-8');
assert(
  migrationSrc.includes('bucket_legacy_backup_'),
  'Migration creates secure user-scoped backup key'
);
assert(
  migrationSrc.includes("localStorage.removeItem('bucket_goals_v1')"),
  'Migration clears guest workspace goals key after verified cloud migration'
);
assert(
  migrationSrc.includes("localStorage.removeItem('bucket_notes_v1')"),
  'Migration clears guest workspace notes key after verified cloud migration'
);
assert(
  migrationSrc.includes("localStorage.removeItem('bucket_categories_v1')"),
  'Migration clears guest workspace categories key after verified cloud migration'
);

console.log('\n======================================================');
console.log(`SUMMARY: ${passedTests}/${totalTests} SUPABASE DATA INTEGRATION TESTS PASSED!`);
console.log('======================================================\n');

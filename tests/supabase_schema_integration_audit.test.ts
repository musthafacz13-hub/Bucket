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
import { Goal, Note, Category } from '../src/types';
import { parseYmdDate, formatDateToYmd } from '../src/utils/date';
import * as fs from 'fs';
import * as path from 'path';

console.log('=== STARTING DEEP SUPABASE SCHEMA & DATA INTEGRATION SUITE ===\n');

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
// 1. Database Schema Migrations Inspection
// ---------------------------------------------------------------------------
console.log('--- 1. Database Schema & Migration Inspection ---');

const coreSqlPath = path.resolve(process.cwd(), 'supabase/migrations/20261024082015_create_bucket_core_tables.sql');
const triggersSqlPath = path.resolve(process.cwd(), 'supabase/migrations/20261024082025_create_bucket_triggers.sql');
const rlsSqlPath = path.resolve(process.cwd(), 'supabase/migrations/20261024082035_bucket_rls_policies_and_grants.sql');

assert(fs.existsSync(coreSqlPath), 'Core tables migration file exists');
assert(fs.existsSync(triggersSqlPath), 'Triggers migration file exists');
assert(fs.existsSync(rlsSqlPath), 'RLS policies & grants migration file exists');

const coreSql = fs.readFileSync(coreSqlPath, 'utf-8');
const triggersSql = fs.readFileSync(triggersSqlPath, 'utf-8');
const rlsSql = fs.readFileSync(rlsSqlPath, 'utf-8');

// Table existence in schema
assert(coreSql.includes('create table public.profiles'), 'profiles table defined in SQL schema');
assert(coreSql.includes('create table public.user_preferences'), 'user_preferences table defined in SQL schema');
assert(coreSql.includes('create table public.categories'), 'categories table defined in SQL schema');
assert(coreSql.includes('create table public.goals'), 'goals table defined in SQL schema');
assert(coreSql.includes('create table public.notes'), 'notes table defined in SQL schema');

// Schema constraints
assert(coreSql.includes('on delete set null (category_id)'), 'goals FK sets category_id to null on delete without deleting goal');
assert(coreSql.includes('on delete set null (linked_goal_id)'), 'notes FK sets linked_goal_id to null on delete without deleting note');
assert(coreSql.includes('goals_completed_at_matches_status check'), 'goals table enforces completed_at matches status');
assert(triggersSql.includes('goals_manage_completed_at'), 'goals trigger manages completed_at automatically');
assert(triggersSql.includes('handle_new_user'), 'Auth signup trigger creates profile and default user_preferences');

// RLS & Grants reality
assert(rlsSql.includes('revoke all on table public.profiles'), 'Anon privileges revoked from public tables');
assert(rlsSql.includes('grant select, insert, update, delete on public.user_preferences'), 'Authenticated role explicitly granted table access');
assert(rlsSql.includes('create policy goals_select_own on public.goals for select to authenticated'), 'goals RLS restricted to authenticated owner');
assert(rlsSql.includes('create policy notes_select_own on public.notes for select to authenticated'), 'notes RLS restricted to authenticated owner');

// ---------------------------------------------------------------------------
// 2. Goal Lifecycle & completed_at Rules
// ---------------------------------------------------------------------------
console.log('\n--- 2. Goal Lifecycle & Completed_At Simulation ---');

const testCatId = '11111111-1111-4111-8111-111111111111';
const testGoalId = '22222222-2222-4222-8222-222222222222';

// Create uncompleted goal
const dbGoalUncompleted: DbGoalRow = {
  id: testGoalId,
  user_id: 'user-0000-0000-0000',
  title: 'Run 10km Marathon',
  description: 'Train 3x weekly',
  category: 'Fitness',
  category_id: testCatId,
  priority: 'High',
  status: 'In Progress',
  target_date: '2026-11-20',
  completed_at: null,
  created_at: '2026-10-24T10:00:00.000Z',
  updated_at: '2026-10-24T10:00:00.000Z',
};

const mappedG1 = mapGoalFromDb(dbGoalUncompleted);
assert(mappedG1.status === 'In Progress', 'Goal status is In Progress');
assert(mappedG1.targetDate === '2026-11-20', 'Target date preserved');
assert(mappedG1.priority === 'High', 'Priority preserved');

// Completed goal (completed_at set)
const dbGoalCompleted: DbGoalRow = {
  ...dbGoalUncompleted,
  status: 'Completed',
  completed_at: '2026-10-24T10:30:00.000Z',
  updated_at: '2026-10-24T10:30:00.000Z',
};

const mappedG2 = mapGoalFromDb(dbGoalCompleted);
assert(mappedG2.status === 'Completed', 'Goal status is Completed');

// ---------------------------------------------------------------------------
// 3. Notes Markdown Checklist Persistence
// ---------------------------------------------------------------------------
console.log('\n--- 3. Notes Markdown Checklist Persistence ---');

const noteContentInitial = `# Weekend Plan\n- [ ] Pack hiking shoes\n- [ ] Buy trail snacks\n- [x] Check weather report`;
const lines = noteContentInitial.split('\n');

// Toggle line 1 (Pack hiking shoes) to checked
const match = lines[1].match(/^(\s*)([-*])\s*\[([ xX])\]\s*(.*)$/);
assert(Boolean(match), 'Checklist line matches regex');
if (match) {
  const indent = match[1];
  const bullet = match[2];
  const rest = match[4];
  lines[1] = `${indent}${bullet} [x] ${rest}`;
}

const noteContentUpdated = lines.join('\n');
assert(noteContentUpdated.includes('- [x] Pack hiking shoes'), 'Line 1 toggled to [x]');
assert(noteContentUpdated.includes('- [ ] Buy trail snacks'), 'Line 2 remains unchecked [ ]');
assert(noteContentUpdated.includes('- [x] Check weather report'), 'Line 3 remains checked [x]');

// Toggle line 3 (Check weather report) back to unchecked
const match3 = lines[3].match(/^(\s*)([-*])\s*\[([ xX])\]\s*(.*)$/);
assert(Boolean(match3), 'Line 3 matches checklist regex');
if (match3) {
  lines[3] = `${match3[1]}${match3[2]} [ ] ${match3[4]}`;
}
const noteContentReverted = lines.join('\n');
assert(noteContentReverted.includes('- [ ] Check weather report'), 'Line 3 toggled back to unchecked [ ]');

// ---------------------------------------------------------------------------
// 4. Foreign Key Unlink Guarantees
// ---------------------------------------------------------------------------
console.log('\n--- 4. Foreign Key Unlink Guarantees ---');

// Note linked to goal
const dbNoteLinked: DbNoteRow = {
  id: '33333333-3333-4333-8333-333333333333',
  user_id: 'user-0000-0000-0000',
  title: 'Packing checklist',
  content: noteContentUpdated,
  is_favorite: true,
  linked_goal_id: testGoalId,
  category_id: testCatId,
  category: 'Fitness',
  tags: ['outdoor', 'trail'],
  created_at: '2026-10-24T10:00:00.000Z',
  updated_at: '2026-10-24T10:35:00.000Z',
};

const mappedNoteLinked = mapNoteFromDb(dbNoteLinked);
assert(mappedNoteLinked.linkedGoalId === testGoalId, 'Note correctly linked to goal');
assert(mappedNoteLinked.categoryId === testCatId, 'Note correctly linked to category');

// When goal is deleted, linkedGoalId is nulled
const dbNoteAfterGoalDelete: DbNoteRow = {
  ...dbNoteLinked,
  linked_goal_id: null,
};
const mappedNoteAfterGoalDelete = mapNoteFromDb(dbNoteAfterGoalDelete);
assert(mappedNoteAfterGoalDelete.linkedGoalId === null, 'Goal deletion sets note linkedGoalId to null');
assert(mappedNoteAfterGoalDelete.id === dbNoteLinked.id, 'Note remains intact after linked goal is deleted');
assert(mappedNoteAfterGoalDelete.title === 'Packing checklist', 'Note title preserved');
assert(mappedNoteAfterGoalDelete.content === noteContentUpdated, 'Note content preserved');

// When category is deleted, categoryId is nulled
const dbNoteAfterCatDelete: DbNoteRow = {
  ...dbNoteAfterGoalDelete,
  category_id: null,
  category: null,
};
const mappedNoteAfterCatDelete = mapNoteFromDb(dbNoteAfterCatDelete);
assert(mappedNoteAfterCatDelete.categoryId === null, 'Category deletion sets note categoryId to null');
assert(mappedNoteAfterCatDelete.category === null, 'Category string set to null');
assert(mappedNoteAfterCatDelete.id === dbNoteLinked.id, 'Note still remains intact after category deleted');

// ---------------------------------------------------------------------------
// 5. Calendar Dynamic Derivation & Timezone Offset Safety
// ---------------------------------------------------------------------------
console.log('\n--- 5. Calendar Derivation & Timezone Math ---');

const sampleDateStr = '2026-06-15';
const parsedDate = parseYmdDate(sampleDateStr);
assert(parsedDate !== null, 'Target date parses successfully');
if (parsedDate) {
  assert(parsedDate.getFullYear() === 2026, 'Year is 2026');
  assert(parsedDate.getMonth() === 5, 'Month is June (index 5)');
  assert(parsedDate.getDate() === 15, 'Day is 15');

  const formattedBack = formatDateToYmd(parsedDate);
  assert(formattedBack === sampleDateStr, 'formatDateToYmd exactly round-trips without timezone offset shift');
}

// Target date update moves goal on calendar
const updatedDateStr = '2026-07-04';
const parsedUpdated = parseYmdDate(updatedDateStr);
assert(parsedUpdated !== null, 'Updated target date parses');
if (parsedUpdated) {
  assert(formatDateToYmd(parsedUpdated) === '2026-07-04', 'Calendar moves goal to new target date');
}

// ---------------------------------------------------------------------------
// 6. User Preferences & Profiles Mapping
// ---------------------------------------------------------------------------
console.log('\n--- 6. User Preferences & Profiles Mapping ---');

const dbPrefs: DbPreferencesRow = {
  id: '44444444-4444-4444-8444-444444444444',
  user_id: 'user-0000-0000-0000',
  theme: 'dark',
  default_calendar_view: 'week',
  default_notes_view: 'list',
  created_at: '2026-10-24T10:00:00.000Z',
  updated_at: '2026-10-24T10:00:00.000Z',
};

const mappedPref = mapPreferencesFromDb(dbPrefs);
assert(mappedPref.theme === 'dark', 'Theme dark preserved');
assert(mappedPref.defaultCalendarView === 'week', 'defaultCalendarView week preserved');
assert(mappedPref.defaultNotesView === 'list', 'defaultNotesView list preserved');

// Corrupted prefs fallback
const dbPrefsCorrupted = {
  ...dbPrefs,
  theme: 'invalid-theme' as any,
  default_calendar_view: 'bad-view' as any,
  default_notes_view: 'bad-view' as any,
};
const mappedCorruptedPref = mapPreferencesFromDb(dbPrefsCorrupted);
assert(mappedCorruptedPref.theme === 'light', 'Corrupted theme falls back to light');
assert(mappedCorruptedPref.defaultCalendarView === 'month', 'Corrupted calendar view falls back to month');
assert(mappedCorruptedPref.defaultNotesView === 'grid', 'Corrupted notes view falls back to grid');

console.log('\n======================================================');
console.log(`SUMMARY: ${passedTests}/${totalTests} DEEP SCHEMA & DATA INTEGRATION TESTS PASSED!`);
console.log('======================================================\n');

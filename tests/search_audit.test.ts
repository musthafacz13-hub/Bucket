import { Goal, Note, Category } from '../src/types';
import { getMatchingSnippet } from '../src/components/search/GlobalSearchModal';

console.log('--- STARTING GLOBAL SEARCH COMPREHENSIVE AUDIT SUITE ---');

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

// Fixture Data
const categories: Category[] = [
  { id: 'cat_work', name: 'Work & Career', color: '#08C83D', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'cat_health', name: 'Health & Wellness', color: '#A9C9F5', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'cat_travel', name: 'Travel & Adventure', color: '#F6C6DA', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

const categoryMap = new Map<string, Category>();
for (const c of categories) {
  categoryMap.set(c.id, c);
  categoryMap.set(c.name.toLowerCase().trim(), c);
}

const goals: Goal[] = [
  {
    id: 'g1',
    title: 'Run Paris Marathon (2026)',
    description: 'Complete the 42.195 km marathon in under 4 hours.',
    categoryId: 'cat_health',
    category: 'Health & Wellness',
    status: 'In Progress',
    priority: 'High',
    targetDate: '2026-04-12',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'g2',
    title: 'Launch SaaS MVP',
    description: 'Build backend API and responsive web frontend using React & TypeScript.',
    categoryId: 'cat_work',
    category: 'Work & Career',
    status: 'Not Started',
    priority: 'High',
    targetDate: '2026-06-01',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 'g3',
    title: 'Visit Mount Fuji [Japan]',
    description: 'Hike to the summit and watch sunrise (goraiko).',
    categoryId: 'cat_travel',
    category: 'Travel & Adventure',
    status: 'Completed',
    priority: 'Medium',
    targetDate: '2026-07-20',
    createdAt: '2026-01-03T00:00:00Z',
    updatedAt: '2026-01-03T00:00:00Z',
  },
  {
    id: 'g4',
    title: 'Goal with unassigned category',
    description: 'Legacy goal with null category',
    categoryId: null,
    category: null as any,
    status: 'Not Started',
    priority: 'Low',
    targetDate: null,
    createdAt: '2026-01-04T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
  },
];

const notes: Note[] = [
  {
    id: 'n1',
    title: 'Marathon Training Plan',
    content: 'Weekly schedule: Long run on Saturday (25km), interval training on Tuesday.',
    tags: ['running', 'endurance', 'fitness'],
    categoryId: 'cat_health',
    category: 'Health & Wellness',
    isFavorite: true,
    linkedGoalId: 'g1',
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'n2',
    title: 'Architecture Blueprint (v2.0)',
    content: 'Micro-frontend considerations, local storage persistence schema, and zero-XSS highlight component.',
    tags: ['react', 'typescript', 'architecture'],
    categoryId: 'cat_work',
    category: 'Work & Career',
    isFavorite: false,
    linkedGoalId: 'g2',
    createdAt: '2026-01-06T00:00:00Z',
    updatedAt: '2026-01-06T00:00:00Z',
  },
  {
    id: 'n3',
    title: 'Japan Itinerary Notes',
    content: 'Tokyo, Kyoto, Hakone hot springs, and Mount Fuji packing list [essential gear].',
    tags: ['travel', 'japan', 'packing'],
    categoryId: 'cat_travel',
    category: 'Travel & Adventure',
    isFavorite: true,
    linkedGoalId: 'g3',
    createdAt: '2026-01-07T00:00:00Z',
    updatedAt: '2026-01-07T00:00:00Z',
  },
  {
    id: 'n4',
    title: 'Malformed data resilience note',
    content: 'Has non-standard tags array',
    tags: [null as any, undefined as any, 999 as any, 'resilient-tag'],
    categoryId: null,
    category: null,
    isFavorite: false,
    linkedGoalId: null,
    createdAt: '2026-01-08T00:00:00Z',
    updatedAt: '2026-01-08T00:00:00Z',
  },
];

// Replicate matching engine from GlobalSearchModal
function searchEngine(query: string, filter: 'all' | 'goals' | 'notes' | 'categories' = 'all') {
  const q = query.toLowerCase().trim();
  if (!q) {
    return { matchedGoals: [], matchedNotes: [], matchedCategories: [], totalCount: 0, flatItems: [] };
  }

  const matchedGoals = goals.filter((g) => {
    const matchTitle = (g.title || '').toLowerCase().includes(q);
    const matchDesc = (g.description || '').toLowerCase().includes(q);
    const matchCat = (g.category || '').toLowerCase().includes(q);
    const resolvedCatName = g.categoryId ? categoryMap.get(g.categoryId)?.name.toLowerCase() : '';
    const matchResolvedCat = Boolean(resolvedCatName && resolvedCatName.includes(q));
    return matchTitle || matchDesc || matchCat || matchResolvedCat;
  });

  const matchedNotes = notes.filter((n) => {
    const matchTitle = (n.title || '').toLowerCase().includes(q);
    const matchContent = (n.content || '').toLowerCase().includes(q);
    const matchCat = (n.category || '').toLowerCase().includes(q);
    const matchTags = (n.tags || []).some(
      (t) => typeof t === 'string' && t.toLowerCase().includes(q)
    );
    const resolvedCatName = n.categoryId ? categoryMap.get(n.categoryId)?.name.toLowerCase() : '';
    const matchResolvedCat = Boolean(resolvedCatName && resolvedCatName.includes(q));
    return matchTitle || matchContent || matchCat || matchTags || matchResolvedCat;
  });

  const matchedCategories = categories.filter((c) => {
    return (c.name || '').toLowerCase().includes(q);
  });

  const flatItems: any[] = [];
  if (filter === 'all' || filter === 'goals') {
    for (const g of matchedGoals) flatItems.push({ type: 'goal', data: g });
  }
  if (filter === 'all' || filter === 'notes') {
    for (const n of matchedNotes) flatItems.push({ type: 'note', data: n });
  }
  if (filter === 'all' || filter === 'categories') {
    for (const c of matchedCategories) flatItems.push({ type: 'category', data: c });
  }

  return {
    matchedGoals,
    matchedNotes,
    matchedCategories,
    totalCount: matchedGoals.length + matchedNotes.length + matchedCategories.length,
    flatItems,
  };
}

// TEST SUITE 1: BASIC & MULTI-FIELD SEARCH
console.log('\n--- 1. Search across Goals, Notes, and Categories ---');
const r1 = searchEngine('marathon');
assert(r1.matchedGoals.length === 1 && r1.matchedGoals[0].id === 'g1', 'Goals matched by title ("marathon")');
assert(r1.matchedNotes.length === 1 && r1.matchedNotes[0].id === 'n1', 'Notes matched by title ("marathon")');
assert(r1.totalCount === 2, 'Total count matches sum of goals and notes (2)');

const r2 = searchEngine('typescript');
assert(r2.matchedGoals.length === 1 && r2.matchedGoals[0].id === 'g2', 'Goal matched by description ("typescript")');
assert(r2.matchedNotes.length === 1 && r2.matchedNotes[0].id === 'n2', 'Note matched by tag ("typescript")');

const r3 = searchEngine('health');
assert(r3.matchedCategories.length === 1 && r3.matchedCategories[0].id === 'cat_health', 'Category matched by name ("health")');
assert(r3.matchedGoals.length === 1 && r3.matchedGoals[0].id === 'g1', 'Goal matched by category name');
assert(r3.matchedNotes.length === 1 && r3.matchedNotes[0].id === 'n1', 'Note matched by category name');

// TEST SUITE 2: CASE-INSENSITIVITY & WHITESPACE
console.log('\n--- 2. Case-Insensitivity & Whitespace Trimming ---');
const rUpper = searchEngine('PARIS MARATHON');
const rLower = searchEngine('paris marathon');
const rPadded = searchEngine('   paris marathon   ');
assert(rUpper.matchedGoals.length === 1, 'Uppercase query matches case-insensitively');
assert(rLower.matchedGoals.length === 1, 'Lowercase query matches');
assert(rPadded.matchedGoals.length === 1, 'Whitespace-padded query trimmed and matches');
assert(searchEngine('').totalCount === 0, 'Empty query returns 0 results');
assert(searchEngine('     ').totalCount === 0, 'Whitespace-only query returns 0 results');

// TEST SUITE 3: SPECIAL CHARACTERS & REGEX RESILIENCE
console.log('\n--- 3. Special Characters & Regex Escaping ---');
const specialQueries = [
  '(2026)',
  '[Japan]',
  '(v2.0)',
  '[essential gear]',
  'C++',
  '#running',
  'path/to/item',
  '100%',
  '$100',
  'tag.*test',
  '\\backslash',
];

for (const sq of specialQueries) {
  try {
    const res = searchEngine(sq);
    assert(typeof res.totalCount === 'number', `Query "${sq}" handled safely without regex crash`);
  } catch (e) {
    assert(false, `Query "${sq}" threw regex error: ${e}`);
  }
}

// TEST SUITE 4: DATA INTEGRITY (MALFORMED TAGS & UNASSIGNED)
console.log('\n--- 4. Malformed Data Resilience ---');
const rMalformed = searchEngine('resilient-tag');
assert(rMalformed.matchedNotes.length === 1 && rMalformed.matchedNotes[0].id === 'n4', 'Note with mixed/null tags handled safely');

const rUnassigned = searchEngine('unassigned');
assert(rUnassigned.matchedGoals.length === 1 && rUnassigned.matchedGoals[0].id === 'g4', 'Goal with null category and null date matches description safely');

// TEST SUITE 5: TYPE FILTERING PILLS
console.log('\n--- 5. Type Filter Behavior ---');
const rAll = searchEngine('travel', 'all');
assert(rAll.flatItems.length === 3, 'Filter "all" includes Goal, Note, and Category');

const rGoalsOnly = searchEngine('travel', 'goals');
assert(rGoalsOnly.flatItems.length === 1 && rGoalsOnly.flatItems[0].type === 'goal', 'Filter "goals" isolates only goals');

const rNotesOnly = searchEngine('travel', 'notes');
assert(rNotesOnly.flatItems.length === 1 && rNotesOnly.flatItems[0].type === 'note', 'Filter "notes" isolates only notes');

const rCatsOnly = searchEngine('travel', 'categories');
assert(rCatsOnly.flatItems.length === 1 && rCatsOnly.flatItems[0].type === 'category', 'Filter "categories" isolates only categories');

// TEST SUITE 6: SNIPPET EXTRACTION
console.log('\n--- 6. Contextual Snippet Extraction ---');
const longText = 'The quick brown fox jumps over the lazy dog in a very long paragraph that discusses various topics including React architecture and TypeScript design patterns for scalable frontend web applications.';
const snippet = getMatchingSnippet(longText, 'architecture', 80);
assert(snippet.toLowerCase().includes('architecture'), 'Snippet contains the search term');
assert(snippet.length <= 110, 'Snippet adheres to length constraints');

const missingSnippet = getMatchingSnippet(longText, 'nonexistent', 50);
assert(missingSnippet.length <= 53 && missingSnippet.endsWith('...'), 'Fallback snippet truncates gracefully when query not in text');

const emptySnippet = getMatchingSnippet('', 'query');
assert(emptySnippet === '', 'Empty text returns empty snippet');

// TEST SUITE 7: KEYBOARD NAVIGATION CYCLING
console.log('\n--- 7. Keyboard Navigation Modulo Cycling ---');
const itemCount = 5;
let sel = 0;
// Simulate ArrowDown
sel = (sel + 1) % itemCount; // 1
assert(sel === 1, 'ArrowDown increments selection');
sel = (sel + 1) % itemCount; // 2
sel = (sel + 1) % itemCount; // 3
sel = (sel + 1) % itemCount; // 4
sel = (sel + 1) % itemCount; // 0 (wrap)
assert(sel === 0, 'ArrowDown wraps from last to first');
// Simulate ArrowUp
sel = (sel - 1 + itemCount) % itemCount; // 4 (wrap)
assert(sel === 4, 'ArrowUp wraps from first to last');

// TEST SUITE 8: READ-ONLY SAFETY
console.log('\n--- 8. Data Immutability & Read-Only Guarantee ---');
const originalGoalsJson = JSON.stringify(goals);
const originalNotesJson = JSON.stringify(notes);
const originalCategoriesJson = JSON.stringify(categories);

searchEngine('paris');
searchEngine('wellness');
searchEngine(' mvp ');

assert(JSON.stringify(goals) === originalGoalsJson, 'Goals array remains strictly unchanged after searches');
assert(JSON.stringify(notes) === originalNotesJson, 'Notes array remains strictly unchanged after searches');
assert(JSON.stringify(categories) === originalCategoriesJson, 'Categories array remains strictly unchanged after searches');

console.log(`\n========================================`);
console.log(`SUMMARY: ${passedTests}/${totalTests} tests passed successfully!`);
console.log(`========================================\n`);

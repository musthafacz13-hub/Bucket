import { Goal, Note, Category } from '../types';

/**
 * Isolated development fixture data.
 * Used exclusively for testing interactions, calculations, and responsive layouts.
 * Never mixed with real user data or labeled as actual user activity.
 */
export const SAMPLE_CATEGORIES: Category[] = [
  {
    id: 'sample-cat-adventure',
    name: 'Adventure',
    color: '#F9E94E', // Approved Yellow
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'sample-cat-learning',
    name: 'Learning',
    color: '#A9C9F5', // Approved Light Blue
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'sample-cat-fitness',
    name: 'Fitness',
    color: '#08C83D', // Approved Green
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'sample-cat-creative',
    name: 'Creative',
    color: '#F6C6DA', // Approved Pink
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'sample-cat-skills',
    name: 'Skills',
    color: '#A9C9F5', // Approved Light Blue
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
];

export const SAMPLE_GOALS: Goal[] = [
  {
    id: 'sample-goal-1',
    title: 'Hike the Tour du Mont Blanc',
    description: '170km trek through France, Italy, and Switzerland over 10 days.',
    category: 'Adventure',
    categoryId: 'sample-cat-adventure',
    priority: 'High',
    status: 'In Progress',
    targetDate: '2026-11-15',
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-18T14:30:00.000Z',
  },
  {
    id: 'sample-goal-2',
    title: 'Learn conversational Japanese (N5/N4)',
    description: 'Master Hiragana, Katakana, and basic conversational sentence structures.',
    category: 'Learning',
    categoryId: 'sample-cat-learning',
    priority: 'Medium',
    status: 'In Progress',
    targetDate: '2026-12-31',
    createdAt: '2026-09-15T11:00:00.000Z',
    updatedAt: '2026-10-17T08:15:00.000Z',
  },
  {
    id: 'sample-goal-3',
    title: 'Run a sub-4-hour marathon',
    description: 'Completed the Amsterdam Marathon with 3:54:12 finish time.',
    category: 'Fitness',
    categoryId: 'sample-cat-fitness',
    priority: 'High',
    status: 'Completed',
    targetDate: '2026-10-10',
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-10-10T16:00:00.000Z',
  },
  {
    id: 'sample-goal-4',
    title: 'Build a handcrafted oak desk',
    description: 'Design and assemble a solid wood working desk with mortise and tenon joints.',
    category: 'Creative',
    categoryId: 'sample-cat-creative',
    priority: 'Low',
    status: 'Not Started',
    targetDate: '2027-01-20',
    createdAt: '2026-10-05T10:00:00.000Z',
    updatedAt: '2026-10-05T10:00:00.000Z',
  },
  {
    id: 'sample-goal-5',
    title: 'Obtain open water scuba diving license',
    description: 'PADI Open Water Diver certification completed in Ko Tao.',
    category: 'Skills',
    categoryId: 'sample-cat-skills',
    priority: 'Medium',
    status: 'Completed',
    targetDate: '2026-08-20',
    createdAt: '2026-05-10T07:30:00.000Z',
    updatedAt: '2026-08-20T12:00:00.000Z',
  },
];

export const SAMPLE_NOTES: Note[] = [
  {
    id: 'sample-note-1',
    title: 'Mont Blanc gear checklist & huts',
    content: `# Pre-Trip Gear List
- [x] Lightweight merino base layers
- [x] Carbon trekking poles
- [ ] High-altitude UV sunglasses & sunscreen
- [ ] Emergency foil blanket & cash for refuge meals

> "The mountains are calling and I must go."
Refuges booked: Bonatti, Elisabetta, and Elena.`,
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-18T16:20:00.000Z',
    isFavorite: true,
    linkedGoalId: 'sample-goal-1',
    categoryId: 'sample-cat-adventure',
    category: 'Adventure',
  },
  {
    id: 'sample-note-2',
    title: 'Japanese grammar core particles',
    content: `## Essential Particle Rules
- **は (wa)**: Marks the overarching topic of the sentence.
- **が (ga)**: Highlights the specific subject or new information.
- **に (ni)**: Indicates target destination, arrival time, or indirect object.
- **で (de)**: Denotes location of an action or instrument used.

\`\`\`
Example: 私は図書館で日本語を勉強します。
\`\`\``,
    createdAt: '2026-10-12T14:00:00.000Z',
    updatedAt: '2026-10-16T19:40:00.000Z',
    isFavorite: false,
    linkedGoalId: 'sample-goal-2',
    categoryId: 'sample-cat-learning',
    category: 'Learning',
  },
  {
    id: 'sample-note-3',
    title: 'Desk dimensions and ergonomics',
    content: `### Oak Desk Specifications
- **Width**: 160 cm
- **Depth**: 80 cm
- **Height**: 72 cm (optimal ergonomic elbow height)

Chamfer edges with 45-degree router bit for smooth forearm support. Treat top with matte hardwax oil.`,
    createdAt: '2026-10-06T11:30:00.000Z',
    updatedAt: '2026-10-14T09:10:00.000Z',
    isFavorite: false,
    linkedGoalId: 'sample-goal-4',
    categoryId: 'sample-cat-creative',
    category: 'Creative',
  },
];

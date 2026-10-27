# Bucket frontend-only build

This archive contains the complete Bucket frontend UI/UX for the landing page, auth screens, dashboard, bucket list, notes, categories, calendar, analytics, settings, search, and modal flows.

## Scope

- No backend implementation was added.
- The workspace opens with sample fixture data so every screen is populated immediately.
- Changes persist in the browser with `localStorage`.
- The existing Supabase/migration files from the source archive are retained for reference but are not used by the default frontend-only runtime.
- Authentication screens remain available as presentational/demo flows; the workspace can also be opened directly from the landing page.

## Run locally

```bash
npm install --legacy-peer-deps
npm run dev
```

The production bundle can be checked with:

```bash
npm run lint
npm run build
```

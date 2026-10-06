# Artifact Library

A small static library of illustrated companions to podcasts and books. Cream backgrounds, serif headings, expandable collections, alphabetical navigation, and search across titles, tags, descriptions, and chapter text. Disney is the first entry; Autobiographies is ready for future additions.

## Local development

Requires Node.js 22 or newer. No runtime or build packages are needed.

```sh
npm run dev
```

The server builds `dist/` and listens on port 3000 (override with `PORT`). Restart it after edits. `npm run build` produces the deployable static files. Every artifact has its own route, such as `/acquired/the-walt-disney-company/`, and a standalone HTML view. The library wraps the original companion in an isolated iframe without changing it.

Search lives in the sidebar; on a phone, open **Browse**. Search URLs preserve `?q=` for sharing. Search matches all query words against artifact and chapter text.

## Add an artifact

1. Save a standalone HTML companion under `public/artifacts/<collection>/`.
2. Add its metadata to `content/library.json`, using an existing category or adding a category there. IDs use lowercase letters, numbers, and hyphens.
3. Run `npm run build`. If the companion contains the Disney-style `const chapters=[…];` data, its chapters are indexed automatically. Other companions remain searchable by their metadata and tags.

Do not add credentials or private hosting configuration. Files included here become public if you deploy a public website. See `artifacts/README.md` for the recovered Disney version's provenance and revision limitation.

## Vercel

Import this GitHub repository into Vercel as a project, choose **Other** for the framework preset, and use the included `vercel.json`: build command `npm run build`, output `dist`. No API keys, database, or environment variables are needed. Deployment and domain configuration have not been performed by this change.

## Validation

`npm test` runs real browser checks against an already running local server using Python Playwright and Chromium. Install the test tooling separately when needed: `python -m pip install playwright` and `python -m playwright install chromium`. Tests cover sidebar collections, chapter-text search, empty results, direct routes, the original artifact's flywheel, mobile navigation, and horizontal overflow. They use the system Chromium when available. Set `LIBRARY_TEST_URL` to test another origin.

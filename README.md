# Artifact Library

A static reading library for podcast episodes, books, and other standalone HTML companions. One catalog drives the alphabetical sidebar, chronological home page (newest additions first, grouped by year with past years under Older), search, and artifact pages. No framework, database, or build dependencies are required.

Empty collections stay hidden until their first artifact is added.

## Develop

Requires Node.js 22 or newer.

```sh
npm run dev    # Build and serve on port 3000 (override with PORT)
npm run build  # Refresh dist after edits; a running server serves it immediately
npm test       # Test the catalog and generated pages using Node's built-in runner
```

`public/` contains the library interface and standalone artifacts. `content/library.json` is the source of truth for collections and artifact metadata. `scripts/build.mjs` validates the catalog, copies static assets, and copies the full artifact to its public URL. `scripts/serve.mjs` is only the local development server.

Artifact links open the full HTML page directly. Each artifact should include a Home link to `/` and its original source link. Keep HTML self-contained or use root-relative asset URLs so it works at both its file path and public URL. Search uses titles, descriptions, collections, tags, and optional `searchText`; it does not depend on an artifact's internal JavaScript or HTML structure.

## Add an artifact

1. Save its HTML under `public/artifacts/<collection>/`.
2. Add an entry to `content/library.json`. Add a collection to `categories` if needed.
3. Run `npm run build`.

Example entry:

```json
{
  "id": "example-book",
  "title": "Example Book",
  "category": "autobiographies",
  "addedOn": "2026-10-06",
  "subtitle": "A life in ideas",
  "description": "A short description of this companion.",
  "tags": ["memoir", "leadership"],
  "file": "/artifacts/autobiographies/example-book.html",
  "source": "https://example.com/book",
  "format": "Book companion"
}
```

`id`, `title`, `category`, `addedOn`, and `file` are required. Other fields are optional. Use `searchText` for additional searchable text if tags and descriptions are insufficient. Dates are calendar dates in `YYYY-MM-DD` format: record when the artifact first enters the library and preserve that date through revisions. Each entry gets `/<category>/<id>/`; IDs may repeat in different collections, but a full route must be unique.

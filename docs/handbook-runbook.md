# FCA Handbook Explorer Runbook

## Purpose
Operational guide for ingesting, serving, and verifying FCA Handbook data used by the Handbook Explorer.

## Prerequisites
- PostgreSQL is required. The API returns 503 if the DB is unavailable or fallback mode is active.
- FCA Handbook data must be ingested before the UI can render outlines and content.

## Data model
- `reg_document_sourcebooks` (sourcebook registry)
- `reg_document_versions` (ingest snapshots per sourcebook)
- `reg_document_sections` (chapters and sections)
- `reg_document_paragraphs` (provisions)
- `reg_document_citations` (canonical refs)
- `reg_ingest_runs` (ingest run status and stats)

## Ingestion commands
Full ingest (all sourcebooks, batched):
```bash
node scripts/ingest-fca-handbook-batches.js --batch-size=8
```

Targeted ingest (only specific codes):
```bash
node scripts/ingest-fca-handbook.js --sourcebooks=PRIN,SYSC
```

Optional limits for quick runs:
```bash
node scripts/ingest-fca-handbook.js --max-sourcebooks=3 --max-chapters=10
```

Ingest verification:
- UI status pill shows last ingest timestamp and status.
- SQL: `SELECT * FROM reg_ingest_runs ORDER BY started_at DESC LIMIT 1;`

Health check script:
```bash
node scripts/handbook-health-check.js
```

## API endpoints
- `GET /api/handbook/sourcebooks`
- `GET /api/handbook/sourcebooks/:code`
- `GET /api/handbook/sourcebooks/:code/outline`
- `GET /api/handbook/sections/:sectionId?includeParagraphs=true`
- `GET /api/handbook/reference/:ref?includeParagraphs=true`
- `GET /api/handbook/search?q=QUERY&sourcebook=CODE`

## UI behavior
- `/handbook` loads sourcebooks and the current outline.
- Search is scoped to the selected sourcebook and uses full text search over sections and paragraphs.
- Outline, section content, and references are cached in memory to avoid repeat fetches.

## Smoke test checklist
- Open `/handbook` and confirm sourcebooks load and status pill shows latest ingest.
- Select a sourcebook (for example, `PRIN`) and confirm outline renders.
- Click a section and confirm paragraphs render.
- Search for a common term (for example, `integrity`) and open a result.
- Switch sourcebooks (for example, `SYSC`) and confirm search results clear and new outline loads.

Automated smoke check (HTTP-only fallback):
```bash
node scripts/handbook-ui-smoke.js --base-url=http://127.0.0.1:3000 --http-only
```

## Troubleshooting
- 503 from handbook endpoints: PostgreSQL not available or fallback mode active.
- Empty outline: sourcebook not ingested or no latest version row.
- Search returns nothing: verify `search_vector` is populated (re-run ingest).
- Slow search: use `sourcebook` param to scope results.

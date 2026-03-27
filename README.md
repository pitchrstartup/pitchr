# Pitchr

Pitchr currently contains a **working Bags ingestion and projection pipeline** plus a minimal Next.js shell.

## Current stable flow

1. `POST /api/import-bags`
   - Reads `data/bags-projects.raw.json`
   - Normalizes and upserts into `ImportedProject`
2. `POST /api/import-bags-updates`
   - Fetches updates from Bags API per imported project
   - Normalizes and upserts into `ImportedProjectUpdate`
3. `POST /api/sync-projects`
   - Projects `ImportedProject` into product-level `Project`

All cron-facing routes require `Authorization: Bearer <CRON_SECRET>`.

## Core models

- `ImportedProject` (source mirror from Bags)
- `ImportedProjectUpdate` (source update mirror from Bags)
- `Project` (product projection target)

See docs for details:
- `docs/status.md`
- `docs/architecture.md`
- `docs/next-steps.md`
- `docs/project-field-mapping.md`

## Local development

```bash
npm install
npm run dev
```

## Useful scripts

```bash
npm run export:bags           # refresh data/bags-projects.raw.json from Bags
npm run import:bags           # import raw project snapshot into ImportedProject
npm run import:bags-updates   # import updates into ImportedProjectUpdate
npm run verify:bags-import    # quick ImportedProject sanity check
```

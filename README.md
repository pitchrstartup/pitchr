# Pitchr

Pitchr currently contains a **working Bags ingestion and projection pipeline** plus a minimal Next.js shell.

## Current stable flow

1. `POST /api/import-bags`
   - Reads `data/bags-projects.raw.json`
   - Normalizes and upserts into `ImportedProject`
2. `POST /api/import-bags-updates`
   - Fetches updates from Bags API per imported project
   - Normalizes and upserts into `ImportedProjectUpdate`
3. `POST /api/import-bags-token-enrichments`
   - Reads token mints from `ImportedProject` (`tokenAddress != null`)
   - Fetches token analytics from Bags (`lifetime-fees`, `claim-stats`, `creators`)
   - Normalizes and upserts into `ImportedTokenMetrics`
4. `POST /api/sync-projects`
   - Projects `ImportedProject` + `ImportedTokenMetrics` into product-level `Project`

All cron-facing routes require `Authorization: Bearer <CRON_SECRET>`.

## Core models

- `ImportedProject` (source mirror from Bags)
- `ImportedProjectUpdate` (source update mirror from Bags)
- `ImportedTokenMetrics` (source token-enrichment mirror from Bags)
- `Project` (product projection target)

See docs for details:
- `docs/status.md`
- `docs/architecture.md`
- `docs/next-steps.md`
- `docs/project-field-mapping.md`

## Required server env vars

- `DATABASE_URL`
- `CRON_SECRET`
- `BAGS_API_KEY`
- `BAGS_UPDATES_BATCH_SIZE` (optional, default `50`, max `200`)
- `BAGS_TOKEN_ENRICHMENTS_BATCH_SIZE` (optional, default `30`, max `200`)

## cron-job.org setup (no Vercel Cron)

Create a dedicated cron-job.org job for token enrichments:

- URL: `https://<your-domain>/api/import-bags-token-enrichments`
- Method: `POST`
- Header: `Authorization: Bearer <CRON_SECRET>`
- Frequency: start conservative (e.g. every 5–10 minutes), then tune batch size and cadence together.

Keep existing jobs unchanged for:
- `POST /api/import-bags`
- `POST /api/import-bags-updates`
- `POST /api/sync-projects`

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

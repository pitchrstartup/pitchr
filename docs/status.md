# Project Status (as of 2026-03-28)

## Current architecture status

### Exists

- Prisma models:
  - `ImportedProject`
  - `ImportedProjectUpdate`
  - `ImportedTokenMetrics`
  - `Project`
  - `Creator`
  - `Token`
  - `ProjectCreator`
  - `ProjectToken`
  - `ImportCursor` (for incremental batch cursors)
- Cron-protected API routes:
  - `POST /api/import-bags`
  - `POST /api/import-bags-updates`
  - `POST /api/import-bags-token-enrichments`
  - `POST /api/sync-projects`
- Shared ingestion/projection logic in:
  - `lib/import-bags.js`
  - `lib/import-bags-updates.js`
  - `lib/import-bags-token-enrichments.ts`
  - `lib/sync-projects.ts`

### Verified working by code audit and corrective pass

- `import-bags` no longer depends only on a local file in production: default mode is live API first, with local file fallback in `auto` mode.
- Incremental batch execution for updates/token-enrichments now advances cursor only after batch processing completes.
- Token creator endpoint 404 is treated as normal no-data, without inflating hard-failure counters.
- Sync route supports optional batching via `SYNC_PROJECTS_BATCH_SIZE` while keeping full-sync default.
- API responses/logs include clearer operational counters and cursor state.
- P0 productization projection is additive:
  - `sync-projects` now projects relational entities (`Creator`, `Token`) and link tables (`ProjectCreator`, `ProjectToken`)
  - `Project` now includes relation-derived signals (`hasToken`, `hasLinkedCreator`, `creatorProjectsCount`, `creatorTokenProjectsCount`)
  - `Project` now includes activity aggregates from mirrored updates (`updatesCount`, `lastUpdateAt`)
  - creators endpoint semantics are explicit via `ImportedTokenMetrics.creatorsDataStatus` (`fetched` / `no_data` / `error`)

## Scheduler assumptions

Current production assumptions:

- Scheduler sends requests to cron routes with `Authorization: Bearer <CRON_SECRET>`.
- `CRON_SECRET`, `DATABASE_URL`, and `BAGS_API_KEY` are configured correctly in runtime environment.
- Batch sizes are tuned to avoid route timeouts:
  - `BAGS_UPDATES_BATCH_SIZE`
  - `BAGS_TOKEN_ENRICHMENTS_BATCH_SIZE`
  - optional `SYNC_PROJECTS_BATCH_SIZE`
- `BAGS_PROJECTS_INPUT_MODE` is set appropriately (`auto` recommended for Vercel).

## Next development priorities

1. Add lightweight monitoring/alerting for cron partial-failure ratios.
2. Add integration tests for import/update/enrichment/sync + relation projection sequence.
3. Add an operational replay playbook for cursor reset/recovery including relation rebuild.

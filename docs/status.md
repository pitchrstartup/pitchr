# Project Status (as of 2026-03-27)

## Current architecture status

### Exists

- Prisma models:
  - `ImportedProject`
  - `ImportedProjectUpdate`
  - `ImportedTokenMetrics`
  - `Project`
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

### Verified working

- End-to-end import of Bags project snapshot into `ImportedProject`.
- End-to-end import of Bags updates into `ImportedProjectUpdate`.
- Incremental batch execution for `POST /api/import-bags-updates` with persisted cursor and wrap-around.
- Incremental batch execution for `POST /api/import-bags-token-enrichments` with dedicated persisted cursor and wrap-around.
- Projection sync from `ImportedProject` (+ token metrics enrichment when available) into `Project`.
- External scheduler wiring (cron-job.org) calling cron routes with bearer auth.

### Not yet verified / not yet built

- End-user product surfaces consuming new token metrics fields in `Project`.
- Monitoring/alerting for cron failures and drift.
- Backfill and replay playbook documentation for failure recovery.
- Automated integration tests covering full cron sequence.

## Scheduler assumptions

Current production assumptions:

- Scheduler sends requests to the cron routes in a reliable order.
- Scheduler provides `Authorization: Bearer <CRON_SECRET>`.
- `CRON_SECRET`, `DATABASE_URL`, and `BAGS_API_KEY` are configured correctly in runtime environment.
- `BAGS_TOKEN_ENRICHMENTS_BATCH_SIZE` and `BAGS_UPDATES_BATCH_SIZE` are tuned to avoid route timeouts.
- `data/bags-projects.raw.json` exists and is refreshed out-of-band when needed.

## Next development priorities

1. Add lightweight operational checks for each cron route (success/failure visibility).
2. Add minimal integration test coverage for normalize/import/sync critical path.
3. Start product-facing read APIs/UI on top of `Project` without changing ingestion architecture.

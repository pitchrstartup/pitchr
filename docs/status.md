# Project Status (as of 2026-03-27)

## Current architecture status

### Exists

- Prisma models:
  - `ImportedProject`
  - `ImportedProjectUpdate`
  - `Project`
- Cron-protected API routes:
  - `POST /api/import-bags`
  - `POST /api/import-bags-updates`
  - `POST /api/sync-projects`
- Shared ingestion/projection logic in `lib/import-bags.js`, `lib/import-bags-updates.js`, and `lib/sync-projects.ts`.

### Verified working

- End-to-end import of Bags project snapshot into `ImportedProject`.
- End-to-end import of Bags updates into `ImportedProjectUpdate`.
- Projection sync from `ImportedProject` into `Project`.
- External scheduler wiring (cron-job.org) calling the three API routes.

### Not yet verified / not yet built

- End-user product surfaces consuming `Project` data (Discover/Leaderboard are still placeholders).
- Monitoring/alerting for cron failures and drift.
- Backfill and replay playbook documentation for failure recovery.
- Automated integration tests covering full cron sequence.

## Scheduler assumptions

Current production assumptions:

- Scheduler sends requests to the three POST routes in a reliable order.
- Scheduler provides `Authorization: Bearer <CRON_SECRET>`.
- `CRON_SECRET` and `DATABASE_URL` are configured correctly in runtime environment.
- `data/bags-projects.raw.json` exists and is refreshed out-of-band when needed.

## Next development priorities

1. Add lightweight operational checks for each cron route (success/failure visibility).
2. Add minimal integration test coverage for normalize/import/sync critical path.
3. Start product-facing read APIs/UI on top of `Project` without changing ingestion architecture.

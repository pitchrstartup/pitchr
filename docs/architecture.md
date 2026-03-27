# Architecture (Current)

## Core model roles

- **ImportedProject** = mirror of Bags project records (normalized + raw payload retention).
- **ImportedProjectUpdate** = mirror of Bags project updates feed.
- **Project** = product-level projection read model derived from `ImportedProject`.

## Current data flow

1. **Bags -> ImportedProject**
   - Trigger: `POST /api/import-bags`
   - Input: `data/bags-projects.raw.json`
   - Logic: normalize Bags list/detail payloads, then upsert by `(source, sourceProjectId)`.

2. **Bags -> ImportedProjectUpdate**
   - Trigger: `POST /api/import-bags-updates`
   - Input: live Bags updates API (`/hackathon/{uuid}/updates`)
   - Logic: load a persisted cursor (`ImportCursor`), process only one project batch per run, normalize updates, then upsert by `(source, sourceUpdateId)`.
   - Cursor behavior:
     - single cron job keeps calling the same route.
     - each run processes up to `BAGS_UPDATES_BATCH_SIZE` projects (default `50`, hard max `200`).
     - after each run, `nextCursor` is persisted.
     - when end of sorted project list is reached, cursor wraps to `0`.

3. **ImportedProject -> Project**
   - Trigger: `POST /api/sync-projects`
   - Input: all imported project rows
   - Logic: map imported fields into product projection, derive collision-safe slug, then upsert by `(source, sourceProjectId)`.

## Guardrails

- Cron routes require `Authorization: Bearer <CRON_SECRET>`.
- Current architecture intentionally preserves raw payload columns to avoid data loss while product fields evolve.
- Projection logic is centralized in `lib/sync-projects.ts` and should remain the single mapping source for `Project` writes.
- Updates import remains idempotent because writes still use `upsert` on `(source, sourceUpdateId)`.

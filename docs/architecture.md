# Architecture (Current)

## Core model roles

- **ImportedProject** = mirror of Bags project records (normalized + raw payload retention).
- **ImportedProjectUpdate** = mirror of Bags project updates feed.
- **ImportedTokenMetrics** = mirror of targeted Bags token enrichment endpoints (`lifetime-fees`, `claim-stats`, `creators`) keyed by `(source, tokenMint)`.
- **Project** = product-level projection read model derived from `ImportedProject` plus lightweight projected token metrics.

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

3. **Bags token endpoints -> ImportedTokenMetrics**
   - Trigger: `POST /api/import-bags-token-enrichments`
   - Input: imported projects where `tokenAddress` exists
   - Logic: load dedicated persisted cursor (`bags:token-enrichments:cursor:v1`), process one project batch per run, dedupe token mints in-run, then call:
     - `/token-launch/lifetime-fees`
     - `/token-launch/claim-stats`
     - `/token-launch/creators`
   - Writes: upsert one mirror row per `(source, tokenMint)` with minimal scalar fields + compact raw payload columns.
   - Resilience: per-token endpoint failures are isolated and logged; one token failure does not fail the whole batch.

4. **ImportedProject + ImportedTokenMetrics -> Project**
   - Trigger: `POST /api/sync-projects`
   - Input: all imported project rows + token metrics by token mint
   - Logic: map imported fields into product projection, derive collision-safe slug, project only lightweight token metrics fields, then upsert by `(source, sourceProjectId)`.

## Guardrails

- Cron routes require `Authorization: Bearer <CRON_SECRET>`.
- `POST /api/import-bags-updates` remains unchanged and isolated from token enrichments.
- Token enrichment uses server-side `BAGS_API_KEY` and dedicated batch sizing (`BAGS_TOKEN_ENRICHMENTS_BATCH_SIZE`).
- No Vercel Cron assumption: cron-job.org remains the external scheduler for all cron routes.
- Projection logic is centralized in `lib/sync-projects.ts` and remains the single mapping source for `Project` writes.
- Mirror-first architecture stays intact: source mirrors (`ImportedProject*`, `ImportedTokenMetrics`) are separated from product projection (`Project`).

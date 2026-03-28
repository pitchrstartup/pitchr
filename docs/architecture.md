# Architecture (Current)

## Core model roles

- **ImportedProject** = mirror of Bags project records (normalized + raw payload retention).
- **ImportedProjectUpdate** = mirror of Bags project updates feed.
- **ImportedTokenMetrics** = mirror of targeted Bags token enrichment endpoints (`lifetime-fees`, `claim-stats`, `creators`) keyed by `(source, tokenMint)`.
- **Project** = product-level projection read model derived from `ImportedProject` plus lightweight projected token metrics.

## Current data flow

1. **Bags -> ImportedProject**
   - Trigger: `POST /api/import-bags`
   - Input strategy:
     - default `BAGS_PROJECTS_INPUT_MODE=auto`: try live Bags API first, then local snapshot fallback
     - `live`: Bags API only
     - `file`: local `data/bags-projects.raw.json` only
   - Logic: normalize Bags list/detail payloads, then upsert by `(source, sourceProjectId)`.
   - Output counters: fetched/valid/imported/updated/rejected + source meta.

2. **Bags -> ImportedProjectUpdate**
   - Trigger: `POST /api/import-bags-updates`
   - Input: live Bags updates API (`/hackathon/{uuid}/updates`)
   - Logic: load persisted cursor (`ImportCursor`), process one project batch per run, normalize updates, upsert by `(source, sourceUpdateId)`.
   - Cursor behavior (failure-safe): cursor advances only after the batch run completes, so partial crashes do not silently skip projects.

3. **Bags token endpoints -> ImportedTokenMetrics**
   - Trigger: `POST /api/import-bags-token-enrichments`
   - Input: imported projects where `tokenAddress` exists
   - Logic: load dedicated persisted cursor (`bags:token-enrichments:cursor:v1`), process one project batch per run, dedupe token mints in-run, then call:
     - `/token-launch/lifetime-fees`
     - `/token-launch/claim-stats`
     - `/token-launch/creators`
   - 404 on `/token-launch/creators` is treated as **normal no-data**, not as hard failure.
   - Cursor behavior (failure-safe): cursor advances only after batch completion.

4. **ImportedProject + ImportedTokenMetrics -> Project**
   - Trigger: `POST /api/sync-projects`
   - Input:
     - default full sync (`SYNC_PROJECTS_BATCH_SIZE=0`)
     - optional batched sync (`SYNC_PROJECTS_BATCH_SIZE > 0`) with persisted cursor `bags:sync-projects:cursor:v1`
   - Logic: map imported fields into product projection, derive collision-safe slug, project token metrics, upsert by `(source, sourceProjectId)`.

## Guardrails

- Cron routes require `Authorization: Bearer <CRON_SECRET>`.
- `BAGS_API_KEY` is used server-side for token enrichments.
- No Vercel Cron assumption: cron-job.org remains the external scheduler for all cron routes.
- Mirror-first architecture stays intact: source mirrors (`ImportedProject*`, `ImportedTokenMetrics`) are separated from product projection (`Project`).
- Counters are explicit for operational debugging: imported/updated/rejected/failed/no-data/partial-failures and cursor state.

# Next Steps

## Immediate priorities (next)

1. **Operational safety**
   - Add simple health verification after each cron stage.
   - Define runbook steps for re-running import/sync safely.

2. **Test coverage**
   - Add focused tests for:
     - project normalization (`import-bags`)
     - updates normalization (`import-bags-updates`)
     - projection mapping + slug behavior (`sync-projects`)

3. **Consumer readiness**
   - Expose read-side endpoints backed by `Project` for product surfaces.

## Medium-term priorities

1. Incremental import optimization (delta-only project imports if needed).
2. Basic observability (structured logs + alerting on cron failure rates).
3. Data quality checks (field drift detection against Bags payload changes).

## What NOT to touch yet

- Do not redesign the ingestion/projection architecture.
- Do not collapse `ImportedProject` directly into `Project`.
- Do not remove raw payload retention from imported tables.
- Do not over-model new domain fields before consumer features require them.

## Remaining technical debt

- No automated integration test chain for cron flow yet.
- Scheduler/runbook knowledge is still mostly implicit.
- Product UI is placeholder-only and not yet connected to projection data.

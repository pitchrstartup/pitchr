# 1. Canonical current state
- **User types in practice:** anonymous visitors only. There is no implemented auth/session flow in routes or actions despite README claims.
- **Routes implemented:** `/` (landing), `/discover` (project grid), `/leaderboard` (ordered list).
- **Persisted entities:** one Prisma model: `Project`.
- **Server/API surface:** one server action `getProjects()` that returns `project.findMany(orderBy createdAt desc)`.
- **Missing core mechanics:** no backing/voting write path, no swipe flow, no per-project detail route, no submission flow, no user history, no admin/moderation, no analytics/events, no jobs.

# 2. Product gap analysis
## Identity
- **Current:** no operational identity model.
- **Gap to MVP:** a lightweight identity layer so backing and submission are attributable and abuse-limited.

## Support/backing mechanic
- **Current:** leaderboard is just project order from `createdAt`; no support signal exists.
- **Gap to MVP:** a single canonical support action (e.g., one back per identity per project) and aggregate counts used for ranking.

## Project submission
- **Current:** seeded data only.
- **Gap to MVP:** public submit flow with validation + moderation status.

## Project detail / sharing
- **Current:** only card snippets in discover/leaderboard.
- **Gap to MVP:** project detail page with shareable URL, full description, links, and support CTA.

## Leaderboard credibility
- **Current:** presented as leaderboard but not tied to votes/support.
- **Gap to MVP:** explicit ranking formula + timestamp + anti-duplication guardrails.

## User tracking/history
- **Current:** no user-level state.
- **Gap to MVP:** minimal “my backed projects” history for returning users.

## Builder visibility
- **Current:** builder name/avatar text only.
- **Gap to MVP:** submission ownership (at least pseudonymous) and per-project support totals visible to builders.

## Admin/moderation
- **Current:** none.
- **Gap to MVP:** minimal moderation queue/status toggle for submitted projects.

## Analytics / trust / instrumentation
- **Current:** none.
- **Gap to MVP:** event logging for key actions (view, back, submit), basic abuse monitoring, and transparency copy on leaderboard semantics.

# 3. Recommend the smallest coherent real MVP
- **Users can do (v1):** browse projects, open project detail, back one project at a time (or one back per project), and view their own backing history.
- **Builders can do (v1):** submit a project and check whether it is pending/approved/rejected; see support count on their project page.
- **Leaderboard meaning (v1):** ordered by unique back count (ties by earlier submission/approval date).
- **Backing definition (v1):** one unique backing record per `(identity, project)`; repeat taps are idempotent.
- **Swiping in v1:** not required. Keep card grid; add explicit “Back this project” button.
- **Auth in v1:** mandatory for write actions, but keep it light: magic-link/email or wallet-sign-in can be future work. For smallest scope, start with anonymous cookie identity for backing + optional email capture for submitter contact.

# 4. Canonical domain model proposal
## Keep: `Project` (exists now)
- **Purpose:** canonical project profile shown in discover/detail/leaderboard.
- **Adjust now:** add slug + moderation/status + timestamps used for ranking.

## Add now: `Identity`
- **Purpose:** stable actor identity for backing/history and basic abuse control.
- **Key fields:** `id`, `cookieId` (unique), optional `displayName`, `createdAt`, `lastSeenAt`.
- **Relation:** one identity has many supports and (optionally) submissions.
- **Why now:** without identity, support cannot be deduped or trusted.

## Add now: `ProjectSupport`
- **Purpose:** canonical backing/vote record.
- **Key fields:** `id`, `projectId`, `identityId`, `createdAt`, unique `(projectId, identityId)`.
- **Relation:** many supports per project; many supports per identity.
- **Why now:** powers real leaderboard and user history.

## Add now: moderation fields on `Project` (not separate table yet)
- **Purpose:** submission lifecycle.
- **Key fields:** `status` enum (`PENDING`, `APPROVED`, `REJECTED`), `submittedByIdentityId` nullable, `approvedAt` nullable.
- **Why now:** enables `/submit` and admin review without overbuilding.

## Add later: `ProjectMetricsDaily` (optional)
- **Purpose:** pre-aggregated analytics.
- **Why later:** premature until traffic grows.

# 5. Route and UI plan
## `/` (refactor existing)
- **Purpose:** accurate value prop for “discover + back + track”.
- **Audience:** all visitors.
- **Must-have blocks:** hero, CTA to discover/submit, transparent “how ranking works”.
- **Data:** lightweight aggregate counts (optional).

## `/discover` (refactor existing)
- **Purpose:** browse approved projects.
- **Audience:** visitors/backers.
- **Must-have blocks:** searchable/sortable grid, each card with support count + Back button.
- **Data:** approved projects + support aggregates + current identity’s backed state.

## `/projects/[slug]` (new)
- **Purpose:** canonical project detail/share page.
- **Audience:** all.
- **Must-have blocks:** full description, builder info, links, support CTA, support count.
- **Data:** one project + aggregate support + viewer backed state.

## `/leaderboard` (refactor existing)
- **Purpose:** trustworthy ranking by support.
- **Audience:** all.
- **Must-have blocks:** rank list, support totals, “last updated”, ranking explanation.
- **Data:** approved projects ordered by support count.

## `/submit` (new)
- **Purpose:** collect new project submissions.
- **Audience:** builders.
- **Must-have blocks:** validated form, URL checks, success state.
- **Data:** none on load; create project on submit.

## `/me` (new, lightweight)
- **Purpose:** personal history.
- **Audience:** backers/builders tied to cookie identity.
- **Must-have blocks:** backed projects list; submitted projects and statuses if any.
- **Data:** identity supports + identity submissions.

## `/admin/projects` (new, minimal internal)
- **Purpose:** moderation queue only.
- **Audience:** operator/admin.
- **Must-have blocks:** pending list, approve/reject actions.
- **Data:** pending projects + metadata.

# 6. Backend implementation plan
- **Schema changes (canonical now):**
  - Add `slug`, `status`, `approvedAt`, `submittedByIdentityId` to `Project`.
  - Add `Identity` table with unique cookie key.
  - Add `ProjectSupport` with unique `(identityId, projectId)`.
- **Prisma migrations:** create new migration with backfill script for existing seeded projects (`status=APPROVED`, slug from name).
- **Server actions/handlers:**
  - `getApprovedProjects`, `getProjectBySlug`, `getLeaderboard`.
  - `backProject(projectId)` idempotent write.
  - `submitProject(input)` validated create in `PENDING`.
  - `getMyActivity()` for `/me`.
  - `moderateProject(projectId, decision)` for internal route.
- **Validation:** zod (or handwritten minimal validators) for name lengths, description length, allowed URL protocols, slug uniqueness.
- **Auth/session approach:** cookie-based `identityId` bootstrap in middleware/helper. No full auth provider yet.
- **Aggregation logic:** prefer DB aggregate query (`COUNT(ProjectSupport.id)` grouped by project) + stable tie-breakers.
- **Error states:** duplicate back (return success/no-op), missing project (404), pending/rejected visibility rules, invalid URLs (422), moderation unauthorized (403).
- **Write-path protections:** rate limit per identity/IP for backing and submission; sanitize URL fields; reject non-http(s) URLs.
- **Do NOT build yet:** swipe gestures, founder dashboards, complex RBAC, notifications/jobs, advanced analytics warehouse.

# 7. File-by-file implementation roadmap
- `prisma/schema.prisma` — **modify** — add `Identity`, `ProjectSupport`, and new `Project` fields/enums — **P0**.
- `prisma/migrations/<timestamp>_mvp_support_submission/migration.sql` — **create** — schema evolution + backfill defaults — **P0**.
- `actions/projects.ts` — **modify** — split into read actions (`getApprovedProjects`, `getProjectBySlug`, `getLeaderboard`) — **P0**.
- `actions/support.ts` *(proposed new)* — **create** — `backProject`, `getMySupportedProjects` — **P0**.
- `actions/submissions.ts` *(proposed new)* — **create** — `submitProject`, admin moderation action — **P0**.
- `lib/identity.ts` *(proposed new)* — **create** — resolve/create cookie identity — **P0**.
- `lib/validation.ts` *(proposed new)* — **create** — reusable URL/text validators — **P0**.
- `app/discover/page.tsx` — **modify** — show support-aware cards, backed state — **P0**.
- `components/ProjectCard.tsx` — **modify** — add support count + back action; remove “drag to swipe” fallback copy — **P0**.
- `app/leaderboard/page.tsx` — **modify** — rank by support counts + explain formula — **P0**.
- `app/projects/[slug]/page.tsx` *(proposed new)* — **create** — detail page — **P0**.
- `app/submit/page.tsx` *(proposed new)* — **create** — project submission form — **P0**.
- `app/me/page.tsx` *(proposed new)* — **create** — backed/submitted history — **P1**.
- `app/admin/projects/page.tsx` *(proposed new)* — **create** — moderation queue — **P1**.
- `components/Navbar.tsx` — **modify** — include Submit and My Activity links — **P1**.
- `app/page.tsx` — **modify** — tighten copy to current/near-term behavior — **P1**.
- `README.md` — **modify** — remove unimplemented role/swipe/admin claims; document actual routes and MVP semantics — **P0**.

# 8. Risks and sequencing
## Risks
- **Product risk:** ambiguous “leaderboard” without clear semantics damages trust.
- **Technical risk:** retrofitting identity after support launch can invalidate counts.
- **Migration risk:** existing data has no slugs/status; backfill must be deterministic.
- **Abuse/spam risk:** anonymous writes allow script-backed vote inflation.
- **Trust risk:** seeded/demo data mixed with live submissions without labels can mislead users.

## Sequence
1. **Step 1 (P0):** Data model migration (`Identity`, `ProjectSupport`, project status/slug) + backfill.
2. **Step 2 (P0):** Identity cookie helper and backing write/read actions with dedupe + rate limits.
3. **Step 3 (P0):** Refactor discover/leaderboard to support-based semantics and transparent copy.
4. **Step 4 (P0):** Add `/projects/[slug]` detail and `/submit` flow with validation + pending status.
5. **Step 5 (P1):** Add `/me` history.
6. **Step 6 (P1):** Minimal admin moderation route.
7. **Step 7 (P2):** Optional auth hardening and richer analytics if usage justifies.

# 9. Copy / messaging alignment
## Change immediately
- Remove/replace README claims about login, swipe feed, founder/admin dashboards and role-based access; these routes/files do not exist.
- Remove “drag to swipe” hint in project cards (currently misleading).
- Clarify leaderboard currently lists projects, not community backing (until support is implemented).

## Can stay
- Bags hackathon framing and “discover projects” positioning.
- Simple navigation around discover and leaderboard.

## Valid only after backing is real
- “Back the ones you believe in” copy in metadata/landing.
- Any leaderboard language implying ranking by community support.
- Any claim of user/founder/admin role separation.

# 10. Final recommendation
Build the **support-backed catalog MVP** next: add lightweight identity + unique backing + submission + project detail, then redefine leaderboard as support-ranked. Postpone swiping, complex auth/RBAC, dashboards, and advanced analytics. Update copy/README now so the product promise matches shipped behavior, then incrementally ship the P0 sequence above.

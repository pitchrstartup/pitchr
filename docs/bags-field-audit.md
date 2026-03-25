# Bags Raw Project Field Audit (Grounded)

Source of truth: `data/bags-projects.raw.json`.

## 1. Raw dataset summary

- Total projects: **869**.
- Top-level project envelope fields (per item in `projects[]`): `uuid`, `list`, `detail`.

### 1.1 `project.list` field inventory

| Field | Presence |
|---|---:|
| `_id` | 869 / 869 (100.0%) |
| `uuid` | 869 / 869 (100.0%) |
| `icon` | 869 / 869 (100.0%) |
| `name` | 869 / 869 (100.0%) |
| `description` | 869 / 869 (100.0%) |
| `category` | 869 / 869 (100.0%) |
| `twitterUrl` | 869 / 869 (100.0%) |
| `status` | 628 / 869 (72.3%) |
| `tokenAddress` | 445 / 869 (51.2%) |
| `downvotes` | 106 / 869 (12.2%) |
| `upvotes` | 73 / 869 (8.4%) |

### 1.2 `project.detail` field inventory

`project.detail` has a wrapper shape in all rows:
- `success` (always `true` in this artifact)
- `response` (always present object)

`project.detail.response` fields:

| Field | Presence |
|---|---:|
| `_id` | 869 / 869 (100.0%) |
| `userId` | 869 / 869 (100.0%) |
| `uuid` | 869 / 869 (100.0%) |
| `icon` | 869 / 869 (100.0%) |
| `name` | 869 / 869 (100.0%) |
| `description` | 869 / 869 (100.0%) |
| `category` | 869 / 869 (100.0%) |
| `twitterUrl` | 869 / 869 (100.0%) |
| `createdAt` | 869 / 869 (100.0%) |
| `twitterUser` | 869 / 869 (100.0%) *(742 objects, 127 null)* |
| `status` | 628 / 869 (72.3%) |
| `tokenAddress` | 445 / 869 (51.2%) |
| `downvotes` | 113 / 869 (13.0%) |
| `upvotes` | 74 / 869 (8.5%) |

## 2. Field presence analysis

### 2.1 Meaningful project fields

| Field | Appears in | Approx frequency | Recommendation | Notes |
|---|---|---:|---|---|
| `uuid` | both | 100% | **keep** | Stable cross-object identifier; root/list/detail UUIDs match in all rows. |
| `name` | both | 100% | **keep** | Always present and non-empty. |
| `description` | both | 100% | **keep** | Always present and non-empty. |
| `category` | both | 100% | **keep** | Always present; 9 observed values. |
| `icon` | both | 100% | **keep** | Always present URL string. |
| `twitterUrl` | both | 100% | **keep** | Always present and non-empty. |
| `createdAt` | detail only | 100% (detail) | **keep** | Canonical timestamp exists only in detail response. |
| `status` | both | 72.3% | **optional** | Only two values observed (`in review`, `accepted`); missing in 27.7% rows. |
| `tokenAddress` | both | 51.2% | **optional** | Present in roughly half the data. |
| `twitterUser` | detail only | 85.4% object / 14.6% null | **raw only** | Rich nested blob, incomplete and noisy for v1 canonical model. |
| `upvotes` | both | ~8.5% | **discard** | Sparse and inconsistent between list/detail for some rows. |
| `downvotes` | both | ~13% | **discard** | Sparse and occasionally mismatched between list/detail. |

### 2.2 Noisy/useless envelope/internal fields

| Field | Appears in | Approx frequency | Recommendation | Why |
|---|---|---:|---|---|
| `_id` | both | 100% | **discard** | Internal Mongo-style ID; redundant once `uuid` is kept. |
| `userId` | detail only | 100% | **raw only** | Ownership metadata, not needed in minimal project shape. |
| `detail.success` | detail wrapper | 100% | **discard** | Transport/wrapper metadata, not project domain data. |
| `detail.response` | detail wrapper | 100% | **discard** | Transport wrapper. |

## 3. Recommended minimal Pitchr v1 project shape

Grounded minimal canonical shape (only fields present in artifact):

```ts
{
  uuid: string,
  name: string,
  description: string,
  category: string,
  icon: string,
  twitterUrl: string,
  createdAt: string,      // ISO timestamp from detail.response.createdAt
  status?: string,
  tokenAddress?: string
}
```

## 4. Proposed mapping

Use `detail.response` as canonical source when available (it is available for all 869 rows in this artifact), with `list` as fallback for overlapping fields.

| Pitchr v1 field | Raw Bags field |
|---|---|
| `uuid` | `project.detail.response.uuid` (fallback `project.list.uuid`) |
| `name` | `project.detail.response.name` (fallback `project.list.name`) |
| `description` | `project.detail.response.description` (fallback `project.list.description`) |
| `category` | `project.detail.response.category` (fallback `project.list.category`) |
| `icon` | `project.detail.response.icon` (fallback `project.list.icon`) |
| `twitterUrl` | `project.detail.response.twitterUrl` (fallback `project.list.twitterUrl`) |
| `createdAt` | `project.detail.response.createdAt` |
| `status` | `project.detail.response.status` (fallback `project.list.status`) |
| `tokenAddress` | `project.detail.response.tokenAddress` (fallback `project.list.tokenAddress`) |

## 5. Risks / ambiguities

- `upvotes`/`downvotes` are sparse and show list/detail mismatches in a subset of rows, so they are unreliable for canonical v1 usage.
- `twitterUser` is sometimes null and otherwise heterogenous nested metadata; keeping it as raw payload only is safer.
- `status` missingness is significant (27.7%), so consumers must treat it as optional.
- The artifact guarantees `detail.response.createdAt` today, but if upstream payloads regress to list-only snapshots, `createdAt` may be absent.

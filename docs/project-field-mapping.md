# Project Field Mapping (`ImportedProject` + `ImportedTokenMetrics` -> `Project`)

| Project field | Source path | Mapping type | Nullable? | Notes |
| --- | --- | --- | --- | --- |
| `id` | Prisma default (`cuid()`) | System-generated | Required | Product-level project identity. |
| `slug` | Derived from `ImportedProject.name` (+ stable suffix from `ImportedProject.sourceProjectId` when needed) | Derived | Required | Unique slug; collision-safe. |
| `source` | `ImportedProject.source` | Direct column | Required | Source system identifier. |
| `sourceProjectId` | `ImportedProject.sourceProjectId` | Direct column | Required | Source primary identifier. |
| `sourceUrl` | `ImportedProject.sourceUrl` | Direct column | Nullable | Source project URL. |
| `name` | `ImportedProject.name` | Direct column | Required | Project display name. |
| `description` | `ImportedProject.description` | Direct column | Nullable | Project description text. |
| `category` | `ImportedProject.category` | Direct column | Nullable | Bags category. |
| `iconUrl` | `ImportedProject.iconUrl` | Direct column | Nullable | Icon URL. |
| `sourceStatus` | `ImportedProject.sourceStatus` | Direct column | Nullable | Bags status flag. |
| `tokenAddress` | `ImportedProject.tokenAddress` | Direct column | Nullable | Token contract/address if present. |
| `sourceUserId` | `ImportedProject.sourceUserId` | Direct column | Nullable | Source author ID. |
| `twitterUrl` | `ImportedProject.twitterUrl` | Direct column | Nullable | Twitter/X URL. |
| `twitterUserId` | `ImportedProject.twitterUserId` | Direct column | Nullable | Twitter/X user ID. |
| `twitterUsername` | `ImportedProject.twitterUsername` | Direct column | Nullable | Twitter/X username. |
| `twitterName` | `ImportedProject.twitterName` | Direct column | Nullable | Twitter/X display name. |
| `twitterProfileImage` | `ImportedProject.twitterProfileImage` | Direct column | Nullable | Twitter/X profile image URL. |
| `twitterVerified` | `ImportedProject.twitterVerified` | Direct column | Nullable | Twitter/X verified boolean. |
| `twitterDescription` | `ImportedProject.rawDetailPayload.twitterUser.description` | `rawDetailPayload` extraction | Nullable | Extra Twitter bio data. |
| `twitterCreatedAt` | `ImportedProject.rawDetailPayload.twitterUser.created_at` | `rawDetailPayload` extraction | Nullable | Parsed into DateTime when valid. |
| `twitterVerifiedType` | `ImportedProject.rawDetailPayload.twitterUser.verified_type` | `rawDetailPayload` extraction | Nullable | Extra verification metadata. |
| `twitterUserUrl` | `ImportedProject.rawDetailPayload.twitterUser.url` | `rawDetailPayload` extraction | Nullable | Twitter user website URL. |
| `twitterFollowersCount` | `ImportedProject.rawDetailPayload.twitterUser.public_metrics.followers_count` | `rawDetailPayload` extraction | Nullable | Followers metric. |
| `twitterFollowingCount` | `ImportedProject.rawDetailPayload.twitterUser.public_metrics.following_count` | `rawDetailPayload` extraction | Nullable | Following metric. |
| `twitterTweetCount` | `ImportedProject.rawDetailPayload.twitterUser.public_metrics.tweet_count` | `rawDetailPayload` extraction | Nullable | Tweet metric. |
| `twitterListedCount` | `ImportedProject.rawDetailPayload.twitterUser.public_metrics.listed_count` | `rawDetailPayload` extraction | Nullable | Listed metric. |
| `twitterLikeCount` | `ImportedProject.rawDetailPayload.twitterUser.public_metrics.like_count` | `rawDetailPayload` extraction | Nullable | Like metric. |
| `twitterMediaCount` | `ImportedProject.rawDetailPayload.twitterUser.public_metrics.media_count` | `rawDetailPayload` extraction | Nullable | Media metric. |
| `upvotes` | `ImportedProject.upvotes` | Direct column | Nullable | Included from Bags signals; available for product use but not a default-UI decision in this task. |
| `downvotes` | `ImportedProject.downvotes` | Direct column | Nullable | Included from Bags signals; available for product use but not a default-UI decision in this task. |
| `lifetimeFeesLamports` | `ImportedTokenMetrics.lifetimeFeesLamports` matched by `Project.tokenAddress = ImportedTokenMetrics.tokenMint` | Direct column | Nullable | Bags lifetime fees (lamports as string). |
| `claimsTotalLamports` | `ImportedTokenMetrics.claimsTotalLamports` matched by token mint | Derived from claim-stats mirror | Nullable | Sum of all claim amounts (lamports string). |
| `claimsCreatorLamports` | `ImportedTokenMetrics.claimsCreatorLamports` matched by token mint | Derived from claim-stats mirror | Nullable | Sum of creator claim amounts (lamports string). |
| `claimsUniqueWallets` | `ImportedTokenMetrics.claimsUniqueWallets` matched by token mint | Derived from claim-stats mirror | Nullable | Unique claiming wallets count. |
| `creatorCount` | `ImportedTokenMetrics.creatorCount` matched by token mint | Derived from launch-creators mirror | Nullable | Lightweight creator presence signal. |
| `hasLaunchCreator` | `ImportedTokenMetrics.hasCreator` matched by token mint | Derived boolean | Nullable | Minimal trust/presence signal for product logic. |
| `createdAtFromSource` | `ImportedProject.createdAtFromSource` | Direct column | Nullable | Source creation timestamp mirror. |
| `sourceCreatedAt` | `ImportedProject.sourceCreatedAt` | Direct column | Nullable | Source-specific created timestamp mirror. |
| `rawListPayload` | `ImportedProject.rawListPayload` | Direct column | Required (`Json` default) | Raw source payload retained. |
| `rawDetailPayload` | `ImportedProject.rawDetailPayload` | Direct column | Required (`Json` default) | Raw source payload retained. |
| `createdAt` | Prisma default (`now()`) | System-generated | Required | DB creation timestamp. |
| `updatedAt` | Prisma `@updatedAt` | System-generated | Required | DB update timestamp. |


## Naming and mapping conventions (stability notes)

- `ImportedProject.tokenAddress` is treated as the Bags token mint string and matched to `ImportedTokenMetrics.tokenMint` during projection.
- `ImportedTokenMetrics.hasCreator` is the mirror-level boolean from launch-creators enrichment; `Project.hasLaunchCreator` is its projection-level alias.
- `ImportedProjectUpdate.sourceProjectId` and `ImportedProjectUpdate.sourceProjectUuid` intentionally carry the same Bags project UUID value for compatibility with existing queries/indexes.
- `createdAtFromSource` is the canonical mirrored source timestamp used across mirror/projection models; `sourceCreatedAt` remains optional and source-specific when present.

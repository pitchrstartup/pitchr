# Audit Pitchr — état du système

---

## 1. Schéma DB — état actuel

### ImportedProject
**Rôle :** miroir des projets hackathon Bags. Un enregistrement par projet source, upsert par `(source, sourceProjectId)`.

| Champ | État |
|---|---|
| id, createdAt, updatedAt, importedAt | bien peuplé (auto) |
| source, sourceProjectId, sourceUrl | bien peuplé |
| name, category, iconUrl, twitterUrl | bien peuplé |
| description | bien peuplé — mais peut être null/vide (et est rejeté à tort en import, voir bug #2) |
| createdAtFromSource | bien peuplé (depuis `detail.createdAt`) |
| sourceUserId | bien peuplé |
| sourceStatus, tokenAddress | bien peuplé |
| upvotes, downvotes | bien peuplé |
| twitterUserId, twitterUsername, twitterName, twitterProfileImage, twitterVerified | bien peuplé si `twitterUser` non null ; null sinon (~20% des projets) |
| rawPayload, rawListPayload, rawDetailPayload | bien peuplé |
| **lastSyncedAt** | **jamais peuplé** — le champ existe dans le schéma mais import-bags.js ne l'écrit jamais |
| **sourceCreatedAt** | **jamais peuplé** — import-bags.js ne le passe pas dans create/update |

**Relations :** `updates → ImportedProjectUpdate[]`

---

### ImportedProjectUpdate
**Rôle :** miroir des updates Bags par projet. Upsert par `(source, sourceUpdateId)`.

| Champ | État |
|---|---|
| id, createdAt, updatedAt, importedAt | bien peuplé |
| source, sourceUpdateId, sourceProjectId, sourceProjectUuid, projectId | bien peuplé |
| sourceUserId, contentText | bien peuplé |
| createdAtFromSource, updatedAtFromSource | bien peuplé |
| rawPayload | bien peuplé |

**Relations :** `project → ImportedProject` (FK sur `projectId`, cascade delete)

**Index :** `sourceProjectId`, `(source, sourceProjectUuid)`, `(projectId, createdAtFromSource)`

---

### ImportedTokenMetrics
**Rôle :** miroir des enrichissements token Bags (lifetime-fees, claim-stats, creators). Upsert par `(source, tokenMint)`.

| Champ | État |
|---|---|
| id, createdAt, updatedAt | bien peuplé |
| source, tokenMint | bien peuplé |
| lifetimeFeesLamports | bien peuplé (string brute depuis `response`) |
| claimsTotalLamports | **mal peuplé** — agrégé depuis `event.amount` mais l'API retourne `totalClaimed` (voir bug #4) |
| claimsCreatorLamports | **mal peuplé** — même cause |
| claimsUniqueWallets | bien peuplé |
| creatorCount, hasCreator, creatorWallets | **potentiellement toujours null/vide** — endpoint appelé sur `/token-launch/creators` au lieu de `/token-launch/creator/v3` (voir bug #1) |
| creatorsDataStatus | bien peuplé (`fetched` / `no_data` / `error`) |
| rawLifetimeFeesPayload, rawClaimStatsPayload, rawLaunchCreatorsPayload | bien peuplé |
| lastFetchedAt | bien peuplé |

---

### Project
**Rôle :** read model produit. Projection de `ImportedProject` + `ImportedTokenMetrics` + agrégats d'updates. Upsert par `(source, sourceProjectId)`.

| Champ | État |
|---|---|
| id, slug, createdAt, updatedAt | bien peuplé |
| source, sourceProjectId, sourceUrl | bien peuplé |
| name, category, iconUrl, twitterUrl | bien peuplé |
| description | bien peuplé (nullable) |
| sourceStatus, tokenAddress | bien peuplé |
| sourceUserId | bien peuplé |
| twitterUserId, twitterUsername, twitterName, twitterProfileImage, twitterVerified | bien peuplé si twitterUser non null ; null sinon |
| twitterDescription, twitterCreatedAt, twitterVerifiedType, twitterUserUrl | extraits de rawDetailPayload — bien peuplé si présent |
| twitterFollowersCount, twitterFollowingCount, twitterTweetCount, twitterListedCount, twitterLikeCount, twitterMediaCount | extraits de rawDetailPayload — bien peuplé |
| upvotes, downvotes | bien peuplé |
| lifetimeFeesLamports | bien peuplé |
| claimsTotalLamports, claimsCreatorLamports | **mal peuplé** — hérite du bug #4 |
| claimsUniqueWallets | bien peuplé |
| creatorCount, hasLaunchCreator, creatorsDataStatus | **mal peuplé** — hérite du bug #1 |
| hasToken | bien peuplé (dérivé de la relation ProjectToken) |
| hasLinkedCreator | bien peuplé (dérivé de la relation ProjectCreator) |
| creatorProjectsCount, creatorTokenProjectsCount | bien peuplé |
| updatesCount, lastUpdateAt | bien peuplé (agrégé depuis ImportedProjectUpdate) |
| createdAtFromSource | bien peuplé |
| **sourceCreatedAt** | **jamais peuplé** — hérite du bug ImportedProject |
| rawListPayload, rawDetailPayload | bien peuplé |

**Relations :** `projectCreators → ProjectCreator[]`, `projectTokens → ProjectToken[]`

---

### Creator
**Rôle :** entité produit pour l'identité du créateur. Clé stable `identityKey` = `source:user:<sourceUserId>` ou `source:twitter:<twitterUserId>`.

| Champ | État |
|---|---|
| id, createdAt, updatedAt | bien peuplé |
| source, identityKey | bien peuplé |
| sourceUserId, twitterUserId, twitterUsername, twitterName, twitterVerified, twitterFollowersCount, twitterProfileImage | bien peuplé si twitterUser non null |

**Limitation :** si `sourceUserId` et `twitterUserId` sont tous les deux null (projet sans twitterUser), aucun Creator n'est créé et `hasLinkedCreator = false`.

---

### Token
**Rôle :** entité produit token. Upsert par `(source, mint)`.

| Champ | État |
|---|---|
| id, createdAt, updatedAt | bien peuplé |
| source, mint | bien peuplé |
| lifetimeFeesLamports | bien peuplé |
| claimsTotalLamports, claimsCreatorLamports | **mal peuplé** — hérite du bug #4 |
| claimsUniqueWallets | bien peuplé |
| creatorCount, hasCreator, creatorsDataStatus | **mal peuplé** — hérite du bug #1 |
| lastFetchedAt | bien peuplé |
| **creatorWallets** | **absent du modèle Token** — présent dans ImportedTokenMetrics mais non projeté dans Token |

---

### ProjectCreator
**Rôle :** table de liaison `Project ↔ Creator`. Unique par `(projectId, creatorId, role)`.

Champs : `id`, `projectId`, `creatorId`, `role` (défaut `primary`), `matchSource`, `confidence`, `createdAt`.
Cascade delete sur Project et Creator.

---

### ProjectToken
**Rôle :** table de liaison `Project ↔ Token`. Unique par `(projectId, tokenId, role)`.

Champs : `id`, `projectId`, `tokenId`, `role` (défaut `primary`), `createdAt`.
Cascade delete sur Project et Token.

---

### ImportCursor
**Rôle :** curseur de pagination pour les jobs incrémentaux.

Trois clés utilisées :
- `bags:project-updates:cursor:v1` (import-bags-updates)
- `bags:token-enrichments:cursor:v1` (import-bags-token-enrichments)
- `bags:sync-projects:cursor:v1` (sync-projects en mode batched)

Champs : `key` (unique), `cursor` (int offset), `batchSize`, `metadata` (JSON), `updatedAt`, `createdAt`.

---

## 2. Pipeline d'ingestion — état actuel

### Job 1 — import-bags
**Fichier :** `lib/import-bags.js`
**Route :** `POST /api/import-bags`

**Ce qu'il fait :**
1. Charge les projets depuis l'API Bags (mode `auto` : live en priorité, fallback fichier `data/bags-projects.raw.json`) ou depuis fichier selon `BAGS_PROJECTS_INPUT_MODE`.
2. Pour chaque projet de la page de liste, appelle le détail individuel.
3. Normalise chaque projet (`normalizeProject`).
4. Upsert dans `ImportedProject` par `(source, sourceProjectId)`.

**APIs appelées :**
- `GET https://api2.bags.fm/api/v1/hackathon/list?page={N}` — toutes les pages
- `GET https://api2.bags.fm/api/v1/hackathon/{uuid}` — une requête par projet

**Ce qu'il écrit :** `ImportedProject` (create ou update)

**Ce qu'il ne capture pas :**
- `ImportedProject.lastSyncedAt` — jamais mis à jour
- `ImportedProject.sourceCreatedAt` — jamais passé dans create/update
- `twitterUser.url` — présent dans rawDetailPayload mais non extrait en champ dédié (le champ `Project.twitterUserUrl` est extrait par sync-projects depuis raw, donc récupérable à la projection)

**Comportements problématiques :**
- **Bug #2** : `normalizeProject` considère `description` et `twitterUrl` comme obligatoires. Un projet sans description ou sans twitterUrl est rejeté. L'api-reference précise que seuls `uuid`, `name`, `icon`, `category` sont obligatoires.
- **Bug #3** : La fonction `normalizeProject` est appelée **sans cursor ni pagination incrémentale** — chaque exécution recharge l'intégralité du catalogue depuis la page 1. Pas de delta, pas de détection de nouveaux projets seulement.
- Pas de gestion des rate limits côté API2 (pas d'API key, pas de header, pas de backoff adaptatif).

---

### Job 2 — import-bags-updates
**Fichier :** `lib/import-bags-updates.js`
**Route :** `POST /api/import-bags-updates`

**Ce qu'il fait :**
1. Charge un batch de projets depuis `ImportedProject` via le curseur `bags:project-updates:cursor:v1`.
2. Pour chaque projet du batch, pagine les updates (`limit=50&offset=0`).
3. Normalise chaque update (`normalizeBagsUpdate`).
4. Upsert dans `ImportedProjectUpdate` par `(source, sourceUpdateId)`.
5. Avance le curseur après traitement complet du batch.

**API appelée :**
- `GET https://api2.bags.fm/api/v1/hackathon/{uuid}/updates?limit=50&offset=0`

**Ce qu'il écrit :** `ImportedProjectUpdate` (create ou update)

**Ce qu'il ne capture pas :**
- Aucun champ de l'API n'est perdu — tous les champs documentés sont capturés.

**Comportements problématiques :**
- **Bug #5** : `fetchUpdatesPage` utilise `execFileAsync('curl', [...])` au lieu de `fetch` natif. Dépendance au binaire système `curl` dans un environnement serverless. Peut échouer silencieusement si `curl` est absent ou si stdout dépasse le buffer (8 Mo max).
- Le résultat des updates n'est **pas directement visible en UI** sans un cycle de `sync-projects` ensuite — ce n'est pas un bug du job lui-même mais un couplage implicite à documenter.

---

### Job 3 — import-bags-token-enrichments
**Fichier :** `lib/import-bags-token-enrichments.ts`
**Route :** `POST /api/import-bags-token-enrichments`

**Ce qu'il fait :**
1. Charge un batch de projets ayant un `tokenAddress` non null, via le curseur `bags:token-enrichments:cursor:v1`.
2. Déduplique les mints dans le batch.
3. Pour chaque mint, appelle 3 endpoints en séquence.
4. Agrège et normalise les résultats.
5. Upsert dans `ImportedTokenMetrics` par `(source, tokenMint)`.
6. Avance le curseur après le batch.

**APIs appelées :**
- `GET https://public-api-v2.bags.fm/api/v1/token-launch/lifetime-fees?tokenMint={MINT}`
- `GET https://public-api-v2.bags.fm/api/v1/token-launch/claim-stats?tokenMint={MINT}`
- `GET https://public-api-v2.bags.fm/api/v1/token-launch/creators?tokenMint={MINT}` ← **URL INCORRECTE**

**Ce qu'il écrit :** `ImportedTokenMetrics` (create ou update)

**Ce qu'il ne capture pas :**
- `wallet`, `twitterUsername`, `royaltyBps`, `providerUsername`, `bagsUsername`, `isAdmin` des APIs 5 et 6 — agrégation uniquement
- `creatorWallets` non projeté dans le modèle `Token`

**Comportements problématiques :**
- **Bug #1 (critique)** : L'endpoint creators est défini ligne 16 comme `/token-launch/creators` mais l'URL réelle est `/token-launch/creator/v3`. Toutes les requêtes creators échouent probablement en 404 → `creatorsDataStatus = 'no_data'` sur tous les tokens → `hasCreator = null`, `creatorCount = null`.
- **Bug #4 (critique)** : `normalizeClaimStats` agrège `event?.amount` (ligne 313) alors que le champ API est `totalClaimed`. `claimsTotalLamports` et `claimsCreatorLamports` sont toujours 0.
- **Bug #6** : `normalizeLaunchCreators` cherche `creator?.walletAddress ?? creator?.address ?? creator?.wallet`. Le champ API est `wallet`. Les deux premiers ne matchent pas mais le fallback `wallet` fonctionne — non bloquant si bug #1 est corrigé.

---

### Job 4 — sync-projects
**Fichier :** `lib/sync-projects.ts`
**Route :** `POST /api/sync-projects`

**Ce qu'il fait :**
1. Charge tous les `ImportedProject` (mode full par défaut) ou un batch si `SYNC_PROJECTS_BATCH_SIZE > 0`.
2. Charge les `ImportedTokenMetrics` correspondants.
3. Charge les `ImportedProjectUpdate` pour calculer `updatesCount` et `lastUpdateAt`.
4. Pour chaque projet :
   - Projette `projectFromImported` → données `Project`
   - Résout un slug unique (collision-safe)
   - Create/update `Project`
   - Upsert `Creator` et `ProjectCreator` (ou supprime le lien si pas d'identité)
   - Upsert `Token` et `ProjectToken` (ou supprime le lien si pas de mint)
   - Second update `Project` pour les signaux relationnels (`hasLinkedCreator`, `creatorProjectsCount`, `creatorTokenProjectsCount`, `hasToken`, `updatesCount`, `lastUpdateAt`)

**APIs appelées :** aucune — lecture DB uniquement.

**Ce qu'il écrit :** `Project`, `Creator`, `Token`, `ProjectCreator`, `ProjectToken`

**Ce qu'il ne capture pas :**
- `Project.sourceCreatedAt` transmis depuis `ImportedProject.sourceCreatedAt` qui est toujours null (bug amont)

**Comportements problématiques :**
- **Bug #7** : En mode full (défaut, `batchSize=0`), chaque exécution recharge et reprojecte **tous** les projets. Coûteux sur un grand catalogue. Pas de notion de "projets modifiés depuis la dernière sync".
- Deux `project.update` consécutifs par projet (ligne 676 + ligne 838) : le second écrase `hasToken` mis dans `baseUpdateData`. En pratique non bloquant car la valeur est cohérente, mais inefficace.
- `resolveUniqueSlug` fait jusqu'à 1000 requêtes DB pour trouver un slug libre — pas de risque fonctionnel mais potentiellement lent sur un catalogue dense de projets au nom identique.

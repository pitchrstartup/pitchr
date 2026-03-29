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

---

## 3. Crons — état actuel

### Routes cron existantes

| Route | Méthode | Lib appelée |
|---|---|---|
| `/api/import-bags` | POST | `lib/import-bags.js` |
| `/api/import-bags-updates` | POST | `lib/import-bags-updates.js` |
| `/api/import-bags-token-enrichments` | POST | `lib/import-bags-token-enrichments.ts` |
| `/api/sync-projects` | POST | `lib/sync-projects.ts` |

### Déclenchement

Toutes les routes sont protégées par `requireCronBearerAuth` (`lib/cron-auth.ts`) : header `Authorization: Bearer <CRON_SECRET>` obligatoire, sinon 401.

Le déclencheur est **cron-job.org** (scheduler externe). Confirmé par `docs/architecture.md` : "No Vercel Cron assumption: cron-job.org remains the external scheduler for all cron routes." Aucun fichier `vercel.json`, `next.config.js` ni configuration Vercel Cron n'existe dans le repo.

### Fréquence configurée

**Aucune fréquence n'est définie dans le code.** Ni dans le repo ni dans les fichiers de config. La fréquence dépend entièrement de la configuration manuelle sur cron-job.org, non versionée.

Variables d'environnement qui influencent le volume traité par run :
- `BAGS_UPDATES_BATCH_SIZE` (défaut : 50 projets par run)
- `BAGS_TOKEN_ENRICHMENTS_BATCH_SIZE` (défaut : 30 projets par run)
- `SYNC_PROJECTS_BATCH_SIZE` (défaut : 0 = full sync)
- `BAGS_PROJECTS_INPUT_MODE` (défaut : `auto`)

### Ce qui manque

**Déclenchement automatique de nouveaux projets :**
`import-bags` recharge l'intégralité du catalogue à chaque run. Il n'y a pas de logique de détection de nouveaux projets depuis la dernière exécution — ni cursor, ni `since` timestamp, ni comparaison d'IDs. Un nouveau projet hackathon posté sur Bags sera importé seulement au prochain run complet de `import-bags`.

**Mise à jour des votes et du status :**
`import-bags` met bien à jour `upvotes`, `downvotes` et `sourceStatus` à chaque run puisqu'il reprend tout le catalogue. Mais il n'y a pas de job dédié à la mise à jour légère de ces champs (sans refaire tous les appels détail).

**Chaînage automatique des jobs :**
Les 4 jobs sont indépendants et doivent être déclenchés dans l'ordre sur cron-job.org :
1. `import-bags` → 2. `import-bags-updates` → 3. `import-bags-token-enrichments` → 4. `sync-projects`

Il n'y a aucun mécanisme dans le code pour enchaîner automatiquement les étapes ni pour détecter qu'une étape précédente s'est bien terminée avant de lancer la suivante.

**Alerting / monitoring :**
Aucun mécanisme d'alerte sur les taux d'échec. Les counters `rejected`, `failed`, `partialFailures` sont loggés mais non monitorés.

---

## 4. API read — état actuel

### GET /api/projects

**Fichier :** `app/api/projects/route.ts`

**Filtres disponibles :**

| Paramètre | Type | Champ DB filtré | Notes |
|---|---|---|---|
| `category` | string | `Project.category` | exact match, case-sensitive |
| `hasCreator` | boolean | `Project.hasLaunchCreator` | naming inconsistant : paramètre `hasCreator`, champ `hasLaunchCreator` |
| `twitterVerified` | boolean | `Project.twitterVerified` | |
| `hasToken` | boolean | `Project.tokenAddress` | filtre sur `tokenAddress IS NOT NULL` au lieu du champ dédié `hasToken` |
| `recentOnly` | boolean | `Project.createdAtFromSource >= now - 14j` | fenêtre de 14 jours hardcodée |
| `limit` | int | — | min 1, max 120, défaut 40 |

**Champs retournés (`ProjectListItem`) :**

`slug`, `name`, `description`, `category`, `iconUrl`, `twitterUsername`, `twitterVerified`, `hasLaunchCreator`, `tokenAddress`, `claimsUniqueWallets`, `creatorCount`, `createdAtFromSource`

**Ce qui manque ou est incorrect :**

- **Pas de pagination** : uniquement un `limit` dur. Impossible de parcourir le catalogue au-delà des 120 premiers résultats. Pas de cursor, pas d'offset.
- **Pas de tri configurable** : ordre hardcodé `createdAtFromSource DESC, createdAt DESC`. Pas de tri par votes, par fees, par followers.
- **`hasToken` filtre sur `tokenAddress`** au lieu du champ booléen `Project.hasToken` pourtant dédié à cet usage.
- **Champs absents de la réponse** : `upvotes`, `downvotes`, `twitterName`, `twitterProfileImage`, `hasToken` (boolean), `hasLinkedCreator`, `lifetimeFeesLamports`, `updatesCount`, `lastUpdateAt`, `sourceStatus`.
- **Pas de filtre sur `updatesCount`**, `upvotes`, `lifetimeFeesLamports` — signaux produit calculés mais non exposés comme critères de tri/filtre.

---

### GET /api/projects/[slug]

**Fichier :** `app/api/projects/[slug]/route.ts`

**Champs retournés (`ProjectDetail`) :**

`slug`, `name`, `description`, `category`, `iconUrl`, `sourceUrl`, `twitterUrl`, `twitterUsername`, `twitterVerified`, `hasLaunchCreator`, `tokenAddress`, `claimsUniqueWallets`, `creatorCount`, `twitterFollowersCount`, `twitterFollowingCount`, `createdAtFromSource`

**Ce qui manque :**

- `upvotes`, `downvotes`
- `twitterName`, `twitterProfileImage`, `twitterDescription`
- `twitterTweetCount`, `twitterListedCount`, `twitterLikeCount`, `twitterMediaCount`
- `lifetimeFeesLamports`, `claimsTotalLamports`, `claimsCreatorLamports`
- `hasToken` (boolean), `hasLinkedCreator`
- `updatesCount`, `lastUpdateAt`
- `creatorProjectsCount`, `creatorTokenProjectsCount`
- `sourceStatus`, `creatorsDataStatus`

**Ce qui est incorrect :**

- `ProjectDetail` dans `lib/project-dto.ts` est le type TypeScript retourné mais il ne correspond pas au select Prisma : des champs comme `twitterFollowersCount` sont dans le select mais absents du type DTO, et inversement. Le type est sous-spécifié.
- Aucune gestion du cas où `slug` contient des caractères dangereux — non bloquant car Prisma paramètre les requêtes, mais non validé en amont.

---

## 5. Bugs identifiés

### Bug #1 — Endpoint creators incorrect (CRITIQUE)
**Fichier :** `lib/import-bags-token-enrichments.ts` ligne 16
**Code :** `launchCreators: '/token-launch/creators'`
**Problème :** L'URL réelle de l'API est `/token-launch/creator/v3`. L'endpoint `/token-launch/creators` n'existe pas. Chaque requête retourne probablement un 404, traité comme `no_data`.
**Impact :** `hasCreator`, `creatorCount` et `creatorWallets` sont null/vides sur tous les tokens depuis le début. `creatorsDataStatus` est `'no_data'` partout. Signal "creator présent" absent de toute l'UI. `hasLaunchCreator` est null sur tous les `Project` avec token.

---

### Bug #2 — Rejet des projets sans description (CRITIQUE)
**Fichier :** `lib/import-bags.js` ligne 163
**Code :** `if (!description) missing.push('description');`
**Problème :** `description` est traitée comme champ obligatoire. L'API Bags retourne des projets avec description vide ou absente (`parfois vide` selon api-reference.md). Les seuls champs réellement obligatoires sont `uuid`, `name`, `icon`, `category`.
**Impact :** Un sous-ensemble de projets valides est systématiquement rejeté à l'import. Ces projets ne sont jamais dans `ImportedProject` ni dans `Project`. L'UI ne les voit pas.

---

### Bug #3 — Rejet des projets sans twitterUrl (CRITIQUE)
**Fichier :** `lib/import-bags.js` ligne 164
**Code :** `if (!twitterUrl) missing.push('twitterUrl');`
**Problème :** `twitterUrl` est traitée comme champ obligatoire. Elle n'est pas dans la liste des champs obligatoires de l'api-reference. Des projets sans compte Twitter associé sont valides côté Bags.
**Impact :** Tout projet sans twitterUrl est rejeté à l'import, même si uuid, name, icon et category sont présents. Amplifie le taux de rejet réel au-delà des ~20% liés au twitterUser null.

---

### Bug #4 — Agrégation des claim stats sur le mauvais champ (CRITIQUE)
**Fichier :** `lib/import-bags-token-enrichments.ts` ligne 313
**Code :** `total = addLamports(total, event?.amount);`
**Problème :** Le champ de montant dans l'API 5 (claim-stats) est `totalClaimed`, pas `amount`. Le champ `amount` est absent de la réponse API documentée.
**Impact :** `claimsTotalLamports` et `claimsCreatorLamports` sont toujours `"0"` dans `ImportedTokenMetrics`, `Token` et `Project`. Le signal économique "fees totales claimées" est inutilisable.

---

### Bug #5 — Appel curl subprocess dans import-bags-updates (IMPORTANT)
**Fichier :** `lib/import-bags-updates.js` ligne 203
**Code :** `await execFileAsync('curl', ['-4', '-sS', '-m', '30', url], { maxBuffer: 1024 * 1024 * 8 })`
**Problème :** Le job utilise `child_process.execFile` pour appeler le binaire système `curl` au lieu de `fetch` natif. Dépendance non déclarée au binaire `curl` dans l'environnement d'exécution. En cas de réponse volumineuse, le buffer est limité à 8 Mo (peut silencieusement tronquer ou crasher). Le parsing JSON est sur `stdout` brut, sans gestion du code HTTP de retour.
**Impact :** Si `curl` est absent ou si le stdout dépasse 8 Mo, le job plante silencieusement sur le projet concerné. Les erreurs HTTP non-2xx (ex. 429 rate limit) ne sont pas détectées — `JSON.parse` sur une réponse d'erreur HTML lèverait une exception non structurée.

---

### Bug #6 — ImportedProject.lastSyncedAt jamais peuplé (MOYEN)
**Fichier :** `lib/import-bags.js` — absent des blocs `create` (ligne 351) et `update` (ligne 318–347)
**Problème :** Le champ `lastSyncedAt` existe dans le schéma Prisma mais n'est jamais écrit par le job d'import.
**Impact :** Impossible de savoir quand un projet a été synchronisé pour la dernière fois. Rend un éventuel job de "détection de projets non re-synchés depuis X jours" impossible à implémenter.

---

### Bug #7 — ImportedProject.sourceCreatedAt jamais peuplé (MOYEN)
**Fichier :** `lib/import-bags.js` — absent des blocs `create` et `update`
**Problème :** `sourceCreatedAt` n'est jamais passé dans les données d'écriture. `createdAtFromSource` est peuplé, mais `sourceCreatedAt` reste toujours null dans `ImportedProject` et par propagation dans `Project`.
**Impact :** `Project.sourceCreatedAt` est null pour tous les projets. Si un consumer fait la distinction entre les deux timestamps source, il ne voit que des nulls.

---

### Bug #8 — Filtre hasToken sur tokenAddress au lieu du champ dédié (MINEUR)
**Fichier :** `app/api/projects/route.ts` ligne 32–33
**Code :** `hasToken ? { tokenAddress: { not: null } } : { tokenAddress: null }`
**Problème :** Le filtre `hasToken` utilise `tokenAddress IS NOT NULL` alors que le champ booléen `Project.hasToken` a été ajouté précisément pour cet usage. Légère incohérence de surface mais pas de bug fonctionnel si les deux restent synchronisés.
**Impact :** Si `hasToken` et `tokenAddress` divergent un jour (ex. token révoqué), le filtre retourne le mauvais ensemble.

---

### Bug #9 — ProjectDetail DTO incomplet vs select Prisma (MINEUR)
**Fichier :** `lib/project-dto.ts` / `app/api/projects/[slug]/route.ts`
**Problème :** Le type `ProjectDetail` ne déclare pas `twitterFollowersCount` ni `twitterFollowingCount`, alors que le select Prisma les inclut (lignes 29–30). Inversement, plusieurs champs projetés par sync-projects ne sont ni dans le select ni dans le DTO (voir section 4).
**Impact :** Les consumers TypeScript de `ProjectDetail` ne peuvent pas utiliser `twitterFollowersCount` sans cast. Les champs manquants du select sont invisibles côté client même s'ils existent en DB.

---

### Bug #10 — Double update Project dans sync-projects (COSMÉTIQUE)
**Fichier :** `lib/sync-projects.ts` lignes 676 et 838
**Problème :** Chaque projet fait l'objet de deux `prisma.project.update` successifs : le premier écrit les données de base, le second écrase certains champs (`hasToken`, `hasLinkedCreator`, `updatesCount`, etc.). Deux round-trips DB par projet au lieu d'un.
**Impact :** Pas d'impact fonctionnel si les valeurs sont cohérentes. Doublement du coût d'écriture sur le full sync.

---

## 6. Données manquantes

Comparaison entre ce que les APIs Bags retournent (selon `docs/api-reference.md`) et ce que le pipeline capture effectivement.

### API 1 — Liste des projets

| Champ API | Capturé ? | Remarque |
|---|---|---|
| `twitterUser.url` | NON | Présent dans `rawDetailPayload` mais non extrait. C'est l'URL du site web du projet — potentiellement la donnée la plus utile pour un lien externe. `Project.twitterUserUrl` est extrait par sync-projects depuis le raw mais pointe vers l'URL Twitter de l'*utilisateur*, pas vers le site du projet. |
| `twitterUser.entities` | Raw seulement | Contient les URLs expandées. Non exploité. |

Tous les autres champs documentés de l'API 1 sont capturés.

---

### API 2 — Détail d'un projet

| Champ API | Capturé ? | Remarque |
|---|---|---|
| `createdAt` | OUI → `createdAtFromSource` | Correctement capturé. |

Rien de manquant sur l'API 2.

---

### API 3 — Updates d'un projet

| Champ API | Capturé ? | Remarque |
|---|---|---|
| `_id` → `sourceUpdateId` | OUI | |
| `hackathonUuid` → `sourceProjectUuid` | OUI | |
| `userId` → `sourceUserId` | OUI | |
| `text` → `contentText` | OUI | |
| `createdAt`, `updatedAt` | OUI | |

Les updates sont stockées dans `ImportedProjectUpdate` et **projetées** dans `Project` via `updatesCount` et `lastUpdateAt`. Rien de perdu sur l'API 3.

---

### API 4 — Lifetime fees

| Champ API | Capturé ? | Remarque |
|---|---|---|
| `response` (lamports) | OUI → `lifetimeFeesLamports` | Stocké comme string brute, jamais converti en nombre. |

---

### API 5 — Claim stats

| Champ API | Capturé ? | Remarque |
|---|---|---|
| `wallet` | NON | L'identité de chaque claimer est perdue. Impossible de savoir quels wallets ont claimé. |
| `totalClaimed` | NON (bug #4) | Champ présent dans l'API mais le code lit `amount` → agrégat toujours 0. |
| `royaltyBps` | NON | Royalty par claimer perdue. |
| `isCreator` | Agrégé seulement → `hasCreator` | L'information par claimer est perdue, seul le booléen global est conservé. |
| `twitterUsername` | NON | |
| `providerUsername` | NON | |
| `bagsUsername` | NON | |
| `isAdmin` | NON | |

---

### API 6 — Creators

| Champ API | Capturé ? | Remarque |
|---|---|---|
| `wallet` | Partiel → `creatorWallets[]` (max 30) | Mais bug #1 : endpoint appelé sur la mauvaise URL → en pratique jamais peuplé. |
| `isCreator` | Agrégé → `hasCreator` | |
| `twitterUsername` | NON | Permettrait de lier creator → profil Twitter sans passer par twitterUser. |
| `providerUsername` | NON | |
| `bagsUsername` | NON | |
| `pfp` | NON | Avatar du creator perdu. |
| `royaltyBps` | NON | Part des fees du creator perdue. |
| `provider` | NON | Impossible de savoir si creator est lié via Twitter, GitHub, etc. |
| `isAdmin` | NON | |
| `username` | NON | |

---

### APIs 7 à 10 — Non utilisées

| API | Données absentes du pipeline |
|---|---|
| API 7 — Token claim events | Historique temporel des claims (wallet, montant, timestamp, signature). Signal de traction dans le temps inexistant. |
| API 8 — Fee share wallet | Résolution handle social → wallet Bags. Permettrait de lier un creator Twitter à son wallet sans passer par l'API 6. |
| API 9 — Token launch feed | Feed général Bags. Non pertinent pour le scope hackathon. |
| API 10 — Bags pool by mint | Clés de pool DBC/DAMM. Non pertinent pour le scope hackathon. |

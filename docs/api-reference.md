# API Reference — Bags.fm

Ce document décrit les APIs utilisées par le pipeline Pitchr pour importer
et enrichir les données des projets hackathon Bags.

## APIs non officielles (api2.bags.fm)

Ces endpoints ne sont pas dans la doc publique Bags. Ils ne nécessitent pas
de clé API mais peuvent changer sans préavis.

---

### API 1 — Liste des projets

GET https://api2.bags.fm/api/v1/hackathon/list?page={N}

Utilisée par : import-bags
Pagination : paramètre `page` (commence à 1)

Champs retournés par projet :

| Champ | Type | Nullable | Capturé |
|---|---|---|---|
| _id | string (MongoDB) | non | raw seulement |
| userId | string | non | oui → sourceUserId |
| uuid | string | non | oui → sourceProjectId |
| name | string | non | oui |
| description | string | parfois vide | oui |
| category | string | non | oui |
| icon | string (url) | non | oui → iconUrl |
| status | string | non | oui |
| twitterUrl | string | non | oui |
| tokenAddress | string | OUI (~40% null) | oui |
| upvotes | int | non | oui |
| downvotes | int | non | oui |
| twitterUser | object | OUI (~20% null) | voir détail ci-dessous |
| twitterUser.id | string | — | oui → twitterUserId |
| twitterUser.username | string | — | oui |
| twitterUser.name | string | — | oui |
| twitterUser.verified | boolean | — | oui |
| twitterUser.verified_type | string | — | oui |
| twitterUser.profile_image_url | string | — | oui → twitterProfileImage |
| twitterUser.description | string | — | oui |
| twitterUser.created_at | string (ISO) | — | oui |
| twitterUser.public_metrics.followers_count | int | — | oui |
| twitterUser.public_metrics.following_count | int | — | oui |
| twitterUser.public_metrics.tweet_count | int | — | oui |
| twitterUser.public_metrics.listed_count | int | — | oui |
| twitterUser.public_metrics.like_count | int | — | oui |
| twitterUser.public_metrics.media_count | int | — | oui |
| twitterUser.url | string | oui | NON — url site projet perdue |
| twitterUser.entities | object | oui | raw seulement |

⚠️ twitterUser peut être null. C'est valide. Ne pas rejeter un projet pour cette raison.
Les seuls champs obligatoires pour accepter un projet sont : uuid, name, icon, category.

---

### API 2 — Détail d'un projet

GET https://api2.bags.fm/api/v1/hackathon/{uuid}

Utilisée par : import-bags
Mêmes champs que la liste, plus :

| Champ | Type | Capturé |
|---|---|---|
| createdAt | string (ISO datetime) | oui → createdAtFromSource |

---

### API 3 — Updates d'un projet

GET https://api2.bags.fm/api/v1/hackathon/{uuid}/updates?limit=50&offset=0

Utilisée par : import-bags-updates
Pagination : paramètres limit + offset

| Champ | Type | Capturé |
|---|---|---|
| _id | string (MongoDB) | oui → sourceUpdateId |
| hackathonUuid | string | oui → sourceProjectUuid |
| userId | string | oui → sourceUserId |
| text | string | oui → contentText |
| createdAt | string (ISO) | oui → createdAtFromSource |
| updatedAt | string (ISO) | oui → updatedAtFromSource |

⚠️ Ces updates sont stockées dans ImportedProjectUpdate mais ne sont pas
projetées dans Project. L'UI ne peut donc pas afficher l'activité d'un projet.

---

## APIs officielles (public-api-v2.bags.fm)

Ces endpoints sont dans la doc officielle Bags (docs.bags.fm).
Ils nécessitent un header `x-api-key: YOUR_API_KEY`.

---

### API 4 — Lifetime fees d'un token

GET https://public-api-v2.bags.fm/api/v1/token-launch/lifetime-fees?tokenMint={MINT}

Utilisée par : import-bags-token-enrichments

| Champ | Type | Capturé |
|---|---|---|
| response | string (lamports bigint) | oui → lifetimeFeesLamports (string brute) |

---

### API 5 — Claim stats d'un token

GET https://public-api-v2.bags.fm/api/v1/token-launch/claim-stats?tokenMint={MINT}

Utilisée par : import-bags-token-enrichments
Retourne un tableau (un objet par claimer).

| Champ | Type | Capturé |
|---|---|---|
| wallet | string (base58) | NON — perdu |
| totalClaimed | string (lamports) | NON — seul l'agrégat global est gardé |
| royaltyBps | int | NON — perdu |
| isCreator | boolean | agrégé seulement → hasCreator |
| twitterUsername | string | NON — perdu |
| providerUsername | string | NON — perdu |
| bagsUsername | string | NON — perdu |
| isAdmin | boolean | NON — perdu |

---

### API 6 — Creators d'un token

GET https://public-api-v2.bags.fm/api/v1/token-launch/creator/v3?tokenMint={MINT}

Utilisée par : import-bags-token-enrichments
Retourne un tableau (un objet par creator).

| Champ | Type | Capturé |
|---|---|---|
| wallet | string (base58) | partiel → creatorWallets[] (max 30) |
| isCreator | boolean | agrégé → hasCreator |
| twitterUsername | string | NON — perdu |
| providerUsername | string | NON — perdu |
| bagsUsername | string | NON — perdu |
| pfp | string (url) | NON — perdu |
| royaltyBps | int | NON — perdu |
| provider | string (ex: "twitter") | NON — perdu |
| isAdmin | boolean | NON — perdu |
| username | string (interne Bags) | NON — perdu |

⚠️ Un 404 sur cet endpoint ne signifie pas "pas de creator".
Il peut signifier que l'endpoint est indisponible pour ce token.
Ne pas assimiler 404 à hasCreator=false.

---

## Résumé des problèmes connus

1. twitterUser null provoque le rejet de ~20% des projets à l'import → DB incomplète
2. Les champs creator (wallet, twitterUsername, royaltyBps...) sont perdus aux APIs 5 et 6
3. Les updates (API 3) ne remontent pas dans Project → pas de signal d'activité en UI
4. Un 404 sur l'API 6 creators est traité comme "pas de creator" → signal faussé

---

### API 7 — Token Claim Events

GET https://public-api-v2.bags.fm/api/v1/fee-share/token/claim-events?tokenMint={MINT}

Requiert header `x-api-key`.
Non utilisée aujourd'hui dans le pipeline.

Deux modes de pagination :
- `mode=offset` (défaut) : paramètres `limit` (max 100) et `offset`
- `mode=time` : paramètres `from` et `to` (unix timestamps)

Retourne un tableau d'événements. Un objet par claim :

| Champ | Type | Description |
|---|---|---|
| wallet | string (base58) | Wallet qui a effectué le claim |
| isCreator | boolean | Ce wallet est-il le creator du token |
| amount | string (lamports) | Montant claimé |
| signature | string | Signature de la transaction Solana |
| timestamp | string | Horodatage de l'événement |

---

### API 8 — Fee Share Wallet par handle social

GET https://public-api-v2.bags.fm/api/v1/token-launch/fee-share/wallet/v2?provider=twitter&username={HANDLE}

Requiert header `x-api-key`.
Non utilisée aujourd'hui dans le pipeline.

Paramètres :
- `provider` : twitter, github, instagram, tiktok, apple, google, email, solana, kick, onlyfans, moltbook
- `username` : handle sur cette plateforme

| Champ | Type | Description |
|---|---|---|
| provider | string | Plateforme sociale |
| platformData.id | string | ID sur la plateforme |
| platformData.username | string | Handle |
| platformData.display_name | string | Nom affiché |
| platformData.avatar_url | string (url) | Avatar |
| wallet | string (base58) | Wallet Bags associé |

---

### API 9 — Token Launch Feed

GET https://public-api-v2.bags.fm/api/v1/token-launch/feed

Requiert header `x-api-key`.
Non utilisée aujourd'hui. Feed général Bags — pas spécifique hackathon.

| Champ | Type |
|---|---|
| name | string |
| symbol | string |
| description | string |
| image | string (url) |
| tokenMint | string (base58) |
| status | string ("PRE_LAUNCH"...) |
| twitter | string |
| website | string |
| launchSignature | string |
| accountKeys | string[] |
| numRequiredSigners | int |
| uri | string |
| dbcPoolKey | string |
| dbcConfigKey | string |

---

### API 10 — Bags Pool par Token Mint

GET https://public-api-v2.bags.fm/api/v1/solana/bags/pools/token-mint?tokenMint={MINT}

Requiert header `x-api-key`.
Non utilisée aujourd'hui.

| Champ | Type |
|---|---|
| tokenMint | string (base58) |
| dbcConfigKey | string |
| dbcPoolKey | string |
| dammV2PoolKey | string |

---

## Récapitulatif — toutes les APIs

| # | API | URL | Utilisée | Ce qu'on perd |
|---|---|---|---|---|
| 1 | Hackathon list | api2.bags.fm/api/v1/hackathon/list | ✅ | projets avec twitterUser=null rejetés |
| 2 | Hackathon detail | api2.bags.fm/api/v1/hackathon/{uuid} | ✅ | rien de critique |
| 3 | Hackathon updates | api2.bags.fm/api/v1/hackathon/{uuid}/updates | ✅ | non projetées dans Project |
| 4 | Token lifetime fees | /token-launch/lifetime-fees | ✅ | string brute non convertie |
| 5 | Token claim stats | /token-launch/claim-stats | ⚠️ | wallet + totalClaimed par claimer perdus |
| 6 | Token creators | /token-launch/creator/v3 | ⚠️ | providerUsername, royaltyBps, pfp perdus |
| 7 | Token claim events | /fee-share/token/claim-events | 🔲 | signal de traction temporelle absent |
| 8 | Fee share wallet | /token-launch/fee-share/wallet/v2 | 🔲 | résolution Twitter → wallet absente |
| 9 | Token launch feed | /token-launch/feed | 🔲 | non pertinent MVP |
| 10 | Bags pool by mint | /solana/bags/pools/token-mint | 🔲 | non pertinent MVP |

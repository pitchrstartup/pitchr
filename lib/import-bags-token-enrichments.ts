import { Prisma } from '@prisma/client';

const SOURCE = 'bags_hackathon';
const BASE_URL = 'https://public-api-v2.bags.fm/api/v1';
const IMPORT_CURSOR_KEY = 'bags:token-enrichments:cursor:v1';
const DEFAULT_BATCH_SIZE = 30;
const MAX_BATCH_SIZE = 200;
const REQUEST_TIMEOUT_MS = 20000;
const REQUEST_RETRIES = 3;
const REQUEST_DELAY_MS = 200;

const ENDPOINTS = {
  lifetimeFees: '/token-launch/lifetime-fees',
  claimStats: '/token-launch/claim-stats',
  launchCreators: '/token-launch/creators',
} as const;

type TokenProjectRow = {
  sourceProjectId: string;
  tokenAddress: string | null;
};

type ClaimEvent = {
  walletAddress?: unknown;
  amount?: unknown;
  isCreator?: unknown;
  creator?: unknown;
  wallet?: unknown;
};

type LaunchCreator = {
  walletAddress?: unknown;
  address?: unknown;
  wallet?: unknown;
  isCreator?: unknown;
};

function assertTokenEnrichmentCompatibility({ prisma }: { prisma: any }) {
  if (!prisma || typeof prisma !== 'object') {
    throw new Error('Prisma client is undefined for token enrichments import');
  }

  if (!prisma.importedProject) {
    throw new Error('Prisma client is missing importedProject delegate');
  }

  if (!prisma.importedTokenMetrics) {
    throw new Error('Prisma client is missing importedTokenMetrics delegate. Run prisma generate.');
  }

  if (!prisma.importCursor) {
    throw new Error('Prisma client is missing importCursor delegate');
  }

  const importedTokenMetricsModel = Prisma.dmmf.datamodel.models.find(
    (entry) => entry.name === 'ImportedTokenMetrics',
  );

  if (!importedTokenMetricsModel) {
    throw new Error('ImportedTokenMetrics model not found in generated Prisma client DMMF');
  }
}

function normalizeBatchSize(rawValue: string | number | undefined) {
  const asNumber = Number(rawValue);

  if (!Number.isFinite(asNumber) || asNumber <= 0) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.min(Math.floor(asNumber), MAX_BATCH_SIZE);
}

function normalizeTokenMint(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function parseBigintLike(value: unknown): bigint | null {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const normalized = value.trim();
    if (/^-?\d+$/.test(normalized)) {
      try {
        return BigInt(normalized);
      } catch {
        return null;
      }
    }
  }

  return null;
}

function addLamports(accumulator: bigint, value: unknown): bigint {
  const parsed = parseBigintLike(value);
  return parsed === null ? accumulator : accumulator + parsed;
}

function toLamportsString(value: bigint): string {
  return value.toString();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchBagsEndpoint({
  endpoint,
  tokenMint,
  apiKey,
}: {
  endpoint: string;
  tokenMint: string;
  apiKey: string;
}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('tokenMint', tokenMint);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= REQUEST_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'x-api-key': apiKey,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();
      return payload;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown fetch error';
      lastError = new Error(errorMessage);

      if (attempt < REQUEST_RETRIES) {
        await sleep(REQUEST_DELAY_MS * attempt);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error('Unknown fetch error');
}

async function getProjectsBatch({
  prisma,
  batchSize,
}: {
  prisma: any;
  batchSize: number;
}): Promise<{
  projects: TokenProjectRow[];
  totalProjects: number;
  nextCursor: number;
}> {
  const where = {
    source: SOURCE,
    tokenAddress: {
      not: null,
    },
  } as const;

  const totalProjects = await prisma.importedProject.count({ where });

  if (totalProjects === 0) {
    await prisma.importCursor.upsert({
      where: { key: IMPORT_CURSOR_KEY },
      create: {
        key: IMPORT_CURSOR_KEY,
        cursor: 0,
        batchSize,
        metadata: { source: SOURCE, totalProjects },
      },
      update: {
        cursor: 0,
        batchSize,
        metadata: { source: SOURCE, totalProjects },
      },
    });

    return { projects: [], totalProjects: 0, nextCursor: 0 };
  }

  const persisted = await prisma.importCursor.upsert({
    where: { key: IMPORT_CURSOR_KEY },
    create: {
      key: IMPORT_CURSOR_KEY,
      cursor: 0,
      batchSize,
      metadata: { source: SOURCE, totalProjects },
    },
    update: {
      batchSize,
      metadata: { source: SOURCE, totalProjects },
    },
    select: { cursor: true },
  });

  const startCursor = ((persisted.cursor % totalProjects) + totalProjects) % totalProjects;

  const firstSlice = await prisma.importedProject.findMany({
    where,
    select: {
      sourceProjectId: true,
      tokenAddress: true,
    },
    orderBy: { sourceProjectId: 'asc' },
    skip: startCursor,
    take: batchSize,
  });

  let projects = firstSlice;

  if (firstSlice.length < batchSize && totalProjects > firstSlice.length) {
    const remaining = batchSize - firstSlice.length;
    const wrappedSlice = await prisma.importedProject.findMany({
      where,
      select: {
        sourceProjectId: true,
        tokenAddress: true,
      },
      orderBy: { sourceProjectId: 'asc' },
      take: remaining,
    });

    projects = firstSlice.concat(wrappedSlice);
  }

  const nextCursor = (startCursor + projects.length) % totalProjects;

  await prisma.importCursor.update({
    where: { key: IMPORT_CURSOR_KEY },
    data: {
      cursor: nextCursor,
      batchSize,
      metadata: {
        source: SOURCE,
        totalProjects,
        projectsProcessed: projects.length,
      },
    },
  });

  return {
    projects,
    totalProjects,
    nextCursor,
  };
}

function normalizeClaimStats(responsePayload: unknown) {
  const events = asArray(responsePayload) as ClaimEvent[];
  const uniqueWallets = new Set<string>();

  let total = BigInt(0);
  let creator = BigInt(0);

  for (const event of events) {
    const wallet = normalizeTokenMint(event?.walletAddress ?? event?.wallet);
    if (wallet) {
      uniqueWallets.add(wallet.toLowerCase());
    }

    total = addLamports(total, event?.amount);

    const creatorSignal = event?.isCreator === true || event?.creator === true;
    if (creatorSignal) {
      creator = addLamports(creator, event?.amount);
    }
  }

  return {
    claimsTotalLamports: toLamportsString(total),
    claimsCreatorLamports: toLamportsString(creator),
    claimsUniqueWallets: uniqueWallets.size,
  };
}

function normalizeLaunchCreators(responsePayload: unknown) {
  const creators = asArray(responsePayload) as LaunchCreator[];
  const dedupedWallets = new Set<string>();

  for (const creator of creators) {
    const wallet = normalizeTokenMint(creator?.walletAddress ?? creator?.address ?? creator?.wallet);
    if (wallet) {
      dedupedWallets.add(wallet);
    }
  }

  const creatorWallets = Array.from(dedupedWallets).slice(0, 30);

  return {
    creatorWallets,
    creatorCount: creatorWallets.length,
    hasCreator: creatorWallets.length > 0,
  };
}

export async function importBagsTokenEnrichments({
  prisma,
  batchSize = process.env.BAGS_TOKEN_ENRICHMENTS_BATCH_SIZE,
  apiKey = process.env.BAGS_API_KEY,
}: {
  prisma: any;
  batchSize?: string | number;
  apiKey?: string;
}) {
  assertTokenEnrichmentCompatibility({ prisma });

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('BAGS_API_KEY is required for token enrichments import');
  }

  const resolvedBatchSize = normalizeBatchSize(batchSize);

  const { projects, nextCursor } = await getProjectsBatch({
    prisma,
    batchSize: resolvedBatchSize,
  });

  const tokens = Array.from(
    new Set(
      projects
        .map((row) => normalizeTokenMint(row.tokenAddress))
        .filter((value): value is string => value !== null),
    ),
  );

  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const tokenMint of tokens) {
    const existing = await prisma.importedTokenMetrics.findUnique({
      where: {
        source_tokenMint: {
          source: SOURCE,
          tokenMint,
        },
      },
      select: {
        id: true,
        lifetimeFeesLamports: true,
        claimsTotalLamports: true,
        claimsCreatorLamports: true,
        claimsUniqueWallets: true,
        creatorCount: true,
        hasCreator: true,
        creatorWallets: true,
        rawLifetimeFeesPayload: true,
        rawClaimStatsPayload: true,
        rawLaunchCreatorsPayload: true,
      },
    });

    const errors: string[] = [];

    let lifetimeFeesPayload: any = null;
    let claimStatsPayload: any = null;
    let launchCreatorsPayload: any = null;

    try {
      lifetimeFeesPayload = await fetchBagsEndpoint({ endpoint: ENDPOINTS.lifetimeFees, tokenMint, apiKey });
    } catch (error) {
      errors.push(`lifetimeFees:${error instanceof Error ? error.message : 'unknown'}`);
    }

    try {
      claimStatsPayload = await fetchBagsEndpoint({ endpoint: ENDPOINTS.claimStats, tokenMint, apiKey });
    } catch (error) {
      errors.push(`claimStats:${error instanceof Error ? error.message : 'unknown'}`);
    }

    try {
      launchCreatorsPayload = await fetchBagsEndpoint({ endpoint: ENDPOINTS.launchCreators, tokenMint, apiKey });
    } catch (error) {
      errors.push(`launchCreators:${error instanceof Error ? error.message : 'unknown'}`);
    }

    const hadSuccess = Boolean(lifetimeFeesPayload || claimStatsPayload || launchCreatorsPayload);

    if (!hadSuccess) {
      failed += 1;
      console.warn('[cron-import-token-enrichments] token skipped: all endpoints failed', {
        tokenMint,
        errors,
      });
      continue;
    }

    const lifetimeFeesLamports =
      normalizeTokenMint(lifetimeFeesPayload?.response) ?? existing?.lifetimeFeesLamports ?? null;

    const claimStats = claimStatsPayload
      ? normalizeClaimStats(claimStatsPayload?.response)
      : {
          claimsTotalLamports: existing?.claimsTotalLamports ?? null,
          claimsCreatorLamports: existing?.claimsCreatorLamports ?? null,
          claimsUniqueWallets: existing?.claimsUniqueWallets ?? null,
        };

    const launchCreators = launchCreatorsPayload
      ? normalizeLaunchCreators(launchCreatorsPayload?.response)
      : {
          creatorWallets: (existing?.creatorWallets as Prisma.JsonValue) ?? [],
          creatorCount: existing?.creatorCount ?? null,
          hasCreator: existing?.hasCreator ?? null,
        };

    try {
      await prisma.importedTokenMetrics.upsert({
        where: {
          source_tokenMint: {
            source: SOURCE,
            tokenMint,
          },
        },
        create: {
          source: SOURCE,
          tokenMint,
          lifetimeFeesLamports,
          claimsTotalLamports: claimStats.claimsTotalLamports,
          claimsCreatorLamports: claimStats.claimsCreatorLamports,
          claimsUniqueWallets: claimStats.claimsUniqueWallets,
          creatorCount: launchCreators.creatorCount,
          hasCreator: launchCreators.hasCreator,
          creatorWallets: launchCreators.creatorWallets,
          rawLifetimeFeesPayload: lifetimeFeesPayload ?? {},
          rawClaimStatsPayload: claimStatsPayload ?? {},
          rawLaunchCreatorsPayload: launchCreatorsPayload ?? {},
          lastFetchedAt: new Date(),
        },
        update: {
          lifetimeFeesLamports,
          claimsTotalLamports: claimStats.claimsTotalLamports,
          claimsCreatorLamports: claimStats.claimsCreatorLamports,
          claimsUniqueWallets: claimStats.claimsUniqueWallets,
          creatorCount: launchCreators.creatorCount,
          hasCreator: launchCreators.hasCreator,
          creatorWallets: launchCreators.creatorWallets,
          rawLifetimeFeesPayload: lifetimeFeesPayload ?? existing?.rawLifetimeFeesPayload ?? {},
          rawClaimStatsPayload: claimStatsPayload ?? existing?.rawClaimStatsPayload ?? {},
          rawLaunchCreatorsPayload: launchCreatorsPayload ?? existing?.rawLaunchCreatorsPayload ?? {},
          lastFetchedAt: new Date(),
        },
      });

      if (existing) {
        updated += 1;
      } else {
        inserted += 1;
      }

      if (errors.length > 0) {
        failed += 1;
        console.warn('[cron-import-token-enrichments] token partial failure', {
          tokenMint,
          errors,
        });
      }
    } catch (error) {
      failed += 1;
      console.error('[cron-import-token-enrichments] token write failed', {
        tokenMint,
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  return {
    batchSize: resolvedBatchSize,
    projectsProcessed: projects.length,
    tokensProcessed: tokens.length,
    inserted,
    updated,
    failed,
    nextCursor,
  };
}

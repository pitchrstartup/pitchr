import { Prisma } from '@prisma/client';

const REJECTION_SAMPLE_LIMIT = 10;
const SYNC_CURSOR_KEY = 'bags:sync-projects:cursor:v1';
const DEFAULT_BATCH_SIZE = 0;
const MAX_BATCH_SIZE = 500;

const PRIMARY_RELATION_ROLE = 'primary';

type ProjectSyncClient = {
  importedProject: {
    count: (args?: Prisma.ImportedProjectCountArgs) => Promise<number>;
    findMany: (args: Prisma.ImportedProjectFindManyArgs) => Promise<ImportedProjectRow[]>;
  };
  importedProjectUpdate: {
    findMany: (args: Prisma.ImportedProjectUpdateFindManyArgs) => Promise<ImportedProjectUpdateRow[]>;
  };
  importedTokenMetrics: {
    findMany: (args: Prisma.ImportedTokenMetricsFindManyArgs) => Promise<ImportedTokenMetricsRow[]>;
  };
  importCursor: {
    upsert: (args: Prisma.ImportCursorUpsertArgs) => Promise<{ cursor: number }>;
    update: (args: Prisma.ImportCursorUpdateArgs) => Promise<{ id: string }>;
  };
  creator: {
    upsert: (args: Prisma.CreatorUpsertArgs) => Promise<{ id: string }>;
  };
  token: {
    upsert: (args: Prisma.TokenUpsertArgs) => Promise<{ id: string }>;
  };
  projectCreator: {
    upsert: (args: Prisma.ProjectCreatorUpsertArgs) => Promise<{ id: string }>;
    deleteMany: (args: Prisma.ProjectCreatorDeleteManyArgs) => Promise<{ count: number }>;
    count: (args?: Prisma.ProjectCreatorCountArgs) => Promise<number>;
  };
  projectToken: {
    upsert: (args: Prisma.ProjectTokenUpsertArgs) => Promise<{ id: string }>;
    deleteMany: (args: Prisma.ProjectTokenDeleteManyArgs) => Promise<{ count: number }>;
  };
  project: {
    findUnique: (args: Prisma.ProjectFindUniqueArgs) => Promise<{ id: string; slug: string } | null>;
    create: (args: Prisma.ProjectCreateArgs) => Promise<{ id: string }>;
    update: (args: Prisma.ProjectUpdateArgs) => Promise<{ id: string }>;
  };
};

type ImportedProjectRow = {
  id: string;
  source: string;
  sourceProjectId: string;
  sourceUrl: string;
  name: string;
  description: string;
  category: string;
  iconUrl: string;
  sourceStatus: string | null;
  tokenAddress: string | null;
  sourceUserId: string | null;
  twitterUrl: string;
  twitterUserId: string | null;
  twitterUsername: string | null;
  twitterName: string | null;
  twitterProfileImage: string | null;
  twitterVerified: boolean | null;
  upvotes: number | null;
  downvotes: number | null;
  createdAtFromSource: Date | null;
  sourceCreatedAt: Date | null;
  rawListPayload: Prisma.JsonValue;
  rawDetailPayload: Prisma.JsonValue;
};

type ImportedProjectUpdateRow = {
  projectId: string;
  createdAtFromSource: Date | null;
  updatedAtFromSource: Date | null;
};

type ImportedTokenMetricsRow = {
  tokenMint: string;
  lifetimeFeesLamports: string | null;
  claimsTotalLamports: string | null;
  claimsCreatorLamports: string | null;
  claimsUniqueWallets: number | null;
  creatorCount: number | null;
  hasCreator: boolean | null;
  creatorsDataStatus: string | null;
  lastFetchedAt: Date | null;
};

type ProjectionRow = {
  source: string;
  sourceProjectId: string;
  sourceUrl: string | null;
  name: string;
  description: string | null;
  category: string | null;
  iconUrl: string | null;
  sourceStatus: string | null;
  tokenAddress: string | null;
  sourceUserId: string | null;
  twitterUrl: string | null;
  twitterUserId: string | null;
  twitterUsername: string | null;
  twitterName: string | null;
  twitterProfileImage: string | null;
  twitterVerified: boolean | null;
  twitterDescription: string | null;
  twitterCreatedAt: Date | null;
  twitterVerifiedType: string | null;
  twitterUserUrl: string | null;
  twitterFollowersCount: number | null;
  twitterFollowingCount: number | null;
  twitterTweetCount: number | null;
  twitterListedCount: number | null;
  twitterLikeCount: number | null;
  twitterMediaCount: number | null;
  upvotes: number | null;
  downvotes: number | null;
  lifetimeFeesLamports: string | null;
  claimsTotalLamports: string | null;
  claimsCreatorLamports: string | null;
  claimsUniqueWallets: number | null;
  creatorCount: number | null;
  hasLaunchCreator: boolean | null;
  creatorsDataStatus: string | null;
  hasToken: boolean;
  createdAtFromSource: Date | null;
  sourceCreatedAt: Date | null;
  rawListPayload: Prisma.InputJsonValue;
  rawDetailPayload: Prisma.InputJsonValue;
};

type CreatorProjection = {
  identityKey: string;
  source: string;
  sourceUserId: string | null;
  twitterUserId: string | null;
  twitterUsername: string | null;
  twitterName: string | null;
  twitterVerified: boolean | null;
  twitterFollowersCount: number | null;
  twitterProfileImage: string | null;
};

function normalizeBatchSize(rawValue: string | number | undefined): number {
  const asNumber = Number(rawValue);
  if (!Number.isFinite(asNumber) || asNumber <= 0) return DEFAULT_BATCH_SIZE;
  return Math.min(Math.floor(asNumber), MAX_BATCH_SIZE);
}

function asRecord(value: Prisma.JsonValue | null | undefined): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.trunc(parsed);
  }
  return null;
}

function asDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toInputJson(value: Prisma.JsonValue): Prisma.InputJsonValue {
  return (value ?? {}) as Prisma.InputJsonValue;
}

function slugifyName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug.length > 0 ? slug : 'project';
}

function stableSuffix(sourceProjectId: string): string {
  const normalized = sourceProjectId.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalized.length > 0 ? normalized : 'src';
}

function maxDate(current: Date | null, candidate: Date | null): Date | null {
  if (!candidate) return current;
  if (!current) return candidate;
  return candidate > current ? candidate : current;
}

async function resolveUniqueSlug({
  prisma,
  name,
  source,
  sourceProjectId,
  existingProjectId,
}: {
  prisma: ProjectSyncClient;
  name: string;
  source: string;
  sourceProjectId: string;
  existingProjectId: string | null;
}): Promise<string> {
  const baseSlug = slugifyName(name);
  const suffix = stableSuffix(sourceProjectId);

  const candidates: string[] = [baseSlug];
  if (suffix.length >= 8) {
    candidates.push(`${baseSlug}-${suffix.slice(0, 8)}`);
  }
  if (suffix.length >= 12) {
    candidates.push(`${baseSlug}-${suffix.slice(0, 12)}`);
  }
  candidates.push(`${baseSlug}-${suffix}`);

  for (const candidate of candidates) {
    const collision = await prisma.project.findUnique({
      where: { slug: candidate },
      select: { id: true, slug: true },
    });

    if (!collision || collision.id === existingProjectId) {
      return candidate;
    }
  }

  let attempt = 2;
  while (attempt < 1000) {
    const candidate = `${baseSlug}-${suffix}-${attempt}`;
    const collision = await prisma.project.findUnique({
      where: { slug: candidate },
      select: { id: true, slug: true },
    });

    if (!collision || collision.id === existingProjectId) {
      return candidate;
    }

    attempt += 1;
  }

  return `${baseSlug}-${source}-${stableSuffix(sourceProjectId).slice(0, 20)}`;
}

function extractTwitterFields(rawDetailPayload: Prisma.JsonValue): Pick<
  ProjectionRow,
  | 'twitterDescription'
  | 'twitterCreatedAt'
  | 'twitterVerifiedType'
  | 'twitterUserUrl'
  | 'twitterFollowersCount'
  | 'twitterFollowingCount'
  | 'twitterTweetCount'
  | 'twitterListedCount'
  | 'twitterLikeCount'
  | 'twitterMediaCount'
> {
  const detail = asRecord(rawDetailPayload);
  const twitterUser = asRecord(detail?.twitterUser as Prisma.JsonValue);
  const metrics = asRecord(twitterUser?.public_metrics as Prisma.JsonValue);

  return {
    twitterDescription: asString(twitterUser?.description),
    twitterCreatedAt: asDate(twitterUser?.created_at),
    twitterVerifiedType: asString(twitterUser?.verified_type),
    twitterUserUrl: asString(twitterUser?.url),
    twitterFollowersCount: asNumber(metrics?.followers_count),
    twitterFollowingCount: asNumber(metrics?.following_count),
    twitterTweetCount: asNumber(metrics?.tweet_count),
    twitterListedCount: asNumber(metrics?.listed_count),
    twitterLikeCount: asNumber(metrics?.like_count),
    twitterMediaCount: asNumber(metrics?.media_count),
  };
}

function buildCreatorProjection(imported: ImportedProjectRow): CreatorProjection | null {
  const extractedTwitter = extractTwitterFields(imported.rawDetailPayload);
  const sourceUserId = asString(imported.sourceUserId);
  const twitterUserId = asString(imported.twitterUserId);

  const identityKey = sourceUserId
    ? `${imported.source}:user:${sourceUserId}`
    : twitterUserId
      ? `${imported.source}:twitter:${twitterUserId}`
      : null;

  if (!identityKey) {
    return null;
  }

  return {
    identityKey,
    source: imported.source,
    sourceUserId,
    twitterUserId,
    twitterUsername: asString(imported.twitterUsername),
    twitterName: asString(imported.twitterName),
    twitterVerified: asBoolean(imported.twitterVerified),
    twitterFollowersCount: extractedTwitter.twitterFollowersCount,
    twitterProfileImage: asString(imported.twitterProfileImage),
  };
}

function projectFromImported({
  imported,
  metrics,
}: {
  imported: ImportedProjectRow;
  metrics: ImportedTokenMetricsRow | null;
}): ProjectionRow {
  const extractedTwitter = extractTwitterFields(imported.rawDetailPayload);
  const tokenAddress = asString(imported.tokenAddress);

  return {
    source: imported.source,
    sourceProjectId: imported.sourceProjectId,
    sourceUrl: asString(imported.sourceUrl),
    name: imported.name,
    description: asString(imported.description),
    category: asString(imported.category),
    iconUrl: asString(imported.iconUrl),
    sourceStatus: asString(imported.sourceStatus),
    tokenAddress,
    sourceUserId: asString(imported.sourceUserId),
    twitterUrl: asString(imported.twitterUrl),
    twitterUserId: asString(imported.twitterUserId),
    twitterUsername: asString(imported.twitterUsername),
    twitterName: asString(imported.twitterName),
    twitterProfileImage: asString(imported.twitterProfileImage),
    twitterVerified: asBoolean(imported.twitterVerified),
    ...extractedTwitter,
    upvotes: imported.upvotes,
    downvotes: imported.downvotes,
    lifetimeFeesLamports: metrics?.lifetimeFeesLamports ?? null,
    claimsTotalLamports: metrics?.claimsTotalLamports ?? null,
    claimsCreatorLamports: metrics?.claimsCreatorLamports ?? null,
    claimsUniqueWallets: metrics?.claimsUniqueWallets ?? null,
    creatorCount: metrics?.creatorCount ?? null,
    hasLaunchCreator: metrics?.hasCreator ?? null,
    creatorsDataStatus: metrics?.creatorsDataStatus ?? null,
    hasToken: tokenAddress !== null,
    createdAtFromSource: imported.createdAtFromSource,
    sourceCreatedAt: imported.sourceCreatedAt,
    rawListPayload: toInputJson(imported.rawListPayload),
    rawDetailPayload: toInputJson(imported.rawDetailPayload),
  };
}

async function getImportedRowsBatch({
  prisma,
  batchSize,
}: {
  prisma: ProjectSyncClient;
  batchSize: number;
}) {
  if (batchSize <= 0) {
    const allRows = await prisma.importedProject.findMany({
      select: {
        id: true,
        source: true,
        sourceProjectId: true,
        sourceUrl: true,
        name: true,
        description: true,
        category: true,
        iconUrl: true,
        sourceStatus: true,
        tokenAddress: true,
        sourceUserId: true,
        twitterUrl: true,
        twitterUserId: true,
        twitterUsername: true,
        twitterName: true,
        twitterProfileImage: true,
        twitterVerified: true,
        upvotes: true,
        downvotes: true,
        createdAtFromSource: true,
        sourceCreatedAt: true,
        rawListPayload: true,
        rawDetailPayload: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      rows: allRows,
      totalRows: allRows.length,
      cursor: null,
      nextCursor: null,
      cursorAdvanced: false,
      mode: 'full' as const,
    };
  }

  const totalRows = await prisma.importedProject.count();

  const persisted = await prisma.importCursor.upsert({
    where: { key: SYNC_CURSOR_KEY },
    create: {
      key: SYNC_CURSOR_KEY,
      cursor: 0,
      batchSize,
      metadata: { totalRows },
    },
    update: {
      batchSize,
      metadata: { totalRows },
    },
    select: { cursor: true },
  });

  if (totalRows === 0) {
    return {
      rows: [],
      totalRows,
      cursor: persisted.cursor,
      nextCursor: 0,
      cursorAdvanced: true,
      mode: 'batched' as const,
    };
  }

  const startCursor = ((persisted.cursor % totalRows) + totalRows) % totalRows;

  const firstSlice = await prisma.importedProject.findMany({
    select: {
      id: true,
      source: true,
      sourceProjectId: true,
      sourceUrl: true,
      name: true,
      description: true,
      category: true,
      iconUrl: true,
      sourceStatus: true,
      tokenAddress: true,
      sourceUserId: true,
      twitterUrl: true,
      twitterUserId: true,
      twitterUsername: true,
      twitterName: true,
      twitterProfileImage: true,
      twitterVerified: true,
      upvotes: true,
      downvotes: true,
      createdAtFromSource: true,
      sourceCreatedAt: true,
      rawListPayload: true,
      rawDetailPayload: true,
    },
    orderBy: { sourceProjectId: 'asc' },
    skip: startCursor,
    take: batchSize,
  });

  let rows = firstSlice;

  if (firstSlice.length < batchSize && totalRows > firstSlice.length) {
    const remaining = batchSize - firstSlice.length;
    const wrappedSlice = await prisma.importedProject.findMany({
      select: {
        id: true,
        source: true,
        sourceProjectId: true,
        sourceUrl: true,
        name: true,
        description: true,
        category: true,
        iconUrl: true,
        sourceStatus: true,
        tokenAddress: true,
        sourceUserId: true,
        twitterUrl: true,
        twitterUserId: true,
        twitterUsername: true,
        twitterName: true,
        twitterProfileImage: true,
        twitterVerified: true,
        upvotes: true,
        downvotes: true,
        createdAtFromSource: true,
        sourceCreatedAt: true,
        rawListPayload: true,
        rawDetailPayload: true,
      },
      orderBy: { sourceProjectId: 'asc' },
      take: remaining,
    });

    rows = firstSlice.concat(wrappedSlice);
  }

  const nextCursor = (startCursor + rows.length) % totalRows;

  return {
    rows,
    totalRows,
    cursor: startCursor,
    nextCursor,
    cursorAdvanced: true,
    mode: 'batched' as const,
  };
}

export async function syncProjectsFromImported({
  prisma,
  batchSize = process.env.SYNC_PROJECTS_BATCH_SIZE,
}: {
  prisma: ProjectSyncClient;
  batchSize?: string | number;
}) {
  const resolvedBatchSize = normalizeBatchSize(batchSize);

  const importedRowsBatch = await getImportedRowsBatch({
    prisma,
    batchSize: resolvedBatchSize,
  });

  const importedRows = importedRowsBatch.rows;

  const tokenMints = Array.from(
    new Set(
      importedRows
        .map((row) => asString(row.tokenAddress))
        .filter((value): value is string => value !== null),
    ),
  );

  const tokenMetricsRows =
    tokenMints.length > 0
      ? await prisma.importedTokenMetrics.findMany({
          where: {
            source: 'bags_hackathon',
            tokenMint: {
              in: tokenMints,
            },
          },
          select: {
            tokenMint: true,
            lifetimeFeesLamports: true,
            claimsTotalLamports: true,
            claimsCreatorLamports: true,
            claimsUniqueWallets: true,
            creatorCount: true,
            hasCreator: true,
            creatorsDataStatus: true,
            lastFetchedAt: true,
          },
        })
      : [];

  const tokenMetricsByMint = new Map<string, ImportedTokenMetricsRow>(
    tokenMetricsRows.map((row) => [row.tokenMint, row]),
  );

  const updatesByProjectId = new Map<string, { updatesCount: number; lastUpdateAt: Date | null }>();
  if (importedRows.length > 0) {
    const importedProjectIds = importedRows.map((row) => row.id);
    const updates = await prisma.importedProjectUpdate.findMany({
      where: {
        projectId: {
          in: importedProjectIds,
        },
      },
      select: {
        projectId: true,
        createdAtFromSource: true,
        updatedAtFromSource: true,
      },
    });

    for (const update of updates) {
      const current = updatesByProjectId.get(update.projectId) ?? { updatesCount: 0, lastUpdateAt: null };
      current.updatesCount += 1;
      const candidate = maxDate(update.updatedAtFromSource, update.createdAtFromSource);
      current.lastUpdateAt = maxDate(current.lastUpdateAt, candidate);
      updatesByProjectId.set(update.projectId, current);
    }
  }

  let imported = 0;
  let updated = 0;
  const rowErrors: Array<{ sourceProjectId: string; source: string; reason: string }> = [];

  for (const row of importedRows) {
    try {
      const tokenMint = asString(row.tokenAddress);
      const projection = projectFromImported({
        imported: row,
        metrics: tokenMint ? tokenMetricsByMint.get(tokenMint) ?? null : null,
      });
      const existing = await prisma.project.findUnique({
        where: {
          source_sourceProjectId: {
            source: projection.source,
            sourceProjectId: projection.sourceProjectId,
          },
        },
        select: { id: true, slug: true },
      });

      const slug = await resolveUniqueSlug({
        prisma,
        name: projection.name,
        source: projection.source,
        sourceProjectId: projection.sourceProjectId,
        existingProjectId: existing?.id ?? null,
      });

      const baseUpdateData = {
        slug,
        sourceUrl: projection.sourceUrl,
        name: projection.name,
        description: projection.description,
        category: projection.category,
        iconUrl: projection.iconUrl,
        sourceStatus: projection.sourceStatus,
        tokenAddress: projection.tokenAddress,
        sourceUserId: projection.sourceUserId,
        twitterUrl: projection.twitterUrl,
        twitterUserId: projection.twitterUserId,
        twitterUsername: projection.twitterUsername,
        twitterName: projection.twitterName,
        twitterProfileImage: projection.twitterProfileImage,
        twitterVerified: projection.twitterVerified,
        twitterDescription: projection.twitterDescription,
        twitterCreatedAt: projection.twitterCreatedAt,
        twitterVerifiedType: projection.twitterVerifiedType,
        twitterUserUrl: projection.twitterUserUrl,
        twitterFollowersCount: projection.twitterFollowersCount,
        twitterFollowingCount: projection.twitterFollowingCount,
        twitterTweetCount: projection.twitterTweetCount,
        twitterListedCount: projection.twitterListedCount,
        twitterLikeCount: projection.twitterLikeCount,
        twitterMediaCount: projection.twitterMediaCount,
        upvotes: projection.upvotes,
        downvotes: projection.downvotes,
        lifetimeFeesLamports: projection.lifetimeFeesLamports,
        claimsTotalLamports: projection.claimsTotalLamports,
        claimsCreatorLamports: projection.claimsCreatorLamports,
        claimsUniqueWallets: projection.claimsUniqueWallets,
        creatorCount: projection.creatorCount,
        hasLaunchCreator: projection.hasLaunchCreator,
        creatorsDataStatus: projection.creatorsDataStatus,
        hasToken: projection.hasToken,
        createdAtFromSource: projection.createdAtFromSource,
        sourceCreatedAt: projection.sourceCreatedAt,
        rawListPayload: projection.rawListPayload,
        rawDetailPayload: projection.rawDetailPayload,
      };

      const projectRow = existing
        ? await prisma.project.update({
            where: {
              source_sourceProjectId: {
                source: projection.source,
                sourceProjectId: projection.sourceProjectId,
              },
            },
            data: baseUpdateData,
          })
        : await prisma.project.create({
            data: {
              ...baseUpdateData,
              source: projection.source,
              sourceProjectId: projection.sourceProjectId,
            },
          });

      if (existing) {
        updated += 1;
      } else {
        imported += 1;
      }

      const creatorProjection = buildCreatorProjection(row);
      let linkedCreatorId: string | null = null;

      if (creatorProjection) {
        const creator = await prisma.creator.upsert({
          where: {
            identityKey: creatorProjection.identityKey,
          },
          create: creatorProjection,
          update: {
            sourceUserId: creatorProjection.sourceUserId,
            twitterUserId: creatorProjection.twitterUserId,
            twitterUsername: creatorProjection.twitterUsername,
            twitterName: creatorProjection.twitterName,
            twitterVerified: creatorProjection.twitterVerified,
            twitterFollowersCount: creatorProjection.twitterFollowersCount,
            twitterProfileImage: creatorProjection.twitterProfileImage,
          },
        });

        linkedCreatorId = creator.id;

        await prisma.projectCreator.upsert({
          where: {
            projectId_creatorId_role: {
              projectId: projectRow.id,
              creatorId: creator.id,
              role: PRIMARY_RELATION_ROLE,
            },
          },
          create: {
            projectId: projectRow.id,
            creatorId: creator.id,
            role: PRIMARY_RELATION_ROLE,
            matchSource: creatorProjection.sourceUserId ? 'sourceUserId' : 'twitterUserId',
            confidence: creatorProjection.sourceUserId ? 1 : 0.8,
          },
          update: {
            matchSource: creatorProjection.sourceUserId ? 'sourceUserId' : 'twitterUserId',
            confidence: creatorProjection.sourceUserId ? 1 : 0.8,
          },
        });
      }

      if (!linkedCreatorId) {
        await prisma.projectCreator.deleteMany({
          where: {
            projectId: projectRow.id,
            role: PRIMARY_RELATION_ROLE,
          },
        });
      }

      let linkedTokenId: string | null = null;

      if (tokenMint) {
        const tokenMetrics = tokenMetricsByMint.get(tokenMint) ?? null;
        const token = await prisma.token.upsert({
          where: {
            source_mint: {
              source: projection.source,
              mint: tokenMint,
            },
          },
          create: {
            source: projection.source,
            mint: tokenMint,
            lifetimeFeesLamports: tokenMetrics?.lifetimeFeesLamports ?? null,
            claimsTotalLamports: tokenMetrics?.claimsTotalLamports ?? null,
            claimsCreatorLamports: tokenMetrics?.claimsCreatorLamports ?? null,
            claimsUniqueWallets: tokenMetrics?.claimsUniqueWallets ?? null,
            creatorCount: tokenMetrics?.creatorCount ?? null,
            hasCreator: tokenMetrics?.hasCreator ?? null,
            creatorsDataStatus: tokenMetrics?.creatorsDataStatus ?? null,
            lastFetchedAt: tokenMetrics?.lastFetchedAt ?? null,
          },
          update: {
            lifetimeFeesLamports: tokenMetrics?.lifetimeFeesLamports ?? null,
            claimsTotalLamports: tokenMetrics?.claimsTotalLamports ?? null,
            claimsCreatorLamports: tokenMetrics?.claimsCreatorLamports ?? null,
            claimsUniqueWallets: tokenMetrics?.claimsUniqueWallets ?? null,
            creatorCount: tokenMetrics?.creatorCount ?? null,
            hasCreator: tokenMetrics?.hasCreator ?? null,
            creatorsDataStatus: tokenMetrics?.creatorsDataStatus ?? null,
            lastFetchedAt: tokenMetrics?.lastFetchedAt ?? null,
          },
        });

        linkedTokenId = token.id;

        await prisma.projectToken.upsert({
          where: {
            projectId_tokenId_role: {
              projectId: projectRow.id,
              tokenId: token.id,
              role: PRIMARY_RELATION_ROLE,
            },
          },
          create: {
            projectId: projectRow.id,
            tokenId: token.id,
            role: PRIMARY_RELATION_ROLE,
          },
          update: {},
        });
      }

      if (!linkedTokenId) {
        await prisma.projectToken.deleteMany({
          where: {
            projectId: projectRow.id,
            role: PRIMARY_RELATION_ROLE,
          },
        });
      }

      const creatorProjectsCount = linkedCreatorId
        ? await prisma.projectCreator.count({
            where: {
              creatorId: linkedCreatorId,
            },
          })
        : 0;

      const creatorTokenProjectsCount = linkedCreatorId
        ? await prisma.projectCreator.count({
            where: {
              creatorId: linkedCreatorId,
              project: {
                projectTokens: {
                  some: {},
                },
              },
            },
          })
        : 0;

      const updatesAggregate = updatesByProjectId.get(row.id) ?? { updatesCount: 0, lastUpdateAt: null };

      await prisma.project.update({
        where: { id: projectRow.id },
        data: {
          hasLinkedCreator: linkedCreatorId !== null,
          creatorProjectsCount,
          creatorTokenProjectsCount,
          updatesCount: updatesAggregate.updatesCount,
          lastUpdateAt: updatesAggregate.lastUpdateAt,
          hasToken: linkedTokenId !== null,
        },
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      rowErrors.push({
        sourceProjectId: row.sourceProjectId,
        source: row.source,
        reason,
      });
    }
  }

  if (importedRowsBatch.mode === 'batched' && importedRowsBatch.nextCursor !== null) {
    await prisma.importCursor.update({
      where: { key: SYNC_CURSOR_KEY },
      data: {
        cursor: importedRowsBatch.nextCursor,
        batchSize: resolvedBatchSize,
        metadata: {
          totalRows: importedRowsBatch.totalRows,
          rowsProcessed: importedRows.length,
        },
      },
    });
  }

  return {
    total: importedRows.length,
    totalRows: importedRowsBatch.totalRows,
    imported,
    updated,
    rejected: rowErrors.length,
    rejectedRowsSample: rowErrors.slice(0, REJECTION_SAMPLE_LIMIT),
    mode: importedRowsBatch.mode,
    batchSize: resolvedBatchSize,
    cursor: importedRowsBatch.cursor,
    nextCursor: importedRowsBatch.nextCursor,
    cursorAdvanced: importedRowsBatch.cursorAdvanced,
  };
}

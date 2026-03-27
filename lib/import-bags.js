import { readFile } from 'node:fs/promises';

const SOURCE = 'bags_hackathon';

function nonEmptyString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function coalesce(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function extractPrismaFailureDetails(errorMessage) {
  const message = typeof errorMessage === 'string' ? errorMessage : '';
  const unknownArgumentMatch = message.match(/Unknown argument `([^`]+)`/);
  if (unknownArgumentMatch) {
    return {
      failingField: unknownArgumentMatch[1],
      reasonType: 'unknown_argument',
    };
  }

  const missingArgumentMatch = message.match(/Argument `([^`]+)` is missing/);
  if (missingArgumentMatch) {
    return {
      failingField: missingArgumentMatch[1],
      reasonType: 'missing_required_argument',
    };
  }

  return {
    failingField: null,
    reasonType: 'unknown',
  };
}

export function normalizeProject(project, index) {
  const list = project?.list ?? {};
  const detail = project?.detail?.response ?? {};

  const uuid = nonEmptyString(coalesce(detail.uuid, list.uuid, project?.uuid));
  const name = nonEmptyString(coalesce(detail.name, list.name));
  const description = nonEmptyString(coalesce(detail.description, list.description));
  const category = nonEmptyString(coalesce(detail.category, list.category));
  const iconUrl = nonEmptyString(coalesce(detail.icon, list.icon));
  const twitterUrl = nonEmptyString(coalesce(detail.twitterUrl, list.twitterUrl));
  const createdAtRaw = nonEmptyString(detail.createdAt);

  const missing = [];
  if (!uuid) missing.push('uuid');
  if (!name) missing.push('name');
  if (!description) missing.push('description');
  if (!category) missing.push('category');
  if (!iconUrl) missing.push('icon');
  if (!twitterUrl) missing.push('twitterUrl');

  let createdAtFromSource = null;
  if (createdAtRaw) {
    const date = new Date(createdAtRaw);
    if (!Number.isNaN(date.getTime())) {
      createdAtFromSource = date;
    }
  }

  if (missing.length > 0) {
    return {
      ok: false,
      reason: `Missing/invalid required fields: ${missing.join(', ')}`,
      index,
      uuid: uuid ?? null,
    };
  }

  const sourceStatus = nonEmptyString(coalesce(detail.status, list.status));
  const tokenAddress = nonEmptyString(coalesce(detail.tokenAddress, list.tokenAddress));
  const sourceUserId = nonEmptyString(detail.userId);
  const twitterUser =
    detail.twitterUser && typeof detail.twitterUser === 'object' ? detail.twitterUser : null;
  const twitterUserId = nonEmptyString(twitterUser?.id);
  const twitterUsername = nonEmptyString(twitterUser?.username);
  const twitterName = nonEmptyString(twitterUser?.name);
  const twitterProfileImage = nonEmptyString(twitterUser?.profile_image_url);
  const twitterVerified = typeof twitterUser?.verified === 'boolean' ? twitterUser.verified : null;
  const upvotes = Number.isFinite(coalesce(detail.upvotes, list.upvotes))
    ? Number(coalesce(detail.upvotes, list.upvotes))
    : null;
  const downvotes = Number.isFinite(coalesce(detail.downvotes, list.downvotes))
    ? Number(coalesce(detail.downvotes, list.downvotes))
    : null;

  return {
    ok: true,
    data: {
      source: SOURCE,
      sourceProjectId: uuid,
      sourceUrl: `https://bags.fm/apps/${uuid}`,
      name,
      description,
      category,
      iconUrl,
      twitterUrl,
      createdAtFromSource,
      sourceUserId,
      sourceStatus,
      tokenAddress,
      upvotes,
      downvotes,
      twitterUserId,
      twitterUsername,
      twitterName,
      twitterProfileImage,
      twitterVerified,
      rawPayload: project,
      rawListPayload: list,
      rawDetailPayload: detail,
    },
  };
}

export async function readProjectsFromFile(inputFile) {
  const raw = await readFile(inputFile, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed?.projects) ? parsed.projects : [];
}

export async function importBagsProjects({ prisma, projects }) {
  const normalized = projects.map((project, index) => normalizeProject(project, index));
  const validRows = normalized.filter((entry) => entry.ok).map((entry) => entry.data);
  const rejectedRows = normalized.filter((entry) => !entry.ok);

  let imported = 0;
  let updated = 0;
  const rowErrors = [];

  for (const row of validRows) {
    let failingStep = 'findUnique';
    try {
      const existing = await prisma.importedProject.findUnique({
        where: {
          source_sourceProjectId: {
            source: row.source,
            sourceProjectId: row.sourceProjectId,
          },
        },
        select: { id: true },
      });

      if (existing) {
        failingStep = 'update';
        await prisma.importedProject.update({
          where: {
            source_sourceProjectId: {
              source: row.source,
              sourceProjectId: row.sourceProjectId,
            },
          },
          data: {
            sourceUrl: row.sourceUrl,
            name: row.name,
            description: row.description,
            category: row.category,
            iconUrl: row.iconUrl,
            twitterUrl: row.twitterUrl,
            createdAtFromSource: row.createdAtFromSource,
            sourceUserId: row.sourceUserId,
            sourceStatus: row.sourceStatus,
            tokenAddress: row.tokenAddress,
            upvotes: row.upvotes,
            downvotes: row.downvotes,
            twitterUserId: row.twitterUserId,
            twitterUsername: row.twitterUsername,
            twitterName: row.twitterName,
            twitterProfileImage: row.twitterProfileImage,
            twitterVerified: row.twitterVerified,
            rawPayload: row.rawPayload,
            rawListPayload: row.rawListPayload,
            rawDetailPayload: row.rawDetailPayload,
          },
        });
        updated += 1;
      } else {
        failingStep = 'create';
        await prisma.importedProject.create({
          data: row,
        });
        imported += 1;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const failureDetails = extractPrismaFailureDetails(errorMessage);
      rowErrors.push({
        uuid: row.sourceProjectId,
        reason: errorMessage,
        failingField: failureDetails.failingField,
        failingStep,
        reasonType: failureDetails.reasonType,
      });
    }
  }

  return {
    total: validRows.length,
    imported,
    updated,
    rejected: rowErrors.length,
    rejectedRows,
    rowErrors,
  };
}

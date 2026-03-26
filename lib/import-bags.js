import { readFile } from 'node:fs/promises';

const SOURCE = 'bags';

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
  if (!createdAtRaw) missing.push('createdAt');

  let createdAtFromSource = null;
  if (createdAtRaw) {
    const date = new Date(createdAtRaw);
    if (Number.isNaN(date.getTime())) {
      missing.push('createdAt(invalid)');
    } else {
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
      sourceStatus,
      tokenAddress,
      rawPayload: project,
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
            sourceStatus: row.sourceStatus,
            tokenAddress: row.tokenAddress,
            rawPayload: row.rawPayload,
          },
        });
        updated += 1;
      } else {
        await prisma.importedProject.create({ data: row });
        imported += 1;
      }
    } catch (error) {
      rowErrors.push({
        uuid: row.sourceProjectId,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    total: projects.length,
    imported,
    updated,
    rejected: rejectedRows.length + rowErrors.length,
    rejectedRows,
    rowErrors,
  };
}

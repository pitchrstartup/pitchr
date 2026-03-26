import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const SOURCE = 'bags';
const BASE_URL = 'https://api2.bags.fm/api/v1';
const PAGE_LIMIT = 50;
const REQUEST_RETRIES = 3;
const REQUEST_DELAY_MS = 200;

function nonEmptyString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toDate(value) {
  const normalized = nonEmptyString(value);
  if (!normalized) return null;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function fetchUpdatesPage({ sourceProjectUuid, offset }) {
  const url = `${BASE_URL}/hackathon/${sourceProjectUuid}/updates?limit=${PAGE_LIMIT}&offset=${offset}`;
  let lastError = null;

  for (let attempt = 1; attempt <= REQUEST_RETRIES; attempt += 1) {
    try {
      const { stdout } = await execFileAsync('curl', ['-4', '-sS', '-m', '30', url], {
        maxBuffer: 1024 * 1024 * 8,
      });
      const payload = JSON.parse(stdout);
      return {
        updates: Array.isArray(payload?.response?.updates) ? payload.response.updates : [],
        totalItems: Number(payload?.response?.totalItems ?? 0),
      };
    } catch (error) {
      lastError = error;
      if (attempt < REQUEST_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS * attempt));
      }
    }
  }

  throw lastError ?? new Error('Unknown fetch error');
}

export function normalizeBagsUpdate({ project, update }) {
  const sourceUpdateId = nonEmptyString(update?._id);
  const sourceProjectUuid = nonEmptyString(update?.hackathonUuid ?? project?.sourceProjectId);
  const createdAtFromSource = toDate(update?.createdAt);
  const updatedAtFromSource = toDate(update?.updatedAt);
  const contentText = nonEmptyString(update?.text);
  const sourceUserId = nonEmptyString(update?.userId);

  const missing = [];
  if (!sourceUpdateId) missing.push('_id');
  if (!sourceProjectUuid) missing.push('hackathonUuid');
  if (!createdAtFromSource) missing.push('createdAt');

  if (missing.length > 0) {
    return {
      ok: false,
      reason: `Missing/invalid required fields: ${missing.join(', ')}`,
      sourceUpdateId: sourceUpdateId ?? null,
      sourceProjectUuid: sourceProjectUuid ?? null,
    };
  }

  return {
    ok: true,
    data: {
      source: SOURCE,
      sourceUpdateId,
      sourceProjectId: sourceProjectUuid,
      sourceProjectUuid,
      projectId: project.id,
      sourceUserId,
      contentText,
      createdAtFromSource,
      updatedAtFromSource,
      rawPayload: update,
    },
  };
}

export async function importBagsProjectUpdates({ prisma }) {
  const projects = await prisma.importedProject.findMany({
    where: { source: SOURCE },
    select: { id: true, sourceProjectId: true },
    orderBy: { importedAt: 'asc' },
  });

  let totalUpdatesFetched = 0;
  let imported = 0;
  let updated = 0;
  const rejectedRows = [];
  const rowErrors = [];

  for (const project of projects) {
    console.log(`[import-updates] project ${project.sourceProjectId}`);

    let offset = 0;
    let totalItems = null;
    let projectFetched = 0;
    let projectImported = 0;
    let projectUpdated = 0;
    let projectFailed = 0;

    try {
      while (totalItems === null || offset < totalItems) {
        const page = await fetchUpdatesPage({
          sourceProjectUuid: project.sourceProjectId,
          offset,
        });
        totalItems = page.totalItems;
        totalUpdatesFetched += page.updates.length;
        projectFetched += page.updates.length;

        for (const update of page.updates) {
          const normalized = normalizeBagsUpdate({ project, update });
          if (!normalized.ok) {
            rejectedRows.push({
              sourceProjectUuid: project.sourceProjectId,
              sourceUpdateId: normalized.sourceUpdateId,
              reason: normalized.reason,
            });
            projectFailed += 1;
            continue;
          }

          const row = normalized.data;
          try {
            const existing = await prisma.importedProjectUpdate.findUnique({
              where: {
                source_sourceUpdateId: {
                  source: row.source,
                  sourceUpdateId: row.sourceUpdateId,
                },
              },
              select: { id: true },
            });

            if (existing) {
              await prisma.importedProjectUpdate.update({
                where: {
                  source_sourceUpdateId: {
                    source: row.source,
                    sourceUpdateId: row.sourceUpdateId,
                  },
                },
                data: {
                  sourceProjectId: row.sourceProjectId,
                  sourceProjectUuid: row.sourceProjectUuid,
                  projectId: row.projectId,
                  sourceUserId: row.sourceUserId,
                  contentText: row.contentText,
                  createdAtFromSource: row.createdAtFromSource,
                  updatedAtFromSource: row.updatedAtFromSource,
                  rawPayload: row.rawPayload,
                },
              });
              updated += 1;
              projectUpdated += 1;
            } else {
              await prisma.importedProjectUpdate.create({ data: row });
              imported += 1;
              projectImported += 1;
            }
          } catch (error) {
            rowErrors.push({
              sourceProjectUuid: project.sourceProjectId,
              sourceUpdateId: row.sourceUpdateId,
              reason: error instanceof Error ? error.message : 'Unknown error',
            });
            projectFailed += 1;
          }
        }

        if (page.updates.length < PAGE_LIMIT) break;
        offset += PAGE_LIMIT;

        await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
      }
    } catch (error) {
      rowErrors.push({
        sourceProjectUuid: project.sourceProjectId,
        sourceUpdateId: null,
        reason: `Failed to fetch updates page: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      projectFailed += 1;
    }

    console.log(`[import-updates] fetched ${projectFetched} updates`);
    console.log(
      `[import-updates] inserted ${projectImported} / updated ${projectUpdated} / failed ${projectFailed}`,
    );
  }

  const sample = await prisma.importedProjectUpdate.findMany({
    where: { source: SOURCE },
    orderBy: { createdAtFromSource: 'desc' },
    take: 5,
    select: {
      sourceUpdateId: true,
      sourceProjectUuid: true,
      sourceUserId: true,
      createdAtFromSource: true,
      contentText: true,
    },
  });

  return {
    projectsProcessed: projects.length,
    totalUpdatesFetched,
    imported,
    updated,
    rejected: rejectedRows.length + rowErrors.length,
    rejectedRows,
    rowErrors,
    sample,
  };
}

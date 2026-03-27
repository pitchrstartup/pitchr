import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Prisma } from '@prisma/client';

const execFileAsync = promisify(execFile);

const SOURCE = 'bags_hackathon';
const BASE_URL = 'https://api2.bags.fm/api/v1';
const PAGE_LIMIT = 50;
const DEFAULT_PROJECT_BATCH_SIZE = 50;
const MAX_PROJECT_BATCH_SIZE = 200;
const REQUEST_RETRIES = 3;
const REQUEST_DELAY_MS = 200;
const IMPORT_CURSOR_KEY = 'bags:project-updates:cursor:v1';

const REQUIRED_PROJECT_FIELDS = ['id', 'source', 'sourceProjectId'];
const REQUIRED_UPDATE_FIELDS = [
  'id',
  'source',
  'sourceUpdateId',
  'sourceProjectId',
  'projectId',
  'rawPayload',
];

function assertUpdatesImportCompatibility({ prisma }) {
  if (!prisma || typeof prisma !== 'object') {
    throw new Error('Prisma client is undefined for updates import');
  }

  const projectDelegate = prisma.importedProject;
  const updateDelegate = prisma.importedProjectUpdate;
  const cursorDelegate = prisma.importCursor;

  if (!projectDelegate) {
    throw new Error(
      'Prisma client is missing importedProject delegate. Run "prisma generate" with the current schema before deploy.',
    );
  }

  if (!updateDelegate) {
    throw new Error(
      'Prisma client is missing importedProjectUpdate delegate. Run "prisma generate" with the current schema before deploy.',
    );
  }

  if (!cursorDelegate) {
    throw new Error(
      'Prisma client is missing importCursor delegate. Run "prisma generate" with the current schema before deploy.',
    );
  }

  const models = Prisma.dmmf.datamodel.models;
  const importedProjectModel = models.find((entry) => entry.name === 'ImportedProject');
  const importedProjectUpdateModel = models.find((entry) => entry.name === 'ImportedProjectUpdate');

  if (!importedProjectModel) {
    throw new Error('ImportedProject model not found in generated Prisma client DMMF');
  }

  if (!importedProjectUpdateModel) {
    throw new Error('ImportedProjectUpdate model not found in generated Prisma client DMMF');
  }

  const projectFields = new Set(importedProjectModel.fields.map((field) => field.name));
  const updateFields = new Set(importedProjectUpdateModel.fields.map((field) => field.name));

  const missingProjectFields = REQUIRED_PROJECT_FIELDS.filter((field) => !projectFields.has(field));
  const missingUpdateFields = REQUIRED_UPDATE_FIELDS.filter((field) => !updateFields.has(field));

  if (missingProjectFields.length > 0) {
    throw new Error(
      `ImportedProject schema/client mismatch. Missing fields: ${missingProjectFields.join(', ')}`,
    );
  }

  if (missingUpdateFields.length > 0) {
    throw new Error(
      `ImportedProjectUpdate schema/client mismatch. Missing fields: ${missingUpdateFields.join(', ')}`,
    );
  }
}

function resolveBatchSize(rawValue) {
  const asNumber = Number(rawValue);

  if (!Number.isFinite(asNumber) || asNumber <= 0) {
    return DEFAULT_PROJECT_BATCH_SIZE;
  }

  return Math.min(Math.floor(asNumber), MAX_PROJECT_BATCH_SIZE);
}

async function getProjectsBatch({ prisma, batchSize }) {
  const totalProjects = await prisma.importedProject.count({
    where: { source: SOURCE },
  });

  if (totalProjects === 0) {
    const persisted = await prisma.importCursor.upsert({
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
      select: { cursor: true },
    });

    return {
      projects: [],
      totalProjects,
      startCursor: persisted.cursor,
      nextCursor: 0,
    };
  }

  const persisted = await prisma.importCursor.upsert({
    where: { key: IMPORT_CURSOR_KEY },
    create: {
      key: IMPORT_CURSOR_KEY,
      cursor: 0,
      batchSize,
      metadata: { source: SOURCE },
    },
    update: { batchSize },
    select: { cursor: true },
  });

  const startCursor = ((persisted.cursor % totalProjects) + totalProjects) % totalProjects;

  const firstSlice = await prisma.importedProject.findMany({
    where: { source: SOURCE },
    select: { id: true, sourceProjectId: true },
    orderBy: { sourceProjectId: 'asc' },
    skip: startCursor,
    take: batchSize,
  });

  let projects = firstSlice;
  if (firstSlice.length < batchSize && totalProjects > firstSlice.length) {
    const remaining = batchSize - firstSlice.length;
    const wrappedSlice = await prisma.importedProject.findMany({
      where: { source: SOURCE },
      select: { id: true, sourceProjectId: true },
      orderBy: { sourceProjectId: 'asc' },
      take: remaining,
    });

    projects = firstSlice.concat(wrappedSlice);
  }

  const projectsProcessed = projects.length;
  const nextCursor = (startCursor + projectsProcessed) % totalProjects;

  await prisma.importCursor.update({
    where: { key: IMPORT_CURSOR_KEY },
    data: {
      cursor: nextCursor,
      batchSize,
      metadata: {
        source: SOURCE,
        totalProjects,
        projectsProcessed,
      },
    },
  });

  return {
    projects,
    totalProjects,
    startCursor,
    nextCursor,
  };
}

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

export async function importBagsProjectUpdates({ prisma, batchSize = process.env.BAGS_UPDATES_BATCH_SIZE }) {
  assertUpdatesImportCompatibility({ prisma });

  const resolvedBatchSize = resolveBatchSize(batchSize);
  const { projects, totalProjects, startCursor, nextCursor } = await getProjectsBatch({
    prisma,
    batchSize: resolvedBatchSize,
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

            await prisma.importedProjectUpdate.upsert({
              where: {
                source_sourceUpdateId: {
                  source: row.source,
                  sourceUpdateId: row.sourceUpdateId,
                },
              },
              create: row,
              update: {
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

            if (existing) {
              updated += 1;
              projectUpdated += 1;
            } else {
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

  return {
    batchSize: resolvedBatchSize,
    totalProjects,
    cursor: startCursor,
    nextCursor,
    projectsProcessed: projects.length,
    totalUpdatesFetched,
    imported,
    updated,
    failed: rejectedRows.length + rowErrors.length,
    rejected: rejectedRows.length + rowErrors.length,
    rejectedRows,
    rowErrors,
  };
}

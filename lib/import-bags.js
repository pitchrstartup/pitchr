import { readFile } from 'node:fs/promises';

const SOURCE = 'bags_hackathon';
const BAGS_LIST_BASE_URL = 'https://api2.bags.fm/api/v1/hackathon/list';
const BAGS_DETAIL_BASE_URL = 'https://api2.bags.fm/api/v1/hackathon';
const REQUEST_TIMEOUT_MS = 25000;
const REQUEST_RETRIES = 3;
const REQUEST_DELAY_MS = 250;

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function fetchJsonWithRetry(url) {
  let lastError = null;

  for (let attempt = 1; attempt <= REQUEST_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      return await response.json();
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

export async function fetchProjectsFromBagsApi() {
  const firstPage = await fetchJsonWithRetry(`${BAGS_LIST_BASE_URL}?page=1`);

  const totalPages = Math.max(1, Number(firstPage?.data?.totalPages ?? 1));
  const firstApplications = Array.isArray(firstPage?.data?.applications)
    ? firstPage.data.applications
    : [];

  const applications = [...firstApplications];
  const listPageErrors = [];

  for (let page = 2; page <= totalPages; page += 1) {
    try {
      const payload = await fetchJsonWithRetry(`${BAGS_LIST_BASE_URL}?page=${page}`);
      const pageApplications = Array.isArray(payload?.data?.applications) ? payload.data.applications : [];
      applications.push(...pageApplications);
    } catch (error) {
      listPageErrors.push({
        page,
        reason: error instanceof Error ? error.message : 'Unknown list page fetch error',
      });
    }
  }

  const projects = [];
  const detailErrors = [];

  for (let index = 0; index < applications.length; index += 1) {
    const listItem = applications[index];
    const uuid = nonEmptyString(listItem?.uuid);

    if (!uuid) {
      detailErrors.push({ index, uuid: null, reason: 'Missing uuid in list payload' });
      continue;
    }

    try {
      const detail = await fetchJsonWithRetry(`${BAGS_DETAIL_BASE_URL}/${uuid}`);
      projects.push({ uuid, list: listItem, detail });
    } catch (error) {
      detailErrors.push({
        index,
        uuid,
        reason: error instanceof Error ? error.message : 'Unknown detail fetch error',
      });
      projects.push({ uuid, list: listItem, detail: null });
    }
  }

  return {
    projects,
    meta: {
      fetchedAt: new Date().toISOString(),
      totalPages,
      applicationsCount: applications.length,
      listPageErrors,
      detailErrors,
    },
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
  if (!category) missing.push('category');
  if (!iconUrl) missing.push('icon');

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

export async function loadBagsProjects({ inputFile, inputMode = 'auto' }) {
  const resolvedMode = nonEmptyString(inputMode) ?? 'auto';

  if (resolvedMode === 'live') {
    const live = await fetchProjectsFromBagsApi();
    return {
      source: 'live',
      projects: live.projects,
      meta: live.meta,
    };
  }

  if (resolvedMode === 'file') {
    const projects = await readProjectsFromFile(inputFile);
    return {
      source: 'file',
      projects,
      meta: {
        fetchedAt: null,
        totalPages: null,
        applicationsCount: projects.length,
        listPageErrors: [],
        detailErrors: [],
      },
    };
  }

  try {
    const live = await fetchProjectsFromBagsApi();
    return {
      source: 'live',
      projects: live.projects,
      meta: live.meta,
    };
  } catch (liveError) {
    try {
      const projects = await readProjectsFromFile(inputFile);
      return {
        source: 'file-fallback',
        projects,
        meta: {
          fetchedAt: null,
          totalPages: null,
          applicationsCount: projects.length,
          listPageErrors: [],
          detailErrors: [],
          liveFetchError: liveError instanceof Error ? liveError.message : 'Unknown live fetch error',
        },
      };
    } catch (fileError) {
      const liveMessage = liveError instanceof Error ? liveError.message : 'Unknown live fetch error';
      const fileMessage = fileError instanceof Error ? fileError.message : 'Unknown file read error';
      throw new Error(
        `Failed to load Bags projects from live API and local fallback file. live=${liveMessage}; file=${fileMessage}`,
      );
    }
  }
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
    total: projects.length,
    valid: validRows.length,
    imported,
    updated,
    rejected: rejectedRows.length + rowErrors.length,
    rejectedRows,
    rowErrors,
  };
}

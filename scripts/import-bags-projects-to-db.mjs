import { readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';

const INPUT_FILE = 'data/bags-projects.raw.json';
const SOURCE = 'bags';
const DRY_RUN = process.argv.includes('--dry-run');

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

function normalizeProject(project, index) {
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

async function main() {
  const raw = await readFile(INPUT_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  const projects = Array.isArray(parsed?.projects) ? parsed.projects : [];

  const normalized = projects.map((project, index) => normalizeProject(project, index));
  const validRows = normalized.filter((entry) => entry.ok).map((entry) => entry.data);
  const rejectedRows = normalized.filter((entry) => !entry.ok);

  console.log(`[import:bags] total projects in file: ${projects.length}`);
  console.log(`[import:bags] valid rows: ${validRows.length}`);
  console.log(`[import:bags] rejected rows: ${rejectedRows.length}`);

  if (rejectedRows.length > 0) {
    for (const row of rejectedRows.slice(0, 20)) {
      console.log(`  - index=${row.index} uuid=${row.uuid ?? 'n/a'} reason=${row.reason}`);
    }
    if (rejectedRows.length > 20) {
      console.log(`  ... and ${rejectedRows.length - 20} more rejected rows`);
    }
  }

  if (DRY_RUN) {
    console.log('[import:bags] dry run enabled; database write skipped');
    return;
  }

  const prisma = new PrismaClient();
  try {
    let importedCount = 0;
    for (const row of validRows) {
      await prisma.importedProject.upsert({
        where: {
          source_sourceProjectId: {
            source: row.source,
            sourceProjectId: row.sourceProjectId,
          },
        },
        update: {
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
        create: row,
      });
      importedCount += 1;
    }
    console.log(`[import:bags] imported rows (upserted): ${importedCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[import:bags] failed', error);
  process.exitCode = 1;
});

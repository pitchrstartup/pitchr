import { readFile } from 'node:fs/promises';

const INPUT_FILE = 'data/bags-projects.raw.json';

const COLUMN_MAPPINGS = new Map([
  ['list.uuid', 'sourceProjectId'],
  ['detail.response.uuid', 'sourceProjectId'],
  ['list.name', 'name'],
  ['detail.response.name', 'name'],
  ['list.description', 'description'],
  ['detail.response.description', 'description'],
  ['list.category', 'category'],
  ['detail.response.category', 'category'],
  ['list.icon', 'iconUrl'],
  ['detail.response.icon', 'iconUrl'],
  ['list.twitterUrl', 'twitterUrl'],
  ['detail.response.twitterUrl', 'twitterUrl'],
  ['detail.response.createdAt', 'createdAtFromSource'],
  ['detail.response.status', 'sourceStatus'],
  ['list.status', 'sourceStatus'],
  ['detail.response.tokenAddress', 'tokenAddress'],
  ['list.tokenAddress', 'tokenAddress'],
  ['detail.response.userId', 'sourceUserId'],
  ['detail.response.upvotes', 'upvotes'],
  ['list.upvotes', 'upvotes'],
  ['detail.response.downvotes', 'downvotes'],
  ['list.downvotes', 'downvotes'],
]);

function collectPaths(obj, prefix, bucket) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const next = `${prefix}.${key}`;
    bucket.add(next);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      collectPaths(value, next, bucket);
    }
  }
}

async function main() {
  const raw = await readFile(INPUT_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  const projects = Array.isArray(parsed?.projects) ? parsed.projects : [];

  const paths = new Set();
  for (const project of projects) {
    collectPaths(project?.list ?? {}, 'list', paths);
    collectPaths(project?.detail?.response ?? {}, 'detail.response', paths);
  }

  const matrix = [...paths]
    .filter(
      (path) =>
        path.startsWith('list.') ||
        path.startsWith('detail.response.') ||
        path.startsWith('detail.response.twitterUser.'),
    )
    .sort()
    .map((path) => {
      const column = COLUMN_MAPPINGS.get(path) ?? null;
      const preservedInRaw = true;
      const recommendation = column
        ? 'keep as column'
        : path.startsWith('detail.response.twitterUser.')
          ? 'raw-only is sufficient'
          : 'raw-only is sufficient';

      return {
        path,
        dedicatedColumn: column ?? 'no',
        preservedInRaw,
        recommendation,
      };
    });

  console.log(`[audit:bags-project] total rows scanned: ${projects.length}`);
  console.log(`[audit:bags-project] project-level field paths: ${matrix.length}`);
  console.log('raw field path | dedicated column | preserved in raw payload | recommendation');
  console.log('--- | --- | --- | ---');
  for (const row of matrix) {
    console.log(
      `${row.path} | ${row.dedicatedColumn} | ${row.preservedInRaw ? 'yes' : 'no'} | ${row.recommendation}`,
    );
  }
}

main().catch((error) => {
  console.error('[audit:bags-project] failed', error);
  process.exitCode = 1;
});

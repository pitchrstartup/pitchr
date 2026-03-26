import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const INPUT_FILE = 'data/bags-projects.raw.json';
const SAMPLE_PROJECTS = 120;
const LIMIT = 50;

async function fetchUpdates(uuid) {
  const url = `https://api2.bags.fm/api/v1/hackathon/${uuid}/updates?limit=${LIMIT}&offset=0`;
  const { stdout } = await execFileAsync('curl', ['-4', '-sS', '-m', '20', url], {
    maxBuffer: 1024 * 1024 * 8,
  });
  const parsed = JSON.parse(stdout);
  return Array.isArray(parsed?.response?.updates) ? parsed.response.updates : [];
}

async function main() {
  const raw = await readFile(INPUT_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  const projects = (parsed?.projects ?? []).slice(0, SAMPLE_PROJECTS);
  const keys = new Set();

  let totalFetched = 0;
  let projectsWithUpdates = 0;
  let requestErrors = 0;

  for (const project of projects) {
    if (!project?.uuid) continue;
    try {
      const updates = await fetchUpdates(project.uuid);
      totalFetched += updates.length;
      if (updates.length > 0) projectsWithUpdates += 1;
      for (const update of updates) {
        Object.keys(update ?? {}).forEach((key) => keys.add(key));
      }
    } catch (_error) {
      requestErrors += 1;
    }
  }

  console.log(`[audit:bags-updates] sampled projects: ${projects.length}`);
  console.log(`[audit:bags-updates] projects with updates: ${projectsWithUpdates}`);
  console.log(`[audit:bags-updates] total updates fetched: ${totalFetched}`);
  console.log(`[audit:bags-updates] request errors: ${requestErrors}`);
  console.log(`[audit:bags-updates] update keys: ${JSON.stringify([...keys].sort())}`);
}

main().catch((error) => {
  console.error('[audit:bags-updates] failed', error);
  process.exitCode = 1;
});

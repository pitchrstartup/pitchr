import { PrismaClient } from '@prisma/client';
import { importBagsProjects, readProjectsFromFile } from '../lib/import-bags.js';

const INPUT_FILE = 'data/bags-projects.raw.json';
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  const projects = await readProjectsFromFile(INPUT_FILE);

  if (DRY_RUN) {
    const normalizedOnly = await importBagsProjects({
      prisma: {
        importedProject: {
          findUnique: async () => null,
          update: async () => null,
          create: async () => null,
        },
      },
      projects,
    });

    console.log(`[import:bags] total projects in file: ${normalizedOnly.total}`);
    console.log(`[import:bags] imported rows: ${normalizedOnly.imported}`);
    console.log(`[import:bags] updated rows: ${normalizedOnly.updated}`);
    console.log(`[import:bags] rejected rows: ${normalizedOnly.rejected}`);
    console.log('[import:bags] dry run enabled; database write skipped');
    return;
  }

  const prisma = new PrismaClient();
  try {
    const result = await importBagsProjects({ prisma, projects });

    console.log(`[import:bags] total projects in file: ${result.total}`);
    console.log(`[import:bags] imported rows: ${result.imported}`);
    console.log(`[import:bags] updated rows: ${result.updated}`);
    console.log(`[import:bags] rejected rows: ${result.rejected}`);

    if (result.rejectedRows.length > 0) {
      for (const row of result.rejectedRows.slice(0, 20)) {
        console.log(`  - index=${row.index} uuid=${row.uuid ?? 'n/a'} reason=${row.reason}`);
      }
    }

    if (result.rowErrors.length > 0) {
      for (const row of result.rowErrors.slice(0, 20)) {
        console.log(`  - uuid=${row.uuid} reason=${row.reason}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[import:bags] failed', error);
  process.exitCode = 1;
});

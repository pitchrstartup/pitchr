import { PrismaClient } from '@prisma/client';
import { importBagsProjectUpdates } from '../lib/import-bags-updates.js';

async function main() {
  const prisma = new PrismaClient();

  try {
    const result = await importBagsProjectUpdates({ prisma });

    console.log(`[import:bags-updates] batch size: ${result.batchSize}`);
    console.log(`[import:bags-updates] projects processed: ${result.projectsProcessed}`);
    console.log(`[import:bags-updates] next cursor: ${result.nextCursor}`);
    console.log(`[import:bags-updates] total updates fetched: ${result.totalUpdatesFetched}`);
    console.log(`[import:bags-updates] imported rows: ${result.imported}`);
    console.log(`[import:bags-updates] updated rows: ${result.updated}`);
    console.log(`[import:bags-updates] failed rows: ${result.failed}`);

    if (result.rejectedRows.length > 0) {
      for (const row of result.rejectedRows.slice(0, 20)) {
        console.log(
          `  - project=${row.sourceProjectUuid ?? 'n/a'} update=${row.sourceUpdateId ?? 'n/a'} reason=${row.reason}`,
        );
      }
    }

    if (result.rowErrors.length > 0) {
      for (const row of result.rowErrors.slice(0, 20)) {
        console.log(
          `  - project=${row.sourceProjectUuid ?? 'n/a'} update=${row.sourceUpdateId ?? 'n/a'} reason=${row.reason}`,
        );
      }
    }

  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[import:bags-updates] failed', error);
  process.exitCode = 1;
});

import { PrismaClient } from '@prisma/client';
import { importBagsProjectUpdates } from '../lib/import-bags-updates.js';

async function main() {
  const prisma = new PrismaClient();

  try {
    const result = await importBagsProjectUpdates({ prisma });

    console.log(`[import:bags-updates] projects processed: ${result.projectsProcessed}`);
    console.log(`[import:bags-updates] total updates fetched: ${result.totalUpdatesFetched}`);
    console.log(`[import:bags-updates] imported rows: ${result.imported}`);
    console.log(`[import:bags-updates] updated rows: ${result.updated}`);
    console.log(`[import:bags-updates] rejected rows: ${result.rejected}`);

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

    if (result.sample.length > 0) {
      console.log('[import:bags-updates] sample rows:');
      for (const row of result.sample) {
        console.log(
          `  - update=${row.sourceUpdateId} project=${row.sourceProjectUuid} user=${row.sourceUserId ?? 'null'} createdAt=${row.createdAtFromSource.toISOString()} text=${(row.contentText ?? '').slice(0, 120)}`,
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

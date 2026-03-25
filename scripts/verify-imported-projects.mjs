import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const total = await prisma.importedProject.count({ where: { source: 'bags' } });
    const sample = await prisma.importedProject.findMany({
      where: { source: 'bags' },
      orderBy: { importedAt: 'desc' },
      take: 10,
      select: {
        sourceProjectId: true,
        name: true,
        category: true,
        sourceStatus: true,
        tokenAddress: true,
        importedAt: true,
      },
    });

    console.log(`[verify:bags] total imported rows for source=bags: ${total}`);
    for (const row of sample) {
      console.log(
        `- ${row.sourceProjectId} | ${row.name} | ${row.category} | status=${row.sourceStatus ?? 'null'} | token=${row.tokenAddress ?? 'null'}`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[verify:bags] failed', error);
  process.exitCode = 1;
});

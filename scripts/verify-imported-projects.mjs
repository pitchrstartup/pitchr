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
        sourceUserId: true,
        sourceStatus: true,
        tokenAddress: true,
        upvotes: true,
        downvotes: true,
        importedAt: true,
      },
    });

    console.log(`[verify:bags] total imported rows for source=bags: ${total}`);
    for (const row of sample) {
      console.log(
        `- ${row.sourceProjectId} | ${row.name} | ${row.category} | user=${row.sourceUserId ?? 'null'} | status=${row.sourceStatus ?? 'null'} | token=${row.tokenAddress ?? 'null'} | votes=${row.upvotes ?? 'null'}/${row.downvotes ?? 'null'}`,
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

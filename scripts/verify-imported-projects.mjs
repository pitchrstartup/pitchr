import { PrismaClient } from '@prisma/client';

const SOURCE = 'bags_hackathon';

async function main() {
  const prisma = new PrismaClient();
  try {
    const total = await prisma.importedProject.count({ where: { source: SOURCE } });
    const sample = await prisma.importedProject.findMany({
      where: { source: SOURCE },
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

    console.log(`[verify:bags] total imported rows for source=${SOURCE}: ${total}`);
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

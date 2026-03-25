"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function getDiscoverFeed() {
  const user = await requireSession();

  return prisma.project.findMany({
    where: {
      swipes: {
        none: {
          userId: user.id,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getLeaderboard() {
  return prisma.project.findMany({
    include: {
      _count: {
        select: {
          swipes: true,
        },
      },
      swipes: {
        select: {
          direction: true,
        },
      },
    },
    orderBy: {
      swipes: {
        _count: "desc",
      },
    },
  });
}

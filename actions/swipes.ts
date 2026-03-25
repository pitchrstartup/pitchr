"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitSwipe(projectId: string, direction: "RIGHT" | "LEFT") {
  const user = await requireSession();

  await prisma.swipe.upsert({
    where: {
      userId_projectId: {
        userId: user.id,
        projectId,
      },
    },
    create: {
      userId: user.id,
      projectId,
      direction,
    },
    update: {
      direction,
    },
  });

  revalidatePath("/discover");
  revalidatePath("/leaderboard");
  revalidatePath("/my-picks");
}

export async function getMyPicks() {
  const user = await requireSession();

  const swipes = await prisma.swipe.findMany({
    where: {
      userId: user.id,
      direction: "RIGHT",
    },
    include: {
      project: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return swipes.map((swipe) => swipe.project);
}

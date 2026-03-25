"use server";

import { prisma } from "@/lib/prisma";

export async function getProjects() {
  return prisma.project.findMany({ orderBy: { createdAt: "desc" } });
}

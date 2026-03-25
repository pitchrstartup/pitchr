import {
  BAGS_SOURCE,
  type BagsHackathonDetailProject,
  type BagsHackathonListProject,
  type ImportedProjectInput,
} from "@/lib/bags/types";

function nullIfBlank(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeUrl(url: string | undefined | null): string | null {
  const candidate = nullIfBlank(url);
  if (!candidate) return null;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  return null;
}

function toRecordOrNull(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function normalizeHackathonProject(params: {
  listProject: BagsHackathonListProject;
  detailProject: BagsHackathonDetailProject | null;
}): ImportedProjectInput {
  const { listProject, detailProject } = params;
  const project = detailProject ?? listProject;

  const sourceProjectId = nullIfBlank(project.uuid) ?? "";

  const sourceCreatedAt = detailProject?.createdAt ? new Date(detailProject.createdAt) : null;
  const validSourceCreatedAt = sourceCreatedAt && Number.isNaN(sourceCreatedAt.getTime()) ? null : sourceCreatedAt;

  return {
    source: BAGS_SOURCE,
    sourceProjectId,
    sourceUrl: `https://bags.fm/apps/${sourceProjectId}`,
    name: nullIfBlank(project.name),
    description: nullIfBlank(project.description),
    category: nullIfBlank(project.category),
    sourceStatus: nullIfBlank(project.status),
    iconUrl: sanitizeUrl(project.icon),
    twitterUrl: sanitizeUrl(project.twitterUrl),
    tokenAddress: nullIfBlank(project.tokenAddress),
    upvotes: normalizeInt(project.upvotes),
    downvotes: normalizeInt(project.downvotes),
    sourceCreatedAt: validSourceCreatedAt,
    twitterUserId: nullIfBlank(detailProject?.twitterUser?.id),
    twitterUsername: nullIfBlank(detailProject?.twitterUser?.username),
    twitterName: nullIfBlank(detailProject?.twitterUser?.name),
    twitterProfileImage: sanitizeUrl(detailProject?.twitterUser?.profile_image_url),
    twitterVerified: typeof detailProject?.twitterUser?.verified === "boolean" ? detailProject.twitterUser.verified : null,
    rawListPayload: toRecordOrNull(listProject),
    rawDetailPayload: toRecordOrNull(detailProject),
  };
}

import type { ImportedProjectInput } from "@/lib/bags/types";

export function validateImportedProject(project: ImportedProjectInput): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!project.sourceProjectId) {
    warnings.push("Missing sourceProjectId");
  }

  if (!project.sourceUrl) {
    warnings.push("Missing sourceUrl");
  }

  if (!project.name) {
    warnings.push("Missing name");
  }

  if (project.upvotes !== null && project.upvotes < 0) {
    warnings.push("Negative upvotes encountered; preserving raw value as-is is disabled");
  }

  if (project.downvotes !== null && project.downvotes < 0) {
    warnings.push("Negative downvotes encountered; preserving raw value as-is is disabled");
  }

  return {
    valid: !warnings.includes("Missing sourceProjectId") && !warnings.includes("Missing sourceUrl"),
    warnings,
  };
}

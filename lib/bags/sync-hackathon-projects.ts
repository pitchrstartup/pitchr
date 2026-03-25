import { fetchHackathonListPage } from "@/lib/bags/fetch-hackathon-list-page";
import { fetchHackathonProjectDetail } from "@/lib/bags/fetch-hackathon-project-detail";
import { normalizeHackathonProject } from "@/lib/bags/normalize-hackathon-project";
import { upsertImportedProject } from "@/lib/bags/upsert-imported-project";
import { validateImportedProject } from "@/lib/bags/validate-imported-project";
import type { BagsHackathonListProject } from "@/lib/bags/types";

export type SyncSummary = {
  pagesFetched: number;
  listItemsDiscovered: number;
  detailsFetched: number;
  imported: number;
  updated: number;
  failed: number;
  warnings: string[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function syncHackathonProjects(): Promise<SyncSummary> {
  const summary: SyncSummary = {
    pagesFetched: 0,
    listItemsDiscovered: 0,
    detailsFetched: 0,
    imported: 0,
    updated: 0,
    failed: 0,
    warnings: [],
  };

  const listProjects: BagsHackathonListProject[] = [];

  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const pageResult = await fetchHackathonListPage(page);
    const response = pageResult.response;

    summary.pagesFetched += 1;

    const pageProjects = response?.applications ?? [];
    listProjects.push(...pageProjects);

    totalPages = response?.totalPages ?? page;
    page += 1;

    await sleep(120);
  }

  summary.listItemsDiscovered = listProjects.length;

  for (const listProject of listProjects) {
    const uuid = listProject.uuid?.trim();

    if (!uuid) {
      summary.failed += 1;
      summary.warnings.push("Skipped list item without uuid");
      continue;
    }

    try {
      const detail = await fetchHackathonProjectDetail(uuid);
      summary.detailsFetched += 1;

      const normalized = normalizeHackathonProject({
        listProject,
        detailProject: detail,
      });

      const validation = validateImportedProject(normalized);
      summary.warnings.push(...validation.warnings.map((warning) => `${uuid}: ${warning}`));

      if (!validation.valid) {
        summary.failed += 1;
        continue;
      }

      const status = await upsertImportedProject(normalized);

      if (status === "created") {
        summary.imported += 1;
      } else {
        summary.updated += 1;
      }
    } catch (error) {
      summary.failed += 1;
      summary.warnings.push(`${uuid}: ${String(error)}`);
    }

    await sleep(100);
  }

  return summary;
}

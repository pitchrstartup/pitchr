import { syncHackathonProjects } from "@/lib/bags/sync-hackathon-projects";

async function main() {
  console.log("[bags-sync] Starting Bags hackathon project sync...");

  const summary = await syncHackathonProjects();

  console.table({
    pagesFetched: summary.pagesFetched,
    listItemsDiscovered: summary.listItemsDiscovered,
    detailsFetched: summary.detailsFetched,
    imported: summary.imported,
    updated: summary.updated,
    failed: summary.failed,
    warnings: summary.warnings.length,
  });

  if (summary.warnings.length > 0) {
    console.log("[bags-sync] warnings:");
    for (const warning of summary.warnings.slice(0, 50)) {
      console.log(` - ${warning}`);
    }
    if (summary.warnings.length > 50) {
      console.log(` - ...and ${summary.warnings.length - 50} more warnings`);
    }
  }

  if (summary.failed > 0 && summary.imported === 0 && summary.updated === 0) {
    console.error("[bags-sync] Catastrophic failure: no projects were imported or updated.");
    process.exit(1);
  }

  console.log("[bags-sync] Completed.");
}

main().catch((error) => {
  console.error("[bags-sync] Fatal error", error);
  process.exit(1);
});

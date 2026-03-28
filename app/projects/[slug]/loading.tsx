import { AppShell } from "@/components/AppShell";
import { ProjectListSkeleton } from "@/components/States";

export default function LoadingProjectPage() {
  return (
    <AppShell>
      <ProjectListSkeleton />
    </AppShell>
  );
}

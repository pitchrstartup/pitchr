"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProjectList } from "@/components/ProjectList";
import { EmptyState, ErrorState, ProjectListSkeleton } from "@/components/States";
import type { ProjectListItem } from "@/lib/project-dto";

type ProjectsResponse = {
  items: ProjectListItem[];
};

export default function DiscoverPage() {
  const [items, setItems] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        const response = await fetch("/api/projects", {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load projects (${response.status})`);
        }

        const payload = (await response.json()) as ProjectsResponse;
        setItems(Array.isArray(payload.items) ? payload.items : []);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Unexpected error";
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, []);

  return (
    <AppShell>
      <section className="mb-4">
        <h1 className="text-[28px] font-medium tracking-[-0.03em]">Discover</h1>
        <p className="mt-1 text-sm text-text-secondary">Find new projects and review real signals.</p>
      </section>

      {loading ? <ProjectListSkeleton /> : null}
      {!loading && error ? <ErrorState message={error} /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState /> : null}
      {!loading && !error && items.length > 0 ? <ProjectList items={items} /> : null}
    </AppShell>
  );
}

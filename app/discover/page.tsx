"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DiscoverDeck } from "@/components/DiscoverDeck";
import { EmptyState, ErrorState, ProjectListSkeleton } from "@/components/States";
import type { DiscoverFilters } from "@/components/DiscoverFiltersSheet";
import type { ProjectListItem } from "@/lib/project-dto";

type ProjectsResponse = {
  items: ProjectListItem[];
};

function toQuery(filters: DiscoverFilters): string {
  const params = new URLSearchParams();
  params.set("limit", "80");

  if (filters.category) params.set("category", filters.category);
  if (filters.twitterVerified) params.set("twitterVerified", "true");
  if (filters.hasCreator) params.set("hasCreator", "true");
  if (filters.recentOnly) params.set("recentOnly", "true");

  if (filters.token === "with") params.set("hasToken", "true");
  if (filters.token === "without") params.set("hasToken", "false");

  return params.toString();
}

export default function DiscoverPage() {
  const [items, setItems] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (filters?: DiscoverFilters) => {
    const query = filters ? toQuery(filters) : "limit=80";

    const response = await fetch(`/api/projects?${query}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to load projects (${response.status})`);
    }

    const payload = (await response.json()) as ProjectsResponse;
    return Array.isArray(payload.items) ? payload.items : [];
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function initialLoad() {
      try {
        setLoading(true);
        const response = await fetch("/api/projects?limit=80", {
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

    void initialLoad();

    return () => controller.abort();
  }, []);

  const applyFilters = async (filters: DiscoverFilters) => {
    try {
      setRefreshing(true);
      const nextItems = await load(filters);
      setItems(nextItems);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setRefreshing(false);
    }
  };

  const resetFilters = async () => {
    try {
      setRefreshing(true);
      const nextItems = await load();
      setItems(nextItems);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <AppShell>
      <section className="mb-4">
        <h1 className="text-[28px] font-medium tracking-[-0.03em]">Discover</h1>
        <p className="mt-1 text-sm text-text-secondary">Decision deck for projects. Review quickly with Back / Pass.</p>
      </section>

      {loading ? <ProjectListSkeleton /> : null}
      {!loading && error ? <ErrorState message={error} /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState /> : null}
      {!loading && !error && items.length > 0 ? (
        <DiscoverDeck items={items} onApplyFilters={applyFilters} onResetFilters={resetFilters} filtering={refreshing} />
      ) : null}
    </AppShell>
  );
}

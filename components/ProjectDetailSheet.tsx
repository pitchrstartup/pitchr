"use client";

import { useEffect, useState } from "react";
import type { ProjectDetail, ProjectListItem } from "@/lib/project-dto";

type ProjectDetailSheetProps = {
  project: ProjectListItem | null;
  open: boolean;
  onClose: () => void;
};

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}

export function ProjectDetailSheet({ project, open, onClose }: ProjectDetailSheetProps) {
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !project) return;

    const controller = new AbortController();
    const slug = project.slug;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/projects/${slug}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Unable to load project (${response.status})`);
        }

        const payload = (await response.json()) as ProjectDetail;
        setDetail(payload);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [open, project]);

  if (!open || !project) return null;

  const data = detail ?? {
    ...project,
    sourceUrl: null,
    twitterUrl: null,
    twitterFollowersCount: null,
    twitterFollowingCount: null,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close details" />

      <section className="relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-surface p-4 sm:w-[700px] sm:rounded-card sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-secondary">{data.category ?? "Uncategorized"}</p>
            <h3 className="text-2xl font-semibold tracking-[-0.03em]">{data.name}</h3>
            {data.twitterUsername ? <p className="text-sm text-text-secondary">@{data.twitterUsername}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-button border border-border px-3 py-1.5 text-sm">
            Close
          </button>
        </div>

        <p className="text-sm text-text-primary">{data.description ?? "No description provided yet."}</p>

        {loading ? <p className="mt-3 text-sm text-text-secondary">Loading details…</p> : null}
        {error ? <p className="mt-3 text-sm text-pass">{error}</p> : null}

        <div className="mt-4 rounded-card border border-border px-3">
          <StatRow label="Unique claim wallets" value={String(data.claimsUniqueWallets ?? "—")} />
          <StatRow label="Creator count" value={String(data.creatorCount ?? "—")} />
          <StatRow label="Twitter followers" value={String(data.twitterFollowersCount ?? "—")} />
          <StatRow label="Twitter following" value={String(data.twitterFollowingCount ?? "—")} />
          <StatRow label="Token" value={data.tokenAddress ? "Yes" : "No"} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {data.sourceUrl ? (
            <a href={data.sourceUrl} target="_blank" rel="noreferrer" className="rounded-button border border-border px-3 py-2">
              Source
            </a>
          ) : null}
          {data.twitterUrl ? (
            <a href={data.twitterUrl} target="_blank" rel="noreferrer" className="rounded-button border border-border px-3 py-2">
              Twitter
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}

"use client";

import type { CSSProperties } from "react";
import type { ProjectListItem } from "@/lib/project-dto";

type DiscoverCardProps = {
  project: ProjectListItem;
  style?: CSSProperties;
  stacked?: boolean;
  onOpenDetails?: () => void;
};

function formatNumber(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function isNewProject(createdAtFromSource: string | null): boolean {
  if (!createdAtFromSource) return false;
  const createdAt = new Date(createdAtFromSource).getTime();
  if (Number.isNaN(createdAt)) return false;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - createdAt <= sevenDays;
}

function badgeClassName(tone: "neutral" | "positive" | "attention") {
  if (tone === "positive") return "border-green-200 bg-green-50 text-green-700";
  if (tone === "attention") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-border bg-gray-50 text-text-secondary";
}

export function DiscoverCard({ project, style, stacked = false, onOpenDetails }: DiscoverCardProps) {
  const isNew = isNewProject(project.createdAtFromSource);

  return (
    <article
      style={style}
      className="relative w-full rounded-card border border-border bg-surface p-4 shadow-card sm:p-5"
      aria-label={project.name}
    >
      <button
        type="button"
        onClick={onOpenDetails}
        className="absolute inset-0 z-10 rounded-card"
        aria-label={`View details for ${project.name}`}
      />

      <div className="relative z-20">
        <div className="mb-4 flex items-start gap-3">
          {project.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.iconUrl} alt={`${project.name} logo`} className="h-14 w-14 rounded-logo border border-border bg-gray-50" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-logo border border-border bg-gray-50 text-base font-semibold">
              {project.name.slice(0, 1)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{project.category ?? "Uncategorized"}</p>
            <h2 className="truncate text-xl font-semibold tracking-[-0.03em]">{project.name}</h2>
            <p className="line-clamp-3 mt-1 text-sm text-text-secondary">{project.description ?? "No short description yet."}</p>
            {project.twitterUsername ? <p className="mt-1 text-xs text-text-secondary">@{project.twitterUsername}</p> : null}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 text-xs font-medium">
          {project.twitterVerified ? <span className={`rounded-full border px-2 py-1 ${badgeClassName("positive")}`}>Verified</span> : null}
          {isNew ? <span className={`rounded-full border px-2 py-1 ${badgeClassName("attention")}`}>New</span> : null}
          {project.hasLaunchCreator ? <span className={`rounded-full border px-2 py-1 ${badgeClassName("neutral")}`}>Creator</span> : null}
          {project.tokenAddress ? <span className={`rounded-full border px-2 py-1 ${badgeClassName("neutral")}`}>Token</span> : null}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
          <div className="rounded-xl border border-border bg-gray-50 p-2">
            <p className="text-text-secondary">Unique wallets</p>
            <p className="mt-1 font-semibold text-text-primary">{formatNumber(project.claimsUniqueWallets)}</p>
          </div>
          <div className="rounded-xl border border-border bg-gray-50 p-2">
            <p className="text-text-secondary">Creators</p>
            <p className="mt-1 font-semibold text-text-primary">{formatNumber(project.creatorCount)}</p>
          </div>
        </div>

        {stacked ? <div className="mt-4 h-1.5 w-full rounded-full bg-gray-100" /> : null}
      </div>
    </article>
  );
}

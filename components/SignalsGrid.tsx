import type { ProjectDetail } from "@/lib/project-dto";

function formatInt(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat("en-US").format(value);
}

export function SignalsGrid({ project }: { project: ProjectDetail }) {
  const signals = [
    { label: "Unique claim wallets", value: formatInt(project.claimsUniqueWallets) },
    { label: "Creators", value: formatInt(project.creatorCount) },
    { label: "X followers", value: formatInt(project.twitterFollowersCount) },
    { label: "X following", value: formatInt(project.twitterFollowingCount) },
  ].filter((entry) => entry.value !== null);

  if (signals.length === 0) return null;

  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <h2 className="text-lg font-medium tracking-[-0.02em]">Signals</h2>
      <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {signals.map((signal) => (
          <div key={signal.label} className="rounded-button border border-border bg-gray-50 p-3">
            <dt className="text-xs text-text-secondary">{signal.label}</dt>
            <dd className="mt-1 text-lg font-medium">{signal.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

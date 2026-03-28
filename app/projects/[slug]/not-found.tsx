import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function ProjectNotFoundPage() {
  return (
    <AppShell>
      <section className="rounded-card border border-border bg-surface p-8 text-center">
        <h1 className="text-xl font-medium tracking-[-0.03em]">Project not found</h1>
        <p className="mt-2 text-sm text-text-secondary">This project may not be available in the current read model.</p>
        <Link
          href="/discover"
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-button border border-border px-4 py-2 text-sm font-medium"
        >
          Back to discover
        </Link>
      </section>
    </AppShell>
  );
}

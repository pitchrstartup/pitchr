import { AppShell } from "@/components/AppShell";

export default function BackedPage() {
  return (
    <AppShell>
      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <h1 className="text-2xl font-medium tracking-[-0.03em]">Backed</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Public MVP: backing history arrives with user accounts in phase 2.
        </p>
      </section>
    </AppShell>
  );
}

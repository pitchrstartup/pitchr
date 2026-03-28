"use client";

import { AppShell } from "@/components/AppShell";
import { ErrorState } from "@/components/States";

export default function ProjectErrorPage() {
  return (
    <AppShell>
      <ErrorState message="Could not load this project." />
    </AppShell>
  );
}

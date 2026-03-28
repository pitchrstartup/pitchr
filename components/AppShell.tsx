import type { ReactNode } from "react";
import { Navigation } from "@/components/Navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-background text-text-primary">
      <Navigation />
      <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4 sm:px-6 lg:pb-8">{children}</div>
    </main>
  );
}

export function ProjectListSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl" aria-hidden>
      <div className="animate-pulse rounded-card border border-border bg-surface p-4 sm:p-5">
        <div className="mb-3 h-14 w-14 rounded-logo bg-gray-100" />
        <div className="h-5 w-2/3 rounded bg-gray-100" />
        <div className="mt-2 h-4 w-full rounded bg-gray-100" />
        <div className="mt-2 h-4 w-5/6 rounded bg-gray-100" />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="h-14 rounded-xl bg-gray-100" />
          <div className="h-14 rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="rounded-card border border-border bg-surface p-8 text-center">
      <p className="text-sm text-text-secondary">No projects available for this deck right now.</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-card border border-red-200 bg-red-50 p-8 text-center">
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

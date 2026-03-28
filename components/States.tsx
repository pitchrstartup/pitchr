export function ProjectListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-hidden>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-card border border-border bg-surface p-4">
          <div className="h-1 w-full rounded bg-gray-100" />
          <div className="mt-4 h-4 w-2/3 rounded bg-gray-100" />
          <div className="mt-2 h-3 w-full rounded bg-gray-100" />
          <div className="mt-2 h-3 w-4/5 rounded bg-gray-100" />
          <div className="mt-4 h-10 w-full rounded-button bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="rounded-card border border-border bg-surface p-8 text-center">
      <p className="text-sm text-text-secondary">No projects available right now.</p>
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

export function CtaArea() {
  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <h2 className="text-lg font-medium tracking-[-0.02em]">Actions</h2>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          className="min-h-12 rounded-button bg-back px-4 text-sm font-medium text-green-950 hover:bg-back-strong"
        >
          Back (coming soon)
        </button>
        <button
          type="button"
          className="min-h-12 rounded-button border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-800 hover:bg-red-100"
        >
          Pass (coming soon)
        </button>
      </div>
    </section>
  );
}

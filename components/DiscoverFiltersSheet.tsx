"use client";

type TokenFilter = "all" | "with" | "without";

export type DiscoverFilters = {
  category: string;
  token: TokenFilter;
  twitterVerified: boolean;
  hasCreator: boolean;
  recentOnly: boolean;
};

type DiscoverFiltersSheetProps = {
  open: boolean;
  categories: string[];
  draft: DiscoverFilters;
  onChange: (next: DiscoverFilters) => void;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
};

export function DiscoverFiltersSheet({
  open,
  categories,
  draft,
  onChange,
  onClose,
  onReset,
  onApply,
}: DiscoverFiltersSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40 sm:items-center sm:justify-center" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close filters" />
      <section className="relative z-10 w-full rounded-t-2xl border border-border bg-surface p-4 sm:w-[520px] sm:rounded-card">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Search options</h2>

        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Category</span>
            <select
              value={draft.category}
              onChange={(event) => onChange({ ...draft, category: event.target.value })}
              className="min-h-11 w-full rounded-button border border-border bg-surface px-3"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="mb-1 text-sm font-medium">Token</legend>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {[
                { value: "all", label: "All" },
                { value: "with", label: "With token" },
                { value: "without", label: "Without" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange({ ...draft, token: option.value as TokenFilter })}
                  className={`min-h-11 rounded-button border px-2 ${
                    draft.token === option.value ? "border-text-primary bg-gray-100" : "border-border bg-surface"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex items-center justify-between rounded-button border border-border p-3 text-sm">
            Twitter verified
            <input
              type="checkbox"
              checked={draft.twitterVerified}
              onChange={(event) => onChange({ ...draft, twitterVerified: event.target.checked })}
              className="h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between rounded-button border border-border p-3 text-sm">
            Has creator
            <input
              type="checkbox"
              checked={draft.hasCreator}
              onChange={(event) => onChange({ ...draft, hasCreator: event.target.checked })}
              className="h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between rounded-button border border-border p-3 text-sm">
            Recent / new only
            <input
              type="checkbox"
              checked={draft.recentOnly}
              onChange={(event) => onChange({ ...draft, recentOnly: event.target.checked })}
              className="h-4 w-4"
            />
          </label>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onReset} className="min-h-11 rounded-button border border-border bg-surface text-sm font-medium">
            Reset
          </button>
          <button type="button" onClick={onApply} className="min-h-11 rounded-button border border-text-primary bg-text-primary text-sm font-medium text-white">
            Apply
          </button>
        </div>
      </section>
    </div>
  );
}

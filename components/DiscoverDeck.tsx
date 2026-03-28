"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { DeckControls } from "@/components/DeckControls";
import { DiscoverCard } from "@/components/DiscoverCard";
import { DiscoverFiltersSheet, type DiscoverFilters } from "@/components/DiscoverFiltersSheet";
import { ProjectDetailSheet } from "@/components/ProjectDetailSheet";
import type { ProjectListItem } from "@/lib/project-dto";

const DEFAULT_FILTERS: DiscoverFilters = {
  category: "",
  token: "all",
  twitterVerified: false,
  hasCreator: false,
  recentOnly: false,
};

type DiscoverDeckProps = {
  items: ProjectListItem[];
  onApplyFilters: (filters: DiscoverFilters) => Promise<void>;
  onResetFilters: () => Promise<void>;
  filtering: boolean;
};

export function DiscoverDeck({ items, onApplyFilters, onResetFilters, filtering }: DiscoverDeckProps) {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [dragX, setDragX] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersDraft, setFiltersDraft] = useState<DiscoverFilters>(DEFAULT_FILTERS);
  const [detailOpen, setDetailOpen] = useState(false);
  const pointerStartX = useRef<number | null>(null);

  const current = items[index] ?? null;
  const next = items[index + 1] ?? null;
  const third = items[index + 2] ?? null;

  const categories = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.category).filter((value): value is string => Boolean(value)))).sort();
  }, [items]);

  const pass = useCallback(() => {
    if (!current) return;
    setHistory((prev) => [...prev, index]);
    setIndex((prev) => prev + 1);
    setDragX(0);
  }, [current, index]);

  const back = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const previousIndex = copy.pop();
      if (typeof previousIndex === "number") {
        setIndex(previousIndex);
      }
      return copy;
    });
    setDragX(0);
  }, []);

  const startDrag = (clientX: number) => {
    pointerStartX.current = clientX;
  };

  const updateDrag = (clientX: number) => {
    if (pointerStartX.current === null) return;
    setDragX(clientX - pointerStartX.current);
  };

  const endDrag = () => {
    const threshold = 90;
    if (Math.abs(dragX) >= threshold) {
      if (dragX < 0) {
        pass();
      } else {
        back();
      }
    }
    pointerStartX.current = null;
    setDragX(0);
  };

  if (!current) {
    return (
      <section className="rounded-card border border-border bg-surface p-8 text-center">
        <p className="text-sm text-text-secondary">No more projects in this deck.</p>
        <button
          type="button"
          onClick={() => {
            setIndex(0);
            setHistory([]);
          }}
          className="mt-4 min-h-11 rounded-button border border-border px-4 text-sm font-medium"
        >
          Restart deck
        </button>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-text-secondary">
          Project {Math.min(index + 1, items.length)} of {items.length}
        </p>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="min-h-10 rounded-button border border-border bg-surface px-3 text-sm font-medium"
        >
          Filters
        </button>
      </div>

      <div className="relative mx-auto w-full max-w-xl select-none pb-2">
        {third ? <div className="pointer-events-none absolute inset-x-4 top-4 z-0 scale-[0.94] opacity-40"><DiscoverCard project={third} stacked /></div> : null}
        {next ? <div className="pointer-events-none absolute inset-x-2 top-2 z-10 scale-[0.97] opacity-70"><DiscoverCard project={next} stacked /></div> : null}

        <div
          className="relative z-20 touch-pan-y"
          onPointerDown={(event) => startDrag(event.clientX)}
          onPointerMove={(event) => updateDrag(event.clientX)}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <DiscoverCard
            project={current}
            onOpenDetails={() => setDetailOpen(true)}
            style={{
              transform: `translateX(${dragX}px) rotate(${dragX * 0.03}deg)`,
              transition: pointerStartX.current === null ? "transform 160ms ease" : "none",
            }}
          />
        </div>
      </div>

      <DeckControls
        canGoBack={history.length > 0}
        canPass={Boolean(current)}
        onBack={back}
        onPass={pass}
        onViewDetails={() => setDetailOpen(true)}
      />

      <DiscoverFiltersSheet
        open={filtersOpen}
        categories={categories}
        draft={filtersDraft}
        onChange={setFiltersDraft}
        onClose={() => setFiltersOpen(false)}
        onReset={async () => {
          setFiltersDraft(DEFAULT_FILTERS);
          await onResetFilters();
          setIndex(0);
          setHistory([]);
          setFiltersOpen(false);
        }}
        onApply={async () => {
          await onApplyFilters(filtersDraft);
          setIndex(0);
          setHistory([]);
          setFiltersOpen(false);
        }}
      />

      <ProjectDetailSheet project={current} open={detailOpen} onClose={() => setDetailOpen(false)} />

      {filtering ? <p className="mt-2 text-center text-xs text-text-secondary">Refreshing deck…</p> : null}
    </section>
  );
}

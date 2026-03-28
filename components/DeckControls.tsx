"use client";

type DeckControlsProps = {
  canGoBack: boolean;
  canPass: boolean;
  onBack: () => void;
  onPass: () => void;
  onViewDetails: () => void;
};

function controlClass(disabled?: boolean) {
  return `inline-flex min-h-12 flex-1 items-center justify-center rounded-button border px-3 text-sm font-medium transition ${
    disabled ? "cursor-not-allowed border-border bg-gray-100 text-gray-400" : "border-border bg-surface text-text-primary hover:bg-gray-50"
  }`;
}

export function DeckControls({ canGoBack, canPass, onBack, onPass, onViewDetails }: DeckControlsProps) {
  return (
    <div className="pb-safe mt-4 grid grid-cols-3 gap-2">
      <button type="button" className={controlClass(!canPass)} onClick={onPass} disabled={!canPass}>
        Pass
      </button>
      <button type="button" className={controlClass(false)} onClick={onViewDetails}>
        View details
      </button>
      <button type="button" className={controlClass(!canGoBack)} onClick={onBack} disabled={!canGoBack}>
        Back
      </button>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";

type SyncRunnerProps = {
  runBagsSync: () => Promise<unknown>;
};

export function SyncRunner({ runBagsSync }: SyncRunnerProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<unknown>(null);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          startTransition(async () => {
            const data = await runBagsSync();
            setResult(data);
          });
        }}
        disabled={isPending}
        className="rounded border px-3 py-2"
      >
        Run Bags Sync
      </button>

      {isPending ? <p className="mt-3">Sync running...</p> : null}

      {result ? (
        <pre className="mt-3 overflow-auto rounded border p-3 text-sm">{JSON.stringify(result, null, 2)}</pre>
      ) : null}
    </div>
  );
}

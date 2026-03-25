import { headers } from "next/headers";
import { SyncRunner } from "./sync-runner";

export const dynamic = "force-dynamic";

async function runBagsSync() {
  "use server";

  const secret = process.env.BAGS_SYNC_SECRET?.trim();
  if (!secret) {
    return {
      ok: false,
      error: "missing_secret",
      message: "BAGS_SYNC_SECRET is not configured on the server.",
    };
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";

  if (!host) {
    return {
      ok: false,
      error: "missing_host",
      message: "Could not determine request host.",
    };
  }

  const response = await fetch(`${protocol}://${host}/api/internal/bags/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
    },
    cache: "no-store",
  });

  try {
    return await response.json();
  } catch {
    return {
      ok: false,
      error: "invalid_response",
      status: response.status,
      message: "Sync endpoint returned a non-JSON response.",
    };
  }
}

export default function InternalSyncPage() {
  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Internal Sync</h1>
      <SyncRunner runBagsSync={runBagsSync} />
    </main>
  );
}

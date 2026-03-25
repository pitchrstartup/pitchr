import { NextRequest, NextResponse } from "next/server";
import { syncHackathonProjects } from "@/lib/bags/sync-hackathon-projects";
import { verifyInternalToken } from "@/lib/internal/verify-internal-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized(message: string) {
  return NextResponse.json(
    {
      ok: false,
      error: "unauthorized",
      message,
    },
    { status: 401 },
  );
}

export async function POST(request: NextRequest) {
  const auth = verifyInternalToken(request);
  if (!auth.ok) {
    return unauthorized(auth.message ?? "Unauthorized");
  }

  const startedAt = new Date();
  const startedMs = Date.now();

  try {
    const summary = await syncHackathonProjects();
    const durationMs = Date.now() - startedMs;

    const catastrophicFailure = summary.failed > 0 && summary.imported === 0 && summary.updated === 0;

    return NextResponse.json(
      {
        ok: !catastrophicFailure,
        source: "bags_hackathon",
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs,
        summary,
      },
      { status: catastrophicFailure ? 500 : 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "bags_hackathon",
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startedMs,
        error: "sync_failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = verifyInternalToken(request);
  if (!auth.ok) {
    return unauthorized(auth.message ?? "Unauthorized");
  }

  return NextResponse.json({
    ok: true,
    message: "Use POST on this endpoint to run sync.",
    source: "bags_hackathon",
  });
}

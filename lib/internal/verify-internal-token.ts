import type { NextRequest } from "next/server";

function getProvidedToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim() || null;
  }

  const headerToken = request.headers.get("x-internal-token");
  if (headerToken?.trim()) {
    return headerToken.trim();
  }

  const queryToken = request.nextUrl.searchParams.get("token");
  if (queryToken?.trim()) {
    return queryToken.trim();
  }

  return null;
}

export function verifyInternalToken(request: NextRequest): {
  ok: boolean;
  message?: string;
} {
  const expected = process.env.BAGS_SYNC_SECRET?.trim();

  if (!expected) {
    return {
      ok: false,
      message: "Server misconfiguration: BAGS_SYNC_SECRET is not set.",
    };
  }

  const provided = getProvidedToken(request);
  if (!provided) {
    return {
      ok: false,
      message: "Missing token. Provide Authorization Bearer, x-internal-token, or ?token=.",
    };
  }

  if (provided !== expected) {
    return {
      ok: false,
      message: "Invalid token.",
    };
  }

  return { ok: true };
}

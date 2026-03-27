export function requireCronBearerAuth(request: Request, logPrefix: string): Response | null {
  const configuredSecret = process.env.CRON_SECRET;

  if (!configuredSecret) {
    console.error(`[${logPrefix}] missing CRON_SECRET`);
    return Response.json(
      {
        ok: false,
        error: 'Server misconfigured: CRON_SECRET is not set',
      },
      { status: 500 },
    );
  }

  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null;

  if (!token || token !== configuredSecret) {
    return Response.json(
      {
        ok: false,
        error: 'Unauthorized',
      },
      { status: 401 },
    );
  }

  return null;
}

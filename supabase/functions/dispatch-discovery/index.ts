// Supabase Edge Function: dispatch-discovery
// Invoked by Supabase Cron (hourly) to trigger protected worker dispatch.

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get('authorization');
  const expected = Deno.env.get('WORKER_DISPATCH_SECRET');

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const appUrl = Deno.env.get('JOBOPS_WEB_URL');
  if (!appUrl) {
    return new Response(JSON.stringify({ error: 'JOBOPS_WEB_URL not set' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const res = await fetch(`${appUrl}/api/worker/dispatch`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${expected}`,
    },
    body: JSON.stringify({ triggerType: 'cron' }),
  });

  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { 'content-type': 'application/json' },
  });
});

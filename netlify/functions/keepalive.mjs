// netlify/functions/keepalive.mjs
// Keeps the free-tier Supabase project awake.
//
// Supabase pauses free projects after 7 days with no database activity. This
// function runs once a day on Netlify's schedule and makes one tiny read against
// the database, which resets that 7-day timer so the project never sleeps.
//
// No new setup needed: it reuses the Supabase keys already in your Netlify
// environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).
//
// You can watch it run under Netlify → Logs → Functions → keepalive.

export const config = { schedule: '@daily' };

export default async () => {
  try {
    const raw = process.env.VITE_SUPABASE_URL || '';
    const url = raw.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
    const key = process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!url || !key) {
      console.log('keepalive: Supabase env vars missing — nothing pinged.');
      return new Response('skipped: missing env vars');
    }

    // A real query that reaches the database (cached/blocked responses do not
    // count as activity, so we read one row from a table the site already uses).
    const resp = await fetch(`${url}/rest/v1/jobs?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    console.log(`keepalive: pinged Supabase, status ${resp.status}`);
    return new Response(`ok: ${resp.status}`);
  } catch (err) {
    console.log('keepalive error:', String((err && err.message) || err));
    return new Response('error (ignored)');
  }
};

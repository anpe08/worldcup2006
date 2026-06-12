import { query } from '@/lib/db';

let cachedStart = null;
let cacheTime = 0;

export async function getTournamentStart() {
  // Cache for 60 seconds to avoid hammering the DB on every request
  if (cachedStart && Date.now() - cacheTime < 60_000) return cachedStart;
  const res = await query('SELECT MIN(kickoff_time) AS first_kick FROM matches');
  cachedStart = res.rows[0]?.first_kick ?? null;
  cacheTime = Date.now();
  return cachedStart;
}

export async function isTournamentLocked() {
  const start = await getTournamentStart();
  return start ? new Date(start) <= new Date() : false;
}

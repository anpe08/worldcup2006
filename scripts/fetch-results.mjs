import pg from 'pg';

const { Pool } = pg;

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!API_KEY) {
  console.error('[fetch-results] ERROR: FOOTBALL_DATA_API_KEY environment variable is required');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('[fetch-results] ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

const TEAM_NAME_MAP = {
  'Republic of Korea': 'South Korea',
  'United States': 'USA',
  "Côte d'Ivoire": 'Ivory Coast',
  'Democratic Republic of the Congo': 'DR Congo',
  'Bosnia-Herzegovina': 'Bosnia and Herzegovina',
};

function mapTeamName(apiName) {
  return TEAM_NAME_MAP[apiName] ?? apiName;
}

function deriveOutcome(homeScore, awayScore) {
  if (homeScore > awayScore) return 'home';
  if (awayScore > homeScore) return 'away';
  return 'draw';
}

function timestamp() {
  return new Date().toISOString();
}

// API statuses that mean the match is currently being played
const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED', 'HALFTIME', 'EXTRA_TIME', 'PENALTY_SHOOTOUT']);
// API statuses that mean the match is over
const FINISHED_STATUSES = new Set(['FINISHED', 'AWARDED']);

const pool = new Pool({ connectionString: DATABASE_URL });

async function run() {
  const log = (msg) => console.log(`[${timestamp()}] ${msg}`);

  try {
    // All matches past kickoff that aren't finalised yet
    const { rows: candidates } = await pool.query(`
      SELECT id, team_home, team_away, kickoff_time
      FROM matches
      WHERE kickoff_time < NOW()
        AND status IS DISTINCT FROM 'completed'
      ORDER BY kickoff_time
    `);

    if (candidates.length === 0) {
      log('No pending matches — nothing to do.');
      return;
    }

    log(`Found ${candidates.length} pending/live match(es) to check.`);

    // Fetch all WC matches from the API (no status filter so we get live + finished)
    const response = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches',
      { headers: { 'X-Auth-Token': API_KEY } }
    );

    if (!response.ok) {
      log(`API error: HTTP ${response.status} — ${await response.text()}`);
      return;
    }

    const data = await response.json();
    const apiMatches = data.matches ?? [];
    log(`Fetched ${apiMatches.length} match(es) from API.`);

    // Build lookup keyed by "HomeTeam|AwayTeam" after name translation
    const apiLookup = new Map();
    for (const m of apiMatches) {
      if (!m.homeTeam?.name || !m.awayTeam?.name) continue; // TBD knockout slots
      const home = mapTeamName(m.homeTeam.name);
      const away = mapTeamName(m.awayTeam.name);
      const key = `${home}|${away}`;
      if (apiLookup.has(key)) {
        log(`  WARN: duplicate API entry for ${key} — keeping first`);
      } else {
        apiLookup.set(key, m);
      }
    }

    const now = Date.now();
    const MATCH_DURATION_MS = 110 * 60 * 1000; // 110 min covers 90 + stoppages

    let updated = 0;
    for (const candidate of candidates) {
      const key = `${candidate.team_home}|${candidate.team_away}`;
      const apiMatch = apiLookup.get(key);
      const kickoffMs = new Date(candidate.kickoff_time).getTime();
      const elapsedMs = now - kickoffMs;

      // Check API for final result first
      if (apiMatch && FINISHED_STATUSES.has(apiMatch.status)) {
        const homeScore = apiMatch.score?.fullTime?.home;
        const awayScore = apiMatch.score?.fullTime?.away;
        if (homeScore === null || homeScore === undefined || awayScore === null || awayScore === undefined) {
          log(`  SKIP (FINISHED but scores missing): ${candidate.team_home} vs ${candidate.team_away} [id=${candidate.id}]`);
          continue;
        }
        const outcome = deriveOutcome(homeScore, awayScore);
        await pool.query(
          `UPDATE matches SET actual_home_score=$1, actual_away_score=$2, actual_outcome=$3, status='completed' WHERE id=$4`,
          [homeScore, awayScore, outcome, candidate.id]
        );
        log(`  FINAL: ${candidate.team_home} ${homeScore}–${awayScore} ${candidate.team_away} (${outcome}) [id=${candidate.id}]`);
        updated++;

      } else if (apiMatch && LIVE_STATUSES.has(apiMatch.status)) {
        // API supports live status — use it (paid tier)
        const homeScore = apiMatch.score?.fullTime?.home ?? 0;
        const awayScore = apiMatch.score?.fullTime?.away ?? 0;
        await pool.query(
          `UPDATE matches SET actual_home_score=$1, actual_away_score=$2, status='in_progress' WHERE id=$3`,
          [homeScore, awayScore, candidate.id]
        );
        log(`  LIVE (API): ${candidate.team_home} ${homeScore}–${awayScore} ${candidate.team_away} [id=${candidate.id}]`);
        updated++;

      } else if (elapsedMs >= 0 && elapsedMs < MATCH_DURATION_MS) {
        // Free-tier API doesn't update to IN_PLAY — use kickoff time to infer live
        await pool.query(
          `UPDATE matches SET status='in_progress' WHERE id=$1 AND status='pending'`,
          [candidate.id]
        );
        log(`  LIVE (time-based): ${candidate.team_home} vs ${candidate.team_away} [id=${candidate.id}]`);
        updated++;

      } else {
        const apiStatus = apiMatch?.status ?? 'no API entry';
        log(`  SKIP (API status=${apiStatus}, elapsed=${Math.round(elapsedMs / 60000)}min): ${candidate.team_home} vs ${candidate.team_away} [id=${candidate.id}]`);
      }
    }

    log(`Done. Updated ${updated}/${candidates.length} match(es).`);

  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error(`[${timestamp()}] FATAL:`, err);
  process.exit(1);
});

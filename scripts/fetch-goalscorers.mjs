import pg from 'pg';

const { Pool } = pg;

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!API_KEY) {
  console.error('[fetch-goalscorers] ERROR: FOOTBALL_DATA_API_KEY environment variable is required');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('[fetch-goalscorers] ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

// Translate football-data.org player names to names used in this DB
const PLAYER_NAME_MAP = {
  'Vinicius Junior': 'Vinícius Júnior',
};

function mapPlayerName(apiName) {
  return PLAYER_NAME_MAP[apiName] ?? apiName;
}

function timestamp() {
  return new Date().toISOString();
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function run() {
  const log = (msg) => console.log(`[${timestamp()}] ${msg}`);

  try {
    const response = await fetch(
      'https://api.football-data.org/v4/competitions/WC/scorers?limit=100',
      { headers: { 'X-Auth-Token': API_KEY } }
    );

    if (!response.ok) {
      log(`API error: HTTP ${response.status} — ${await response.text()}`);
      return;
    }

    const data = await response.json();
    const scorers = data.scorers ?? [];

    if (scorers.length === 0) {
      log('No scorers returned from API — tournament may not have started yet.');
      return;
    }

    log(`Fetched ${scorers.length} scorer(s) from API.`);

    // Fetch all player names that at least one participant predicted
    const { rows: predicted } = await pool.query(`
      SELECT DISTINCT unnest(ARRAY[player_1, player_2, player_3]) AS player_name
      FROM goalscorer_predictions
      WHERE player_1 IS NOT NULL OR player_2 IS NOT NULL OR player_3 IS NOT NULL
    `);
    const predictedNames = new Set(predicted.map(r => r.player_name).filter(Boolean));

    let updated = 0;
    let skipped = 0;

    for (const entry of scorers) {
      const apiName = entry.player?.name;
      if (!apiName) continue;

      const dbName = mapPlayerName(apiName);
      const goals = entry.goals ?? 0;

      if (!predictedNames.has(dbName)) {
        skipped++;
        continue;
      }

      await pool.query(`
        INSERT INTO actual_goalscorers (player_name, goals)
        VALUES ($1, $2)
        ON CONFLICT (player_name)
        DO UPDATE SET goals = $2
      `, [dbName, goals]);

      log(`  UPDATED: ${dbName} — ${goals} goal(s)`);
      updated++;
    }

    log(`Done. Updated ${updated} predicted player(s), skipped ${skipped} unpredicted.`);

  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error(`[${timestamp()}] FATAL:`, err);
  process.exit(1);
});

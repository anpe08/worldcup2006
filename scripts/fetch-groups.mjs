import pg from 'pg';

const { Pool } = pg;

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!API_KEY) {
  console.error('[fetch-groups] ERROR: FOOTBALL_DATA_API_KEY environment variable is required');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('[fetch-groups] ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

const TEAM_NAME_MAP = {
  'Republic of Korea': 'South Korea',
  'United States': 'USA',
  "Côte d'Ivoire": 'Ivory Coast',
  'Democratic Republic of the Congo': 'DR Congo',
  'Congo DR': 'DR Congo',
  'Bosnia-Herzegovina': 'Bosnia and Herzegovina',
  'Cape Verde Islands': 'Cape Verde',
};

function mapTeamName(apiName) {
  return TEAM_NAME_MAP[apiName] ?? apiName;
}

function timestamp() {
  return new Date().toISOString();
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function run() {
  const log = (msg) => console.log(`[${timestamp()}] ${msg}`);

  try {
    const response = await fetch(
      'https://api.football-data.org/v4/competitions/WC/standings',
      { headers: { 'X-Auth-Token': API_KEY } }
    );

    if (!response.ok) {
      log(`API error: HTTP ${response.status} — ${await response.text()}`);
      return;
    }

    const data = await response.json();
    const standings = data.standings ?? [];
    log(`Fetched standings for ${standings.length} group(s).`);

    let updated = 0;
    let skipped = 0;

    for (const group of standings) {
      const groupLabel = group.group ?? '';
      // API returns "Group A", "Group B", etc.
      const groupLetter = groupLabel.replace('Group ', '').trim();
      if (!groupLetter || groupLetter.length !== 1) {
        log(`  SKIP: unrecognised group label "${groupLabel}"`);
        continue;
      }

      const table = group.table ?? [];
      if (table.length < 3) {
        log(`  SKIP Group ${groupLetter}: not enough teams in table (${table.length})`);
        continue;
      }

      // Only finalise when every team has played all their group matches (3 each)
      const allComplete = table.every(row => row.playedGames >= 3);
      if (!allComplete) {
        const played = table.map(r => r.playedGames);
        log(`  SKIP Group ${groupLetter}: not finished yet (games played: ${played.join(', ')})`);
        skipped++;
        continue;
      }

      const sorted = [...table].sort((a, b) => a.position - b.position);
      const first  = mapTeamName(sorted[0].team.name);
      const second = mapTeamName(sorted[1].team.name);
      const third  = mapTeamName(sorted[2].team.name);

      await pool.query(`
        INSERT INTO actual_group_rankings (group_name, actual_1st, actual_2nd, actual_3rd)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (group_name)
        DO UPDATE SET actual_1st = $2, actual_2nd = $3, actual_3rd = $4
      `, [groupLetter, first, second, third]);

      log(`  Group ${groupLetter}: 1=${first}, 2=${second}, 3=${third}`);
      updated++;
    }

    log(`Done. Updated ${updated} group(s), skipped ${skipped} incomplete.`);

  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error(`[${timestamp()}] FATAL:`, err);
  process.exit(1);
});

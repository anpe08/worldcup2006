import pg from 'pg';
const { Client } = pg;
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:6976bnp3195lTC@localhost:5432/worldcup_db';
const client = new Client({ connectionString });

// Official FIFA World Cup 2026 group stage fixtures (source: ESPN/FIFA)
// Kickoff times in UTC. Venue timezones: EDT=UTC-4, CDT=UTC-5, PDT=UTC-7
const MATCHES = [
  // ── June 11 ──
  { g:'A', h:'Mexico',        a:'South Africa',           t:'2026-06-11T19:00:00Z' },
  { g:'A', h:'South Korea',   a:'Czechia',                t:'2026-06-12T02:00:00Z' },
  // ── June 12 ──
  { g:'B', h:'Canada',        a:'Bosnia and Herzegovina', t:'2026-06-12T19:00:00Z' },
  { g:'D', h:'USA',           a:'Paraguay',               t:'2026-06-13T01:00:00Z' },
  // ── June 13 ──
  { g:'B', h:'Qatar',         a:'Switzerland',            t:'2026-06-13T19:00:00Z' },
  { g:'C', h:'Brazil',        a:'Morocco',                t:'2026-06-13T22:00:00Z' },
  { g:'C', h:'Haiti',         a:'Scotland',               t:'2026-06-14T01:00:00Z' },
  { g:'D', h:'Australia',     a:'Turkey',                 t:'2026-06-14T04:00:00Z' },
  // ── June 14 ──
  { g:'E', h:'Germany',       a:'Curaçao',                t:'2026-06-14T17:00:00Z' },
  { g:'F', h:'Netherlands',   a:'Japan',                  t:'2026-06-14T20:00:00Z' },
  { g:'E', h:'Ivory Coast',   a:'Ecuador',                t:'2026-06-14T23:00:00Z' },
  { g:'F', h:'Sweden',        a:'Tunisia',                t:'2026-06-15T02:00:00Z' },
  // ── June 15 ──
  { g:'H', h:'Spain',         a:'Cape Verde',             t:'2026-06-15T17:00:00Z' },
  { g:'G', h:'Belgium',       a:'Egypt',                  t:'2026-06-15T22:00:00Z' },
  { g:'H', h:'Saudi Arabia',  a:'Uruguay',                t:'2026-06-15T22:00:00Z' },
  { g:'G', h:'Iran',          a:'New Zealand',            t:'2026-06-16T04:00:00Z' },
  // ── June 16 ──
  { g:'I', h:'France',        a:'Senegal',                t:'2026-06-16T19:00:00Z' },
  { g:'I', h:'Iraq',          a:'Norway',                 t:'2026-06-16T22:00:00Z' },
  { g:'J', h:'Argentina',     a:'Algeria',                t:'2026-06-17T01:00:00Z' },
  { g:'J', h:'Austria',       a:'Jordan',                 t:'2026-06-17T04:00:00Z' },
  // ── June 17 ──
  { g:'K', h:'Portugal',      a:'DR Congo',               t:'2026-06-17T17:00:00Z' },
  { g:'L', h:'England',       a:'Croatia',                t:'2026-06-17T20:00:00Z' },
  { g:'L', h:'Ghana',         a:'Panama',                 t:'2026-06-17T23:00:00Z' },
  { g:'K', h:'Uzbekistan',    a:'Colombia',               t:'2026-06-18T02:00:00Z' },
  // ── June 18 ──
  { g:'A', h:'Czechia',       a:'South Africa',           t:'2026-06-18T16:00:00Z' },
  { g:'B', h:'Switzerland',   a:'Bosnia and Herzegovina', t:'2026-06-18T19:00:00Z' },
  { g:'B', h:'Canada',        a:'Qatar',                  t:'2026-06-18T22:00:00Z' },
  { g:'A', h:'Mexico',        a:'South Korea',            t:'2026-06-19T03:00:00Z' },
  // ── June 19 ──
  { g:'D', h:'USA',           a:'Australia',              t:'2026-06-19T19:00:00Z' },
  { g:'C', h:'Scotland',      a:'Morocco',                t:'2026-06-19T22:00:00Z' },
  { g:'C', h:'Brazil',        a:'Haiti',                  t:'2026-06-20T01:00:00Z' },
  { g:'D', h:'Turkey',        a:'Paraguay',               t:'2026-06-20T04:00:00Z' },
  // ── June 20 ──
  { g:'F', h:'Netherlands',   a:'Sweden',                 t:'2026-06-20T17:00:00Z' },
  { g:'E', h:'Germany',       a:'Ivory Coast',            t:'2026-06-20T20:00:00Z' },
  { g:'E', h:'Ecuador',       a:'Curaçao',                t:'2026-06-21T00:00:00Z' },
  { g:'F', h:'Tunisia',       a:'Japan',                  t:'2026-06-21T04:00:00Z' },
  // ── June 21 ──
  { g:'H', h:'Spain',         a:'Saudi Arabia',           t:'2026-06-21T16:00:00Z' },
  { g:'G', h:'Belgium',       a:'Iran',                   t:'2026-06-21T19:00:00Z' },
  { g:'H', h:'Uruguay',       a:'Cape Verde',             t:'2026-06-21T22:00:00Z' },
  { g:'G', h:'New Zealand',   a:'Egypt',                  t:'2026-06-22T01:00:00Z' },
  // ── June 22 ──
  { g:'J', h:'Argentina',     a:'Austria',                t:'2026-06-22T17:00:00Z' },
  { g:'I', h:'France',        a:'Iraq',                   t:'2026-06-22T21:00:00Z' },
  { g:'I', h:'Norway',        a:'Senegal',                t:'2026-06-23T00:00:00Z' },
  { g:'J', h:'Jordan',        a:'Algeria',                t:'2026-06-23T03:00:00Z' },
  // ── June 23 ──
  { g:'K', h:'Portugal',      a:'Uzbekistan',             t:'2026-06-23T17:00:00Z' },
  { g:'L', h:'England',       a:'Ghana',                  t:'2026-06-23T20:00:00Z' },
  { g:'L', h:'Panama',        a:'Croatia',                t:'2026-06-23T23:00:00Z' },
  { g:'K', h:'Colombia',      a:'DR Congo',               t:'2026-06-24T02:00:00Z' },
  // ── June 24 ──
  { g:'B', h:'Switzerland',   a:'Canada',                 t:'2026-06-24T19:00:00Z' },
  { g:'B', h:'Bosnia and Herzegovina', a:'Qatar',         t:'2026-06-24T19:00:00Z' },
  { g:'C', h:'Scotland',      a:'Brazil',                 t:'2026-06-24T22:00:00Z' },
  { g:'C', h:'Morocco',       a:'Haiti',                  t:'2026-06-24T22:00:00Z' },
  { g:'A', h:'Czechia',       a:'Mexico',                 t:'2026-06-25T01:00:00Z' },
  { g:'A', h:'South Africa',  a:'South Korea',            t:'2026-06-25T01:00:00Z' },
  // ── June 25 ──
  { g:'E', h:'Ecuador',       a:'Germany',                t:'2026-06-25T20:00:00Z' },
  { g:'E', h:'Curaçao',       a:'Ivory Coast',            t:'2026-06-25T20:00:00Z' },
  { g:'F', h:'Japan',         a:'Sweden',                 t:'2026-06-25T23:00:00Z' },
  { g:'F', h:'Tunisia',       a:'Netherlands',            t:'2026-06-25T23:00:00Z' },
  { g:'D', h:'Turkey',        a:'USA',                    t:'2026-06-26T02:00:00Z' },
  { g:'D', h:'Paraguay',      a:'Australia',              t:'2026-06-26T02:00:00Z' },
  // ── June 26 ──
  { g:'I', h:'Norway',        a:'France',                 t:'2026-06-26T19:00:00Z' },
  { g:'I', h:'Senegal',       a:'Iraq',                   t:'2026-06-26T19:00:00Z' },
  { g:'H', h:'Cape Verde',    a:'Saudi Arabia',           t:'2026-06-27T00:00:00Z' },
  { g:'H', h:'Uruguay',       a:'Spain',                  t:'2026-06-27T00:00:00Z' },
  { g:'G', h:'Egypt',         a:'Iran',                   t:'2026-06-27T03:00:00Z' },
  { g:'G', h:'New Zealand',   a:'Belgium',                t:'2026-06-27T03:00:00Z' },
  // ── June 27 ──
  { g:'L', h:'Panama',        a:'England',                t:'2026-06-27T21:00:00Z' },
  { g:'L', h:'Croatia',       a:'Ghana',                  t:'2026-06-27T21:00:00Z' },
  { g:'K', h:'Colombia',      a:'Portugal',               t:'2026-06-27T23:30:00Z' },
  { g:'K', h:'DR Congo',      a:'Uzbekistan',             t:'2026-06-27T23:30:00Z' },
  { g:'J', h:'Algeria',       a:'Austria',                t:'2026-06-28T02:00:00Z' },
  { g:'J', h:'Jordan',        a:'Argentina',              t:'2026-06-28T02:00:00Z' },
];

async function seed() {
  await client.connect();
  console.log("Connected to database.");

  await client.query(`DELETE FROM predictions`);
  await client.query(`DELETE FROM group_predictions`);
  await client.query(`DELETE FROM matches`);

  const placeholders = [];
  const values = [];
  let paramCount = 1;
  for (const m of MATCHES) {
    placeholders.push(`($${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++})`);
    values.push(m.g, m.h, m.a, m.t);
  }

  await client.query(
    `INSERT INTO matches (group_name, team_home, team_away, kickoff_time) VALUES ${placeholders.join(', ')}`,
    values
  );
  console.log(`Successfully inserted ${MATCHES.length} matches with correct official fixtures and dates.`);

  // Seed Allowed Players
  await client.query(`
    CREATE TABLE IF NOT EXISTS allowed_players (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL
    )
  `);
  
  const popularPlayers = [
    'Alexander Isak', 'Antoine Griezmann', 'Bernardo Silva', 'Bruno Fernandes',
    'Bukayo Saka', 'Christian Pulisic', 'Cristiano Ronaldo', 'Darwin Núñez',
    'Dejan Kulusevski', 'Erling Haaland', 'Federico Valverde', 'Florian Wirtz',
    'Gabriel Jesus', 'Granit Xhaka', 'Harry Kane', 'Jamal Musiala',
    'Jonathan David', 'Jude Bellingham', 'Julián Álvarez', 'Kevin De Bruyne',
    'Kylian Mbappé', 'Lautaro Martínez', 'Lionel Messi', 'Luis Díaz',
    'Luka Modrić', 'Mohamed Salah', 'Neymar Jr', 'Phil Foden',
    'Rafael Leão', 'Rodri', 'Romelu Lukaku', 'Santiago Giménez',
    'Son Heung-min', 'Viktor Gyökeres', 'Vinícius Júnior'
  ];
  await client.query(`DELETE FROM allowed_players`);
  const playerPlaceholders = popularPlayers.map((_, i) => `($${i + 1})`).join(', ');
  await client.query(`INSERT INTO allowed_players (name) VALUES ${playerPlaceholders} ON CONFLICT (name) DO NOTHING`, popularPlayers);
  console.log("Successfully inserted popular players.");

  await client.end();
}
seed().catch(console.error);

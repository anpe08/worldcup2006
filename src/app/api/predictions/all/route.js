import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT
        m.id          AS match_id,
        m.group_name,
        m.team_home,
        m.team_away,
        m.kickoff_time,
        m.status,
        m.actual_home_score,
        m.actual_away_score,
        pa.id         AS participant_id,
        pa.username,
        p.predicted_home_score,
        p.predicted_away_score,
        p.predicted_outcome
      FROM matches m
      CROSS JOIN participants pa
      LEFT JOIN predictions p
             ON p.match_id = m.id AND p.participant_id = pa.id
      WHERE m.group_name IS NOT NULL
      ORDER BY m.group_name, m.kickoff_time, pa.username ASC
    `);
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

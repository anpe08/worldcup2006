import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT
        m.id,
        m.group_name,
        m.team_home,
        m.team_away,
        m.kickoff_time,
        m.status,
        m.actual_home_score,
        m.actual_away_score,
        m.actual_outcome,
        COUNT(p.participant_id) FILTER (WHERE p.predicted_outcome = 'home') AS home_count,
        COUNT(p.participant_id) FILTER (WHERE p.predicted_outcome = 'draw') AS draw_count,
        COUNT(p.participant_id) FILTER (WHERE p.predicted_outcome = 'away') AS away_count,
        COUNT(p.participant_id) AS total_count,
        COUNT(p.participant_id) FILTER (
          WHERE p.predicted_home_score = m.actual_home_score
            AND p.predicted_away_score = m.actual_away_score
            AND m.actual_home_score IS NOT NULL
        ) AS exact_count
      FROM matches m
      LEFT JOIN predictions p ON p.match_id = m.id
      GROUP BY m.id, m.group_name, m.team_home, m.team_away, m.kickoff_time,
               m.status, m.actual_home_score, m.actual_away_score, m.actual_outcome
      ORDER BY m.kickoff_time ASC
    `);
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

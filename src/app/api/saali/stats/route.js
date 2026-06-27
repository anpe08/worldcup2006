import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT
        m.id AS match_id,
        m.group_name,
        m.team_home,
        m.team_away,
        m.kickoff_time,
        m.actual_home_score,
        m.actual_away_score,
        m.actual_outcome,
        m.status,
        COUNT(sp.id) AS total_count,
        COUNT(sp.id) FILTER (WHERE sp.predicted_outcome = 'home') AS home_count,
        COUNT(sp.id) FILTER (WHERE sp.predicted_outcome = 'draw') AS draw_count,
        COUNT(sp.id) FILTER (WHERE sp.predicted_outcome = 'away') AS away_count,
        COUNT(sp.id) FILTER (WHERE sp.predicted_outcome = m.actual_outcome AND m.actual_outcome IS NOT NULL) AS outcome_correct_count,
        COUNT(sp.id) FILTER (WHERE sp.predicted_home_score = m.actual_home_score AND sp.predicted_away_score = m.actual_away_score AND m.actual_home_score IS NOT NULL) AS exact_count
      FROM matches m
      LEFT JOIN saali_predictions sp ON sp.match_id = m.id
      GROUP BY m.id
      ORDER BY m.kickoff_time ASC
    `);
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error('[saali/stats]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

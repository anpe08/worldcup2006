import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [matchRes, predRes, partRes] = await Promise.all([
      query('SELECT * FROM matches ORDER BY kickoff_time ASC'),
      query('SELECT * FROM saali_predictions'),
      query('SELECT id, username FROM participants ORDER BY username ASC'),
    ]);

    // Build prediction lookup: predMap[participant_id][match_id] = { home, away, outcome }
    const predMap = {};
    for (const p of predRes.rows) {
      if (!predMap[p.participant_id]) predMap[p.participant_id] = {};
      predMap[p.participant_id][p.match_id] = {
        predicted_home_score: p.predicted_home_score,
        predicted_away_score: p.predicted_away_score,
        predicted_outcome: p.predicted_outcome,
      };
    }

    return NextResponse.json({
      matches: matchRes.rows,
      participants: partRes.rows,
      predictions: predMap,
    });
  } catch (err) {
    console.error('[saali/predictions]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

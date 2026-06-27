import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');
  if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 });

  try {
    const res = await query(`
      SELECT
        pa.username,
        sp.predicted_home_score,
        sp.predicted_away_score,
        sp.predicted_outcome
      FROM saali_predictions sp
      JOIN participants pa ON pa.id = sp.participant_id
      WHERE sp.match_id = $1
      ORDER BY pa.username ASC
    `, [matchId]);
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

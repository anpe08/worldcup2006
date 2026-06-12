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
        p.predicted_home_score,
        p.predicted_away_score,
        p.predicted_outcome
      FROM predictions p
      JOIN participants pa ON pa.id = p.participant_id
      WHERE p.match_id = $1
      ORDER BY pa.username ASC
    `, [matchId]);
    return NextResponse.json(res.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

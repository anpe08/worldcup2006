import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyParticipant } from '@/lib/auth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    const res = await query(`
      SELECT * FROM tournament_predictions WHERE participant_id = $1
    `, [userId]);
    return NextResponse.json(res.rows[0] || {});
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { participant_id, pin, winner, top_scorer, golden_glove, most_assists } = body;

    const isAuthed = await verifyParticipant(participant_id, pin);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized. Invalid PIN code.' }, { status: 401 });
    }

    await query(`
      INSERT INTO tournament_predictions (participant_id, winner, top_scorer, golden_glove, most_assists)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (participant_id)
      DO UPDATE SET winner=$2, top_scorer=$3, golden_glove=$4, most_assists=$5
    `, [participant_id, winner, top_scorer, golden_glove, most_assists]);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

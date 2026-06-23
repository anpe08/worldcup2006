import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyParticipant } from '@/lib/auth';
import { isTournamentLocked } from '@/lib/tournament';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  try {
    const res = await query(`SELECT * FROM final_eight_predictions WHERE participant_id = $1`, [userId]);
    return NextResponse.json(res.rows[0] || {});
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { participant_id, pin, winner, silver, bronze, fourth, qf1, qf2, qf3, qf4, top_scorer, top_country } = await request.json();

    const isAuthed = await verifyParticipant(participant_id, pin);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized. Invalid PIN code.' }, { status: 401 });
    }

    const exemptRes = await query('SELECT predictions_exempt FROM participants WHERE id = $1', [participant_id]);
    const isExempt = exemptRes.rows[0]?.predictions_exempt ?? false;

    if (!isExempt && await isTournamentLocked()) {
      return NextResponse.json({ error: 'Predictions are locked — the tournament has started.' }, { status: 403 });
    }

    await query(`
      INSERT INTO final_eight_predictions (participant_id, winner, silver, bronze, fourth, qf1, qf2, qf3, qf4, top_scorer, top_country)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (participant_id) 
      DO UPDATE SET winner=$2, silver=$3, bronze=$4, fourth=$5, qf1=$6, qf2=$7, qf3=$8, qf4=$9, top_scorer=$10, top_country=$11
    `, [participant_id, winner, silver, bronze, fourth, qf1, qf2, qf3, qf4, top_scorer, top_country]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

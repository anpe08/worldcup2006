import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyParticipant } from '@/lib/auth';
import { isTournamentLocked } from '@/lib/tournament';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  try {
    const res = await query(`SELECT * FROM goalscorer_predictions WHERE participant_id = $1`, [userId]);
    return NextResponse.json(res.rows[0] || {});
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { participant_id, pin, player_1, player_2, player_3 } = await request.json();

    const isAuthed = await verifyParticipant(participant_id, pin);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized. Invalid PIN code.' }, { status: 401 });
    }

    const exemptRes = await query('SELECT predictions_exempt FROM participants WHERE id = $1', [participant_id]);
    const isExempt = exemptRes.rows[0]?.predictions_exempt ?? false;

    if (!isExempt && await isTournamentLocked()) {
      return NextResponse.json({ error: 'Predictions are locked — the tournament has started.' }, { status: 403 });
    }

    // Database-level player validation
    const playerResult = await query('SELECT name FROM allowed_players');
    const allowedNames = playerResult.rows.map(r => r.name.toLowerCase());

    const invalidPlayer = [player_1, player_2, player_3]
      .filter(Boolean)
      .find(p => !allowedNames.includes(p.toLowerCase()));

    if (invalidPlayer) {
      return NextResponse.json({ error: `"${invalidPlayer}" is not an allowed player. Please select from the dropdown.` }, { status: 400 });
    }

    await query(`
      INSERT INTO goalscorer_predictions (participant_id, player_1, player_2, player_3)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (participant_id) 
      DO UPDATE SET player_1=$2, player_2=$3, player_3=$4
    `, [participant_id, player_1, player_2, player_3]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

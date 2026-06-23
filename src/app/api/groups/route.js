import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyParticipant } from '@/lib/auth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  try {
    const res = await query(`SELECT * FROM group_predictions WHERE participant_id = $1`, [userId]);
    return NextResponse.json(res.rows || []);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { participant_id, pin, predictions } = await request.json(); 

    const isAuthed = await verifyParticipant(participant_id, pin);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized. Invalid PIN code.' }, { status: 401 });
    }

    for (const p of predictions) {
       await query(`
         INSERT INTO group_predictions (participant_id, group_name, predicted_1st, predicted_2nd, predicted_3rd)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (participant_id, group_name) 
         DO UPDATE SET predicted_1st=$3, predicted_2nd=$4, predicted_3rd=$5
       `, [participant_id, p.group_name, p.predicted_1st, p.predicted_2nd, p.predicted_3rd]);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT
        pa.id,
        pa.username,
        fe.winner,
        fe.silver,
        fe.bronze,
        fe.fourth,
        fe.qf1,
        fe.qf2,
        fe.qf3,
        fe.qf4,
        fe.top_scorer,
        fe.top_country,
        gs.player_1,
        gs.player_2,
        gs.player_3
      FROM participants pa
      LEFT JOIN final_eight_predictions fe ON fe.participant_id = pa.id
      LEFT JOIN goalscorer_predictions gs ON gs.participant_id = pa.id
      ORDER BY pa.username ASC
    `);
    return NextResponse.json(res.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

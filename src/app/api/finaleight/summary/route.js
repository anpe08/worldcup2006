import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const winnersRes = await query(`
      SELECT fe.winner AS team, COUNT(*) AS count,
             array_agg(par.username ORDER BY par.username) AS pickers
      FROM final_eight_predictions fe
      JOIN participants par ON par.id = fe.participant_id
      WHERE fe.winner IS NOT NULL AND fe.winner <> ''
      GROUP BY fe.winner
      ORDER BY count DESC, fe.winner
    `);

    const scorersRes = await query(`
      SELECT fe.top_scorer AS player, COUNT(*) AS count,
             array_agg(par.username ORDER BY par.username) AS pickers
      FROM final_eight_predictions fe
      JOIN participants par ON par.id = fe.participant_id
      WHERE fe.top_scorer IS NOT NULL AND fe.top_scorer <> ''
      GROUP BY fe.top_scorer
      ORDER BY count DESC, fe.top_scorer
    `);

    return NextResponse.json({
      winners: winnersRes.rows,
      topScorers: scorersRes.rows,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [totalRes, playersRes] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM goalscorer_predictions`),
      query(`
        SELECT player, COUNT(*) AS count
        FROM (
          SELECT player_1 AS player FROM goalscorer_predictions WHERE player_1 IS NOT NULL AND player_1 <> ''
          UNION ALL
          SELECT player_2 FROM goalscorer_predictions WHERE player_2 IS NOT NULL AND player_2 <> ''
          UNION ALL
          SELECT player_3 FROM goalscorer_predictions WHERE player_3 IS NOT NULL AND player_3 <> ''
        ) sub
        GROUP BY player
        ORDER BY count DESC, player ASC
      `),
    ]);

    return NextResponse.json({
      total: Number(totalRes.rows[0]?.total || 0),
      players: playersRes.rows.map(r => ({ name: r.player, count: Number(r.count) })),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

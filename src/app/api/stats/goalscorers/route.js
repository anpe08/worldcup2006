import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [totalRes, playersRes, topScorerRes] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM goalscorer_predictions`),
      query(`
        SELECT sub.player, COUNT(*) AS count, COALESCE(ag.goals, 0) AS goals
        FROM (
          SELECT player_1 AS player FROM goalscorer_predictions WHERE player_1 IS NOT NULL AND player_1 <> ''
          UNION ALL
          SELECT player_2 FROM goalscorer_predictions WHERE player_2 IS NOT NULL AND player_2 <> ''
          UNION ALL
          SELECT player_3 FROM goalscorer_predictions WHERE player_3 IS NOT NULL AND player_3 <> ''
        ) sub
        LEFT JOIN actual_goalscorers ag ON ag.player_name = sub.player
        GROUP BY sub.player, ag.goals
        ORDER BY count DESC, player ASC
      `),
      query(`
        SELECT player_name, goals FROM actual_goalscorers
        WHERE goals = (SELECT MAX(goals) FROM actual_goalscorers)
        ORDER BY player_name ASC
      `),
    ]);

    const topGoals = topScorerRes.rows[0] ? Number(topScorerRes.rows[0].goals) : 0;
    return NextResponse.json({
      total: Number(totalRes.rows[0]?.total || 0),
      players: playersRes.rows.map(r => ({ name: r.player, count: Number(r.count), goals: Number(r.goals) })),
      topScorers: topGoals > 0 ? topScorerRes.rows.map(r => ({ name: r.player_name, goals: topGoals })) : [],
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

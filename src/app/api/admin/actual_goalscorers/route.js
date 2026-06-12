import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // All players that at least one participant picked, with current goal counts
    const res = await query(`
      SELECT p.player_name, COALESCE(a.goals, 0) AS goals
      FROM (
        SELECT DISTINCT unnest(ARRAY[player_1, player_2, player_3]) AS player_name
        FROM goalscorer_predictions
      ) p
      LEFT JOIN actual_goalscorers a ON a.player_name = p.player_name
      WHERE p.player_name IS NOT NULL AND p.player_name <> ''
      ORDER BY p.player_name
    `);
    return NextResponse.json(res.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { player_name, goals } = await request.json();
    await query(`
      INSERT INTO actual_goalscorers (player_name, goals)
      VALUES ($1, $2)
      ON CONFLICT (player_name)
      DO UPDATE SET goals = $2
    `, [player_name, Number(goals)]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

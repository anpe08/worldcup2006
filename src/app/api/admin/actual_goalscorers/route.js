import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request) {
  const deny = requireAdmin(request);
  if (deny) return deny;

  try {
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
    console.error('[actual_goalscorers GET]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(request) {
  const deny = requireAdmin(request);
  if (deny) return deny;

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
    console.error('[actual_goalscorers POST]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

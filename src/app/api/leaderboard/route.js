import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT * FROM leaderboard
      ORDER BY total_points DESC, match_pts DESC, final_eight_pts DESC, group_rank_pts DESC, goalscorer_pts DESC, username ASC
    `);
    return NextResponse.json(res.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

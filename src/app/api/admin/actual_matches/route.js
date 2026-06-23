import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(request) {
  const deny = requireAdmin(request);
  if (deny) return deny;

  const { match_id, actual_home_score, actual_away_score, actual_outcome } = await request.json();
  try {
    await query(`
      UPDATE matches SET actual_home_score=$1, actual_away_score=$2, actual_outcome=$3, status='completed'
      WHERE id=$4
    `, [actual_home_score, actual_away_score, actual_outcome, match_id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[actual_matches]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

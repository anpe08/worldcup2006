import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  const { match_id, actual_home_score, actual_away_score, actual_outcome } = await request.json();
  try {
     await query(`
       UPDATE matches SET actual_home_score=$1, actual_away_score=$2, actual_outcome=$3, status='completed'
       WHERE id=$4
     `, [actual_home_score, actual_away_score, actual_outcome, match_id]);
     return NextResponse.json({ success: true });
  } catch (err) {
     return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

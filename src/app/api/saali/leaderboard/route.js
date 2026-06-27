import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query('SELECT * FROM saali_leaderboard');
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error('[saali/leaderboard]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

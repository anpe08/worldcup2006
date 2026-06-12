import { NextResponse } from 'next/server';
import { getTournamentStart } from '@/lib/tournament';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const firstKickoff = await getTournamentStart();
    const locked = firstKickoff ? new Date(firstKickoff) <= new Date() : false;

    if (locked && userId) {
      const res = await query(
        'SELECT predictions_exempt FROM participants WHERE id = $1',
        [userId]
      );
      if (res.rows[0]?.predictions_exempt) {
        return NextResponse.json({ locked: false, firstKickoff, exempt: true });
      }
    }

    return NextResponse.json({ locked, firstKickoff, exempt: false });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

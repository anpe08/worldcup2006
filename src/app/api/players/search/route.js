import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const res = await query(
      `SELECT name FROM allowed_players WHERE name ILIKE $1 ORDER BY name LIMIT 10`,
      [`%${q}%`]
    );
    return NextResponse.json(res.rows.map(r => r.name));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

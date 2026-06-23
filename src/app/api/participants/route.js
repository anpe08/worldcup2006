import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query('SELECT id, username, beers_in, created_at FROM participants ORDER BY id ASC');
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

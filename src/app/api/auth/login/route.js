import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPin } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, pin } = await request.json();
    if (!username || !pin) {
      return NextResponse.json({ error: 'Username and PIN are required.' }, { status: 400 });
    }

    const hashed = hashPin(pin);
    const res = await query('SELECT * FROM participants WHERE username = $1', [username]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const user = res.rows[0];
    if (user.pin_code !== hashed) {
      return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      username: user.username,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

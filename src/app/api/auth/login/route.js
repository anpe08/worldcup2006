import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPin } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimiter';

export async function POST(request) {
  const ip = getClientIp(request);

  try {
    const { username, pin } = await request.json();
    if (!username || !pin) {
      return NextResponse.json({ error: 'Username and PIN are required.' }, { status: 400 });
    }

    // Rate limit: 5 attempts per username per 15 minutes
    if (!checkRateLimit(`login:${ip}:${String(username).toLowerCase()}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
    }

    const hashed = hashPin(pin);
    // Case-insensitive lookup; return same error whether username is wrong or PIN is wrong (H2)
    const res = await query(
      'SELECT id, username, pin_code FROM participants WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    if (res.rows.length === 0 || res.rows[0].pin_code !== hashed) {
      return NextResponse.json({ error: 'Invalid username or PIN.' }, { status: 401 });
    }

    const user = res.rows[0];
    return NextResponse.json({ success: true, userId: user.id, username: user.username });
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

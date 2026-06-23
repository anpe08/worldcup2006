import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPin } from '@/lib/auth';
import { isTournamentLocked } from '@/lib/tournament';
import { checkRateLimit, getClientIp } from '@/lib/rateLimiter';

export async function POST(request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many registrations from this address. Try again later.' }, { status: 429 });
  }

  try {
    const { username, pin } = await request.json();
    if (!username || !pin) {
      return NextResponse.json({ error: 'Username and PIN are required.' }, { status: 400 });
    }

    if (await isTournamentLocked()) {
      return NextResponse.json({ error: 'Registration is closed — the tournament has already started.' }, { status: 403 });
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 2 || trimmedUsername.length > 50) {
      return NextResponse.json({ error: 'Username must be between 2 and 50 characters.' }, { status: 400 });
    }

    const pinString = String(pin);
    if (!/^\d{6}$/.test(pinString)) {
      return NextResponse.json({ error: 'PIN must be exactly 6 digits.' }, { status: 400 });
    }

    const hashed = hashPin(pinString);

    const checkRes = await query('SELECT 1 FROM participants WHERE LOWER(username) = LOWER($1)', [trimmedUsername]);
    if (checkRes.rows.length > 0) {
      return NextResponse.json({ error: 'Username is already taken.' }, { status: 400 });
    }

    const insertRes = await query(
      'INSERT INTO participants (username, pin_code) VALUES ($1, $2) RETURNING id, username',
      [trimmedUsername, hashed]
    );

    const newUser = insertRes.rows[0];
    return NextResponse.json({ success: true, userId: newUser.id, username: newUser.username });
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

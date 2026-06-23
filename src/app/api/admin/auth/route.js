import { NextResponse } from 'next/server';
import { signAdminToken, verifyAdminToken, getAdminToken, ADMIN_COOKIE } from '@/lib/adminAuth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimiter';

const COOKIE_ATTRS = `HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=${8 * 60 * 60}`;

// GET — check whether the current session is valid (used by the admin page on mount)
export async function GET(request) {
  if (verifyAdminToken(getAdminToken(request))) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

// POST — verify password, issue session cookie
export async function POST(request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`admin-login:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
  }

  try {
    const { password } = await request.json();
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }
    const token = signAdminToken();
    const res = NextResponse.json({ success: true });
    res.headers.set('Set-Cookie', `${ADMIN_COOKIE}=${encodeURIComponent(token)}; ${COOKIE_ATTRS}`);
    return res;
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// DELETE — clear the session cookie (logout)
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.headers.set('Set-Cookie', `${ADMIN_COOKIE}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`);
  return res;
}

import crypto from 'crypto';
import { NextResponse } from 'next/server';

export const ADMIN_COOKIE = 'admin_session';
const SESSION_MS = 8 * 60 * 60 * 1000; // 8 hours

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error('ADMIN_SESSION_SECRET is not configured');
  return s;
}

export function signAdminToken() {
  const exp = String(Date.now() + SESSION_MS);
  const sig = crypto.createHmac('sha256', secret()).update(exp).digest('hex');
  return `${exp}.${sig}`;
}

export function verifyAdminToken(token) {
  if (!token) return false;
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return false;
    const exp = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (sig.length !== 64) return false;
    const expected = crypto.createHmac('sha256', secret()).update(exp).digest('hex');
    const match = crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
    return match && Date.now() < Number(exp);
  } catch {
    return false;
  }
}

export function getAdminToken(request) {
  const header = request.headers.get('cookie') ?? '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Call at the top of every admin route. Returns a 401 Response if unauthorized, null if ok.
export function requireAdmin(request) {
  if (!verifyAdminToken(getAdminToken(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  return null;
}

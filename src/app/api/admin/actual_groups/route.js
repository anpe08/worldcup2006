import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request) {
  const deny = requireAdmin(request);
  if (deny) return deny;

  try {
    const res = await query('SELECT * FROM actual_group_rankings');
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error('[actual_groups GET]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(request) {
  const deny = requireAdmin(request);
  if (deny) return deny;

  const { group_name, actual_1st, actual_2nd, actual_3rd } = await request.json();
  try {
    await query(`
      INSERT INTO actual_group_rankings (group_name, actual_1st, actual_2nd, actual_3rd)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (group_name)
      DO UPDATE SET actual_1st=$2, actual_2nd=$3, actual_3rd=$4
    `, [group_name, actual_1st || null, actual_2nd || null, actual_3rd || null]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[actual_groups POST]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request) {
  const deny = requireAdmin(request);
  if (deny) return deny;

  try {
    const res = await query('SELECT * FROM actual_final_eight WHERE id = 1');
    return NextResponse.json(res.rows[0] || {});
  } catch (err) {
    console.error('[actual_finaleight GET]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(request) {
  const deny = requireAdmin(request);
  if (deny) return deny;

  const body = await request.json();
  const { winner, silver, bronze, fourth, qf1, qf2, qf3, qf4, top_scorer, top_country, shared_top_scorer_count, shared_top_country_count } = body;
  try {
    await query(`
      UPDATE actual_final_eight SET
        winner=$1, silver=$2, bronze=$3, fourth=$4,
        qf1=$5, qf2=$6, qf3=$7, qf4=$8,
        top_scorer=$9, top_country=$10,
        shared_top_scorer_count=$11, shared_top_country_count=$12
      WHERE id=1
    `, [winner||null, silver||null, bronze||null, fourth||null,
        qf1||null, qf2||null, qf3||null, qf4||null,
        top_scorer||null, top_country||null,
        shared_top_scorer_count||1, shared_top_country_count||1]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[actual_finaleight POST]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

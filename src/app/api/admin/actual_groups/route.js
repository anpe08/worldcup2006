import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
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
     return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export async function GET(request) {
  try {
     const res = await query(`SELECT * FROM actual_group_rankings`);
     return NextResponse.json(res.rows);
  } catch (err) {
     return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [totalRes, rowsRes] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM final_eight_predictions`),
      query(`
        SELECT category, value, COUNT(*) AS count
        FROM (
          SELECT 'winner'       AS category, winner       AS value FROM final_eight_predictions WHERE winner       IS NOT NULL AND winner       <> ''
          UNION ALL
          SELECT 'silver',                   silver                FROM final_eight_predictions WHERE silver       IS NOT NULL AND silver       <> ''
          UNION ALL
          SELECT 'bronze',                   bronze                FROM final_eight_predictions WHERE bronze       IS NOT NULL AND bronze       <> ''
          UNION ALL
          SELECT 'fourth',                   fourth                FROM final_eight_predictions WHERE fourth       IS NOT NULL AND fourth       <> ''
          UNION ALL
          SELECT 'qf',                       qf1                   FROM final_eight_predictions WHERE qf1          IS NOT NULL AND qf1          <> ''
          UNION ALL
          SELECT 'qf',                       qf2                   FROM final_eight_predictions WHERE qf2          IS NOT NULL AND qf2          <> ''
          UNION ALL
          SELECT 'qf',                       qf3                   FROM final_eight_predictions WHERE qf3          IS NOT NULL AND qf3          <> ''
          UNION ALL
          SELECT 'qf',                       qf4                   FROM final_eight_predictions WHERE qf4          IS NOT NULL AND qf4          <> ''
          UNION ALL
          SELECT 'top_scorer',               top_scorer            FROM final_eight_predictions WHERE top_scorer   IS NOT NULL AND top_scorer   <> ''
          UNION ALL
          SELECT 'top_country',              top_country           FROM final_eight_predictions WHERE top_country  IS NOT NULL AND top_country  <> ''
        ) sub
        GROUP BY category, value
        ORDER BY category, count DESC, value ASC
      `),
    ]);

    const total = Number(totalRes.rows[0]?.total || 0);
    const grouped = {};
    for (const row of rowsRes.rows) {
      if (!grouped[row.category]) grouped[row.category] = [];
      grouped[row.category].push({ value: row.value, count: Number(row.count) });
    }

    return NextResponse.json({
      total,
      winner:           grouped.winner       || [],
      silver:           grouped.silver       || [],
      bronze:           grouped.bronze       || [],
      fourth:           grouped.fourth       || [],
      quarterfinalists: grouped.qf           || [],
      top_scorer:       grouped.top_scorer   || [],
      top_country:      grouped.top_country  || [],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

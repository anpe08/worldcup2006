import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyParticipant } from '@/lib/auth';
import { isTournamentLocked } from '@/lib/tournament';
import { calculateGroupStandings } from '@/lib/standings';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    const matchRes = await query(`
      SELECT m.*, p.predicted_outcome, p.predicted_home_score, p.predicted_away_score
      FROM matches m
      LEFT JOIN predictions p ON p.match_id = m.id AND p.participant_id = $1
      ORDER BY m.kickoff_time ASC
    `, [userId || null]);

    let exempt = false;
    if (userId) {
      const pRes = await query(
        'SELECT predictions_exempt FROM participants WHERE id = $1',
        [userId]
      );
      exempt = pRes.rows[0]?.predictions_exempt ?? false;
    }

    return NextResponse.json({ matches: matchRes.rows, exempt });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { participant_id, pin, match_id, predicted_home_score, predicted_away_score, predicted_outcome } = body;

    const isAuthed = await verifyParticipant(participant_id, pin);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized. Invalid PIN code.' }, { status: 401 });
    }

    // Check if this participant has a late-entry exemption
    const exemptRes = await query(
      'SELECT predictions_exempt FROM participants WHERE id = $1',
      [participant_id]
    );
    const isExempt = exemptRes.rows[0]?.predictions_exempt ?? false;

    if (!isExempt && await isTournamentLocked()) {
      return NextResponse.json({ error: 'Predictions are locked — the tournament has started.' }, { status: 403 });
    }

    // Exempt users cannot predict matches already in progress or completed
    if (isExempt) {
      const matchRes = await query('SELECT status FROM matches WHERE id = $1', [match_id]);
      const matchStatus = matchRes.rows[0]?.status;
      if (matchStatus === 'completed' || matchStatus === 'in_progress') {
        return NextResponse.json({ error: 'Cannot predict a match that is already live or finished.' }, { status: 403 });
      }
    }

    // Insert or update match prediction
    await query(`
      INSERT INTO predictions (participant_id, match_id, predicted_home_score, predicted_away_score, predicted_outcome)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (participant_id, match_id)
      DO UPDATE SET predicted_home_score = $3, predicted_away_score = $4, predicted_outcome = $5
    `, [participant_id, match_id, predicted_home_score, predicted_away_score, predicted_outcome]);

    // Recalculate group standings automatically
    const matchRes = await query('SELECT group_name FROM matches WHERE id = $1', [match_id]);
    const groupName = matchRes.rows[0]?.group_name;

    if (groupName) {
      const groupMatchesRes = await query(`
        SELECT m.team_home, m.team_away, p.predicted_home_score, p.predicted_away_score
        FROM matches m
        LEFT JOIN predictions p ON p.match_id = m.id AND p.participant_id = $1
        WHERE m.group_name = $2
      `, [participant_id, groupName]);

      const standings = calculateGroupStandings(groupMatchesRes.rows);
      const first = standings[0]?.name || null;
      const second = standings[1]?.name || null;
      const third = standings[2]?.name || null;

      await query(`
        INSERT INTO group_predictions (participant_id, group_name, predicted_1st, predicted_2nd, predicted_3rd)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (participant_id, group_name)
        DO UPDATE SET predicted_1st = $3, predicted_2nd = $4, predicted_3rd = $5
      `, [participant_id, groupName, first, second, third]);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

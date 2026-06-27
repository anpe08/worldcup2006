import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyParticipant } from '@/lib/auth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  const GROUP_STAGE = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  try {
    let res;
    if (userId) {
      res = await query(
        `SELECT m.*, sp.predicted_home_score, sp.predicted_away_score, sp.predicted_outcome
         FROM matches m
         LEFT JOIN saali_predictions sp ON sp.match_id = m.id AND sp.participant_id = $1
         WHERE m.group_name NOT IN (${GROUP_STAGE.map((_, i) => `$${i + 2}`).join(',')})
         ORDER BY m.kickoff_time ASC`,
        [userId, ...GROUP_STAGE]
      );
    } else {
      res = await query(
        `SELECT * FROM matches WHERE group_name NOT IN (${GROUP_STAGE.map((_, i) => `$${i + 1}`).join(',')}) ORDER BY kickoff_time ASC`,
        GROUP_STAGE
      );
    }
    return NextResponse.json(res.rows);
  } catch (err) {
    console.error('[saali/matches GET]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { participant_id, pin, match_id, predicted_home_score, predicted_away_score, predicted_outcome } = await request.json();

    if (!participant_id || !pin || !match_id || predicted_home_score == null || predicted_away_score == null || !predicted_outcome) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const valid = await verifyParticipant(participant_id, pin);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const matchRes = await query('SELECT status, kickoff_time FROM matches WHERE id = $1', [match_id]);
    if (matchRes.rows.length === 0) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }
    const match = matchRes.rows[0];
    const cutoff = new Date(new Date(match.kickoff_time).getTime() - 15 * 60 * 1000);
    if (match.status !== 'pending' || cutoff <= new Date()) {
      return NextResponse.json({ error: 'Predictions for this match are now closed.' }, { status: 403 });
    }

    await query(
      `INSERT INTO saali_predictions (participant_id, match_id, predicted_home_score, predicted_away_score, predicted_outcome)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (participant_id, match_id)
       DO UPDATE SET predicted_home_score = $3, predicted_away_score = $4, predicted_outcome = $5`,
      [participant_id, match_id, predicted_home_score, predicted_away_score, predicted_outcome]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[saali/matches POST]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

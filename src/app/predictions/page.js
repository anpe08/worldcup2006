'use client';
import { useState, useEffect } from 'react';
import Flag from '../components/Flag';

function pivot(rows) {
  const participantSet = new Set();
  const groupMap = {};

  rows.forEach(row => {
    participantSet.add(row.username);

    const g = row.group_name;
    if (!groupMap[g]) groupMap[g] = { matchOrder: [], matches: {}, cells: {} };
    const grp = groupMap[g];

    if (!grp.matches[row.match_id]) {
      grp.matchOrder.push(row.match_id);
      grp.matches[row.match_id] = {
        match_id: row.match_id,
        team_home: row.team_home,
        team_away: row.team_away,
        kickoff_time: row.kickoff_time,
        status: row.status,
        actual_home_score: row.actual_home_score,
        actual_away_score: row.actual_away_score,
      };
      grp.cells[row.match_id] = {};
    }

    if (row.predicted_home_score !== null && row.predicted_away_score !== null) {
      grp.cells[row.match_id][row.username] = {
        score: `${row.predicted_home_score}–${row.predicted_away_score}`,
        outcome: row.predicted_outcome,
      };
    }
  });

  const participants = Array.from(participantSet).sort();
  const groupKeys = Object.keys(groupMap).sort();
  return { participants, groupKeys, groupMap };
}

function outcomeOf(homeScore, awayScore) {
  if (homeScore === null || awayScore === null) return null;
  if (homeScore > awayScore) return 'home';
  if (awayScore > homeScore) return 'away';
  return 'draw';
}

export default function Predictions() {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saaliData, setSaaliData] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem('simUserId');
    const name = localStorage.getItem('simUsername') || '';
    if (id) { setUserId(id); setUsername(name); }
    fetch('/api/predictions/all')
      .then(r => r.json())
      .then(rows => { if (Array.isArray(rows)) setData(pivot(rows)); })
      .finally(() => setLoading(false));
    fetch('/api/saali/predictions').then(r => r.json()).then(d => { if (!d.error) setSaaliData(d); });
  }, []);

  if (!userId) {
    return (
      <div style={{ margin: '40px auto', maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: 'rgba(94,106,210,0.08)', borderRadius: '12px', border: '1px solid rgba(94,106,210,0.2)' }}>
        <span style={{ fontSize: '2rem' }}>🔒</span>
        <div>
          <h2 style={{ color: 'white', fontSize: '1.1rem', margin: '0 0 4px 0' }}>Authentication Required</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>
            Please click <strong>"Sign In / Register"</strong> in the top right first.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-secondary)' }}>⏳ Loading predictions matrix…</div>;
  }

  if (!data) return null;

  const { participants, groupKeys, groupMap } = data;

  return (
    <div>
      <h1 className="page-title">Match Predictions Matrix</h1>
      <p className="page-subtitle">Every player's pick for every group stage match — scan across a row to compare, down a column to follow one player.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '40px' }}>
        {groupKeys.map(groupName => {
          const grp = groupMap[groupName];
          const teams = [...new Set(grp.matchOrder.flatMap(id => [grp.matches[id].team_home, grp.matches[id].team_away]))];

          return (
            <div key={groupName}>
              {/* Group header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 16px', marginBottom: '0',
                background: 'rgba(94,106,210,0.06)', border: '1px solid var(--border)',
                borderRadius: '12px 12px 0 0',
              }}>
                <span style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem' }}>Group {groupName}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{teams.join(' · ')}</span>
              </div>

              {/* Scrollable table */}
              <div className="table-scroll-wrapper" style={{ overflowX: 'auto', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 12px 12px', background: 'rgba(255,255,255,0.015)' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: '0.82rem', tableLayout: 'auto' }}>
                  <thead>
                    <tr>
                      {/* Corner cell */}
                      <th style={{
                        padding: '0 12px',
                        height: '120px',
                        position: 'sticky', left: 0, zIndex: 2,
                        background: 'rgba(14,18,32,0.98)',
                        borderBottom: '1px solid var(--border)',
                        borderRight: '1px solid var(--border)',
                        minWidth: '160px',
                      }} />
                      {participants.map(name => {
                        const isMe = name === username;
                        return (
                          <th key={name} style={{
                            padding: '8px 6px 4px',
                            height: '120px',
                            verticalAlign: 'bottom',
                            textAlign: 'center',
                            borderBottom: '1px solid var(--border)',
                            borderRight: '1px solid rgba(255,255,255,0.04)',
                            background: isMe ? 'rgba(94,106,210,0.1)' : 'transparent',
                            minWidth: '44px',
                          }}>
                            <div style={{
                              writingMode: 'vertical-lr',
                              transform: 'rotate(180deg)',
                              color: isMe ? 'var(--primary)' : 'var(--text-secondary)',
                              fontWeight: isMe ? 800 : 500,
                              fontSize: '0.8rem',
                              whiteSpace: 'nowrap',
                              paddingBottom: '4px',
                            }}>
                              {name}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {grp.matchOrder.map((matchId, rowIdx) => {
                      const m = grp.matches[matchId];
                      const actualOutcome = outcomeOf(m.actual_home_score, m.actual_away_score);
                      const isCompleted = m.status === 'completed';

                      return (
                        <tr key={matchId} style={{ borderBottom: rowIdx < grp.matchOrder.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          {/* Match label — sticky */}
                          <td style={{
                            padding: '10px 12px',
                            position: 'sticky', left: 0, zIndex: 1,
                            background: rowIdx % 2 === 0 ? 'rgba(11,15,25,0.98)' : 'rgba(18,22,38,0.98)',
                            borderRight: '1px solid var(--border)',
                            whiteSpace: 'nowrap',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Flag team={m.team_home} style={{ height: '11px', marginRight: 0, marginLeft: 0 }} />
                              <span style={{ color: 'white', fontWeight: 600, fontSize: '0.8rem' }}>{m.team_home}</span>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '0 2px' }}>vs</span>
                              <span style={{ color: 'white', fontWeight: 600, fontSize: '0.8rem' }}>{m.team_away}</span>
                              <Flag team={m.team_away} style={{ height: '11px', marginRight: 0, marginLeft: 0 }} />
                            </div>
                            {isCompleted && (
                              <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, marginTop: '2px' }}>
                                {m.actual_home_score}–{m.actual_away_score}
                              </div>
                            )}
                          </td>

                          {/* Prediction cells */}
                          {participants.map(name => {
                            const isMe = name === username;
                            const pred = grp.cells[matchId][name];
                            let cellBg = isMe ? 'rgba(94,106,210,0.07)' : 'transparent';
                            let textColor = 'var(--text-secondary)';
                            let cellContent = <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>—</span>;

                            if (pred) {
                              textColor = 'white';
                              if (isCompleted && actualOutcome) {
                                const correct = pred.outcome === actualOutcome;
                                cellBg = correct
                                  ? isMe ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.08)'
                                  : isMe ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.07)';
                                textColor = correct ? '#10B981' : '#ef4444';
                              }
                              cellContent = (
                                <span style={{ color: textColor, fontWeight: isMe ? 700 : 500, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                  {pred.score}
                                </span>
                              );
                            }

                            return (
                              <td key={name} style={{
                                padding: '10px 6px',
                                textAlign: 'center',
                                background: cellBg,
                                borderRight: '1px solid rgba(255,255,255,0.03)',
                              }}>
                                {cellContent}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Säälipleijarit predictions matrix */}
      {saaliData && (() => {
        const { matches, participants, predictions } = saaliData;
        if (!matches || matches.length === 0) return null;
        const matchesWithPreds = matches.filter(m => participants.some(p => predictions[p.id]?.[m.id]));
        if (matchesWithPreds.length === 0) return (
          <div style={{ marginTop: '32px' }}>
            <h1 className="page-title" style={{ fontSize: '1.3rem' }}>🏅 Säälipleijarit Predictions</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No predictions submitted yet.</p>
          </div>
        );
        return (
          <div style={{ marginTop: '40px' }}>
            <h1 className="page-title" style={{ fontSize: '1.3rem', marginBottom: '6px' }}>🏅 Säälipleijarit Predictions</h1>
            <p className="page-subtitle" style={{ marginBottom: '24px' }}>All säälipleijarit picks — only matches with at least one prediction shown.</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: '500px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, minWidth: '160px', position: 'sticky', left: 0, background: 'var(--bg)', zIndex: 1 }}>Match</th>
                    {participants.map(p => (
                      <th key={p.id} style={{ padding: '4px 6px', textAlign: 'center', minWidth: '60px' }}>
                        <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, color: String(p.id) === String(userId) ? 'var(--primary)' : 'var(--text-secondary)', padding: '4px 0', maxHeight: '80px', overflow: 'hidden' }}>
                          {p.username}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matchesWithPreds.map(m => {
                    const kickoffDate = new Date(m.kickoff_time);
                    const showPreds = m.status === 'completed' || m.status === 'in_progress' || kickoffDate <= new Date();
                    const actualOutcome = m.actual_outcome;
                    const dateStr = kickoffDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px 10px', position: 'sticky', left: 0, background: 'var(--bg)', zIndex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'white', fontSize: '0.8rem' }}>{m.team_home} vs {m.team_away}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            {dateStr}
                            {m.actual_home_score != null && <span style={{ marginLeft: 6, color: '#10B981', fontWeight: 700 }}>{m.actual_home_score}–{m.actual_away_score}</span>}
                          </div>
                        </td>
                        {participants.map(p => {
                          const pred = predictions[p.id]?.[m.id];
                          if (!pred || !showPreds) {
                            return <td key={p.id} style={{ padding: '8px 6px', textAlign: 'center', color: 'rgba(255,255,255,0.15)' }}>—</td>;
                          }
                          const exact = pred.predicted_home_score === m.actual_home_score && pred.predicted_away_score === m.actual_away_score;
                          const outcomeOk = pred.predicted_outcome === actualOutcome && actualOutcome;
                          const cellBg = m.status === 'completed'
                            ? exact ? 'rgba(16,185,129,0.2)' : outcomeOk ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'
                            : 'transparent';
                          const cellColor = m.status === 'completed'
                            ? exact ? '#10B981' : outcomeOk ? 'rgba(16,185,129,0.7)' : '#ef4444'
                            : 'white';
                          return (
                            <td key={p.id} style={{ padding: '8px 6px', textAlign: 'center', background: cellBg }}>
                              <span style={{ color: cellColor, fontWeight: 600 }}>
                                {pred.predicted_home_score}–{pred.predicted_away_score}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

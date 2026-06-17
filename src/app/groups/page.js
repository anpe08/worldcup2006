'use client';
import { useState, useEffect } from 'react';
import Flag from '../components/Flag';
import { calculateGroupStandings } from '@/lib/standings';

const TOURNAMENT_GROUPS = {
  A: ['Mexico', 'South Korea', 'South Africa', 'Czechia'],
  B: ['Canada', 'Switzerland', 'Qatar', 'Bosnia and Herzegovina'],
  C: ['Brazil', 'Morocco', 'Scotland', 'Haiti'],
  D: ['USA', 'Australia', 'Paraguay', 'Turkey'],
  E: ['Germany', 'Ecuador', 'Ivory Coast', 'Curaçao'],
  F: ['Netherlands', 'Japan', 'Tunisia', 'Sweden'],
  G: ['Belgium', 'Iran', 'Egypt', 'New Zealand'],
  H: ['Spain', 'Uruguay', 'Saudi Arabia', 'Cape Verde'],
  I: ['France', 'Senegal', 'Norway', 'Iraq'],
  J: ['Argentina', 'Austria', 'Algeria', 'Jordan'],
  K: ['Portugal', 'Colombia', 'Uzbekistan', 'DR Congo'],
  L: ['England', 'Croatia', 'Panama', 'Ghana']
};

export default function Groups() {
  const [userId, setUserId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem('simUserId');
    if (id) {
      setUserId(id);
      setSelectedId(id);
      fetch('/api/participants')
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setParticipants(data); });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    fetch(`/api/matches?userId=${selectedId}`)
      .then(r => r.json())
      .then(data => {
        const rows = data.matches ?? (Array.isArray(data) ? data : []);
        setMatches(rows);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedId]);

  if (!userId) {
    return (
      <div style={{ margin: '40px auto', maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: 'rgba(94,106,210,0.08)', borderRadius: '12px', border: '1px solid rgba(94,106,210,0.2)' }}>
        <span style={{ fontSize: '2rem' }}>🔒</span>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ color: 'white', fontSize: '1.1rem', margin: '0 0 4px 0' }}>Authentication Required</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4', fontSize: '0.85rem' }}>
            Please click <strong>"Sign In / Register"</strong> in the top right first.
          </p>
        </div>
      </div>
    );
  }

  const selectedName = participants.find(p => String(p.id) === String(selectedId))?.username ?? '';
  const groupKeys = Object.keys(TOURNAMENT_GROUPS);

  return (
    <div>
      <h1 className="page-title">Group Stage Standings</h1>
      <p className="page-subtitle">
        📊 Tables calculated from match predictions. Group stage is locked — browse everyone's picks.
      </p>

      {/* Participant switcher */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '28px',
      }}>
        {participants.map(p => {
          const isSelected = String(p.id) === String(selectedId);
          const isMe = String(p.id) === String(userId);
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(String(p.id))}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.12)',
                background: isSelected ? 'rgba(94,106,210,0.25)' : 'rgba(255,255,255,0.04)',
                color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: isSelected ? 700 : 400,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {p.username}{isMe ? ' (you)' : ''}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-secondary)' }}>
          ⏳ Loading {selectedName}'s predictions…
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '24px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
          marginBottom: '40px',
        }}>
          {groupKeys.map(groupName => {
            const groupMatches = matches.filter(m => m.group_name === groupName);

            const predictedCount = groupMatches.filter(m =>
              m.predicted_home_score !== null && m.predicted_home_score !== undefined && m.predicted_home_score !== '' &&
              m.predicted_away_score !== null && m.predicted_away_score !== undefined && m.predicted_away_score !== ''
            ).length;

            const standings = calculateGroupStandings(groupMatches);
            const progressColor = predictedCount === 6 ? '#10B981' : predictedCount > 0 ? '#F59E0B' : 'var(--text-secondary)';

            return (
              <div key={groupName} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Group {groupName}</h3>
                  <span style={{
                    fontSize: '0.78rem',
                    color: progressColor,
                    fontWeight: 700,
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${predictedCount === 6 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)'}`,
                    padding: '3px 8px',
                    borderRadius: '12px'
                  }}>
                    {predictedCount}/6 predicted
                  </span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                      <th style={{ padding: '6px 4px', width: '30px' }}>#</th>
                      <th style={{ padding: '6px 4px' }}>Team</th>
                      <th style={{ padding: '6px 4px', textAlign: 'center', width: '30px' }}>P</th>
                      <th style={{ padding: '6px 4px', textAlign: 'center', width: '35px' }}>GD</th>
                      <th style={{ padding: '6px 4px', textAlign: 'center', width: '35px' }}>GF</th>
                      <th style={{ padding: '6px 4px', textAlign: 'center', width: '35px', fontWeight: 800, color: 'white' }}>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((team, index) => {
                      const medals = ['🥇', '🥈', '🥉', ''];
                      const rowOpacity = team.played === 0 ? 0.75 : 1;
                      const isAdvancing = index < 3;

                      return (
                        <tr
                          key={team.name}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                            color: isAdvancing ? 'white' : 'var(--text-secondary)',
                            opacity: rowOpacity,
                            fontWeight: isAdvancing ? 600 : 400,
                            background: isAdvancing ? 'rgba(255,255,255,0.01)' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '10px 4px', fontWeight: 800 }}>
                            {isAdvancing ? medals[index] : index + 1}
                          </td>
                          <td style={{ padding: '10px 4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Flag team={team.name} style={{ height: '11px', marginRight: '2px', marginLeft: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>
                          </td>
                          <td style={{ padding: '10px 4px', textAlign: 'center', color: 'var(--text-secondary)' }}>{team.played}</td>
                          <td style={{
                            padding: '10px 4px',
                            textAlign: 'center',
                            color: team.gd > 0 ? '#10B981' : team.gd < 0 ? '#EF4444' : 'var(--text-secondary)',
                            fontWeight: team.gd !== 0 ? 600 : 400
                          }}>
                            {team.gd > 0 ? `+${team.gd}` : team.gd}
                          </td>
                          <td style={{ padding: '10px 4px', textAlign: 'center', color: 'var(--text-secondary)' }}>{team.goals_for}</td>
                          <td style={{ padding: '10px 4px', textAlign: 'center', fontWeight: 800, color: isAdvancing ? 'var(--primary)' : 'var(--text-secondary)' }}>
                            {team.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

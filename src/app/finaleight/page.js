'use client';
import { useState, useEffect } from 'react';
import Flag from '../components/Flag';
import PlayerTypeahead from '../components/PlayerTypeahead';

const ALL_COUNTRIES = [
  'Mexico','South Korea','South Africa','Czechia',
  'Canada','Switzerland','Qatar','Bosnia and Herzegovina',
  'Brazil','Morocco','Scotland','Haiti',
  'USA','Australia','Paraguay','Turkey',
  'Germany','Ecuador','Ivory Coast','Curaçao',
  'Netherlands','Japan','Tunisia','Sweden',
  'Belgium','Iran','Egypt','New Zealand',
  'Spain','Uruguay','Saudi Arabia','Cape Verde',
  'France','Senegal','Norway','Iraq',
  'Argentina','Austria','Algeria','Jordan',
  'Portugal','Colombia','Uzbekistan','DR Congo',
  'England','Croatia','Panama','Ghana',
];

export default function FinalEight() {
  const [userId, setUserId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [advancingTeams, setAdvancingTeams] = useState([]);
  const [tournamentLocked, setTournamentLocked] = useState(false);
  const [picks, setPicks] = useState({
    winner: '', silver: '', bronze: '', fourth: '',
    qf1: '', qf2: '', qf3: '', qf4: '',
    top_scorer: '', top_country: ''
  });

  useEffect(() => {
    const id = localStorage.getItem('simUserId');
    fetch(`/api/tournament/status${id ? `?userId=${id}` : ''}`).then(r => r.json()).then(d => setTournamentLocked(d.locked));
    if (id) {
      setUserId(id);
      
      // Fetch picks
      fetch(`/api/finaleight?userId=${id}`).then(r => r.json()).then(data => {
        if (data && Object.keys(data).length > 0) setPicks(prev => ({ ...prev, ...data }));
      });

      // Fetch group predictions to calculate advancing teams
      fetch(`/api/groups?userId=${id}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            const teams = [];
            data.forEach(g => {
              if (g.predicted_1st) teams.push(g.predicted_1st);
              if (g.predicted_2nd) teams.push(g.predicted_2nd);
              if (g.predicted_3rd) teams.push(g.predicted_3rd);
            });
            const uniqueTeams = Array.from(new Set(teams)).sort();
            setAdvancingTeams(uniqueTeams);
          }
        })
        .catch(err => console.error('Error fetching group predictions:', err));
    }
  }, []);

  const handlePlayerInput = (field, value) => {
    setPicks(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) return;

    if (picks.top_scorer === '') {
      alert('Please select a valid player from the dropdown suggestions for the Golden Boot winner.');
      return;
    }

    const pin = localStorage.getItem('simUserPin');
    await fetch('/api/finaleight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant_id: userId, pin, ...picks })
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const hasAdvancingTeams = advancingTeams.length > 0;
  const selectableCountries = hasAdvancingTeams ? advancingTeams : ALL_COUNTRIES;

  if (!userId) return (
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

  const sections = [
    {
      title: '🏆 The Final Four',
      subtitle: 'Predict exact finishing order for massive points (6/5/4/4 pts)',
      fields: [
        { field: 'winner', label: '🥇 Champion' },
        { field: 'silver', label: '🥈 Runner-up' },
        { field: 'bronze', label: '🥉 Third Place' },
        { field: 'fourth', label: '4️⃣ Fourth Place' },
      ]
    },
    {
      title: '⚔️ Quarterfinalists (5th–8th)',
      subtitle: '2 pts each if they reach the QF stage in any order',
      fields: [
        { field: 'qf1', label: 'Quarterfinalist 1' },
        { field: 'qf2', label: 'Quarterfinalist 2' },
        { field: 'qf3', label: 'Quarterfinalist 3' },
        { field: 'qf4', label: 'Quarterfinalist 4' },
      ]
    },
    {
      title: '🎯 Individual Awards',
      subtitle: 'Big bonus points — 5 pts for Golden Boot, 10 pts for Top Country!',
      fields: [
        { field: 'top_scorer', label: '👟 Golden Boot (top goalscorer player)', isPlayer: true },
        { field: 'top_country', label: '🌍 Top Scoring Country (most team goals)', isCountry: true },
      ]
    },
  ];

  return (
    <div>
      <h1 className="page-title">Final Eight & Awards</h1>
      <p className="page-subtitle">Lock in your knockout stage bracket — more points for getting the exact finish position!</p>

      {/* Scoring Guide */}
      <div className="glass-card" style={{ marginBottom: '28px', maxWidth: 640, padding: '20px 24px' }}>
        <h3 style={{ color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px' }}>📋 How Points Are Awarded</h3>
        <div className="table-scroll-wrapper" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '16px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '6px 10px 8px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Your Pick</th>
                <th style={{ textAlign: 'center', padding: '6px 8px 8px', color: 'white', fontWeight: 700 }}>Exact</th>
                <th style={{ textAlign: 'center', padding: '6px 8px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>1 place off</th>
                <th style={{ textAlign: 'center', padding: '6px 8px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>Final Four (wrong spot)</th>
                <th style={{ textAlign: 'center', padding: '6px 8px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>Knocked out at QF</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: '🥇 Champion', exact: 6, close: 3, top4: 2, qf: 1 },
                { label: '🥈 Runner-up', exact: 5, close: 3, top4: 2, qf: 1 },
                { label: '🥉 Bronze', exact: 4, close: 3, top4: 2, qf: 1 },
                { label: '4️⃣ Fourth', exact: 4, close: 3, top4: 2, qf: 1 },
              ].map(row => (
                <tr key={row.label} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '7px 10px 7px 0', color: 'white', fontWeight: 600 }}>{row.label}</td>
                  <td style={{ textAlign: 'center', padding: '7px 8px', color: '#10B981', fontWeight: 700 }}>{row.exact} pts</td>
                  <td style={{ textAlign: 'center', padding: '7px 8px', color: 'var(--text-secondary)' }}>{row.close} pts</td>
                  <td style={{ textAlign: 'center', padding: '7px 8px', color: 'var(--text-secondary)' }}>{row.top4} pts</td>
                  <td style={{ textAlign: 'center', padding: '7px 8px', color: 'var(--text-secondary)' }}>{row.qf} pt</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
            <span style={{ color: 'white', fontWeight: 700, minWidth: 140 }}>⚔️ QF Slots (×4)</span>
            <span style={{ color: '#10B981', fontWeight: 700 }}>2 pts</span>
            <span style={{ color: 'var(--text-secondary)' }}>if they reach QF ·</span>
            <span style={{ color: 'var(--text-secondary)' }}>1 pt if they go further</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
            <span style={{ color: 'white', fontWeight: 700, minWidth: 140 }}>👟 Golden Boot</span>
            <span style={{ color: '#10B981', fontWeight: 700 }}>5 pts</span>
            <span style={{ color: 'var(--text-secondary)' }}>if your pick wins the Golden Boot</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
            <span style={{ color: 'white', fontWeight: 700, minWidth: 140 }}>🌍 Top Country</span>
            <span style={{ color: '#10B981', fontWeight: 700 }}>10 pts</span>
            <span style={{ color: 'var(--text-secondary)' }}>if your pick scores the most goals</span>
          </div>
        </div>
      </div>

      {hasAdvancingTeams && advancingTeams.length < 36 && (
        <div style={{ 
          background: 'rgba(245, 158, 11, 0.08)', 
          border: '1px solid rgba(245, 158, 11, 0.2)', 
          borderRadius: '10px', 
          padding: '14px 18px', 
          color: '#fbbf24', 
          fontSize: '0.85rem', 
          marginBottom: '24px',
          maxWidth: '640px',
          lineHeight: '1.4'
        }}>
          ⚠️ **Dynamic Advancing Teams Active**: You have predicted standings for only some groups. The dropdowns below are currently limited to your **{advancingTeams.length} qualified teams** so far. Finish predicting your match scores to see all 36 qualifiers!
        </div>
      )}

      {!hasAdvancingTeams && (
        <div style={{ 
          background: 'rgba(94, 106, 210, 0.08)', 
          border: '1px solid rgba(94, 106, 210, 0.2)', 
          borderRadius: '10px', 
          padding: '14px 18px', 
          color: '#c7d2fe', 
          fontSize: '0.85rem', 
          marginBottom: '24px',
          maxWidth: '640px',
          lineHeight: '1.4'
        }}>
          💡 **Auto-Sync Tip**: Knockout bracket selections are automatically linked to your group predictions. Complete the group stage match predictions to populate your qualified teams here! *(Showing all 48 countries for now)*
        </div>
      )}

      {tournamentLocked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', marginBottom: '20px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', maxWidth: 640 }}>
          <span style={{ fontSize: '1.5rem' }}>🔒</span>
          <div>
            <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '2px', fontSize: '0.95rem' }}>Predictions Locked</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>The tournament has started — your picks are locked in.</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: 640, pointerEvents: tournamentLocked ? 'none' : 'auto', opacity: tournamentLocked ? 0.65 : 1 }}>
        {sections.map(section => (
          <div key={section.title} className="glass-card">
            <h3 style={{ color: 'var(--primary)', marginBottom: '4px', fontSize: '1.1rem' }}>{section.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>{section.subtitle}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {section.fields.map(({ field, label, isPlayer }) => (
                <div key={field}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem' }}>
                    <span>{label}</span>
                    {!isPlayer && picks[field] && <Flag team={picks[field]} style={{ marginRight: 0, marginLeft: '4px' }} />}
                  </label>
                  {isPlayer ? (
                    <PlayerTypeahead
                      value={picks[field]}
                      onChange={(val) => handlePlayerInput(field, val)}
                      placeholder="Type player name (e.g. Harry Kane)..."
                      required
                    />
                  ) : (
                  <select
                    className="input-field"
                    value={picks[field] || ''}
                    onChange={e => setPicks({ ...picks, [field]: e.target.value })}
                    required
                  >
                    <option value="" disabled>Select country...</option>
                    {(field === 'top_country' ? ALL_COUNTRIES : selectableCountries).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          type="submit"
          className="btn-primary"
          disabled={tournamentLocked}
          style={{
            padding: '16px',
            fontSize: '1rem',
            background: tournamentLocked ? 'rgba(255,255,255,0.06)' : saved ? 'linear-gradient(135deg, #10B981, #059669)' : undefined,
            color: tournamentLocked ? 'var(--text-secondary)' : undefined,
            cursor: tournamentLocked ? 'not-allowed' : 'pointer',
            opacity: tournamentLocked ? 0.5 : 1,
          }}
        >
          {tournamentLocked ? '🔒 Predictions Locked' : saved ? '✅ All Picks Saved!' : 'Save All Predictions'}
        </button>
      </form>
    </div>
  );
}

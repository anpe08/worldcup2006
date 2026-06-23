'use client';
import { useState, useEffect } from 'react';
import Flag from '../components/Flag';

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
  L: ['England', 'Croatia', 'Panama', 'Ghana'],
};

const ALL_COUNTRIES = Object.values(TOURNAMENT_GROUPS).flat();

export default function AdminHub() {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);
  const [logging, setLogging] = useState(false);

  const [matches, setMatches] = useState([]);
  const [groups, setGroups] = useState([]);
  const [actualFE, setActualFE] = useState({
    top_scorer: '', top_country: '', winner: '', silver: '', bronze: '', fourth: '',
    qf1: '', qf2: '', qf3: '', qf4: '', shared_top_scorer_count: 1, shared_top_country_count: 1
  });
  const [savingMatches, setSavingMatches] = useState({});
  const [savingGroups, setSavingGroups] = useState({});
  const [savingFE, setSavingFE] = useState(false);
  const [savedFE, setSavedFE] = useState(false);
  const [activeGroup, setActiveGroup] = useState('A');
  const [scorers, setScorers] = useState([]);
  const [savingScorer, setSavingScorer] = useState({});
  const [savedScorer, setSavedScorer] = useState({});

  // Check for an existing valid session on mount
  useEffect(() => {
    fetch('/api/admin/auth').then(r => { if (r.ok) setAuthed(true); });
  }, []);

  const handleLogin = async () => {
    setLogging(true);
    setPwError(false);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwInput }),
      });
      if (res.ok) setAuthed(true);
      else { setPwError(true); setPwInput(''); }
    } catch {
      setPwError(true);
    } finally {
      setLogging(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setAuthed(false);
    setPwInput('');
  };

  useEffect(() => {
    if (!authed) return;
    fetch('/api/matches').then(r => r.json()).then(data => setMatches(Array.isArray(data) ? data : (data.matches ?? [])));
    fetch('/api/admin/actual_groups').then(r => r.json()).then(data => {
      const mapped = Object.keys(TOURNAMENT_GROUPS).map(g => ({
        group_name: g, actual_1st: '', actual_2nd: '', actual_3rd: ''
      }));
      if (data?.length) {
        data.forEach(d => {
          const idx = mapped.findIndex(x => x.group_name === d.group_name);
          if (idx >= 0) {
            mapped[idx].actual_1st = d.actual_1st || '';
            mapped[idx].actual_2nd = d.actual_2nd || '';
            mapped[idx].actual_3rd = d.actual_3rd || '';
          }
        });
      }
      setGroups(mapped);
    });
    fetch('/api/admin/actual_finaleight').then(r => r.json()).then(data => {
      if (data) setActualFE(prev => ({ ...prev, ...data }));
    });
  }, [authed]);

  const handleMatchScore = async (match) => {
    if (!confirm(`Confirm: finalise ${match.team_home} ${match.actual_home_score}–${match.actual_away_score} ${match.team_away}? This will update everyone's scores.`)) return;
    let outcome = 'draw';
    if (match.actual_home_score > match.actual_away_score) outcome = 'home';
    else if (match.actual_away_score > match.actual_home_score) outcome = 'away';
    setSavingMatches(prev => ({ ...prev, [match.id]: 'saving' }));
    await fetch('/api/admin/actual_matches', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: match.id, actual_home_score: match.actual_home_score, actual_away_score: match.actual_away_score, actual_outcome: outcome })
    });
    setSavingMatches(prev => ({ ...prev, [match.id]: 'done' }));
    setTimeout(() => setSavingMatches(prev => { const n = { ...prev }; delete n[match.id]; return n; }), 2000);
    fetch('/api/matches').then(r => r.json()).then(data => setMatches(Array.isArray(data) ? data : (data.matches ?? [])));
  };

  const updateMatchField = (id, field, value) => {
    setMatches(prev => prev.map(m => m.id === id ? { ...m, [field]: value === '' ? null : Number(value) } : m));
  };

  const handleGroupSave = async (g) => {
    const selected = [g.actual_1st, g.actual_2nd, g.actual_3rd].filter(Boolean);
    const unique = new Set(selected);
    if (unique.size !== selected.length) { alert('⚠️ Same team cannot be in multiple positions!'); return; }
    setSavingGroups(prev => ({ ...prev, [g.group_name]: 'saving' }));
    await fetch('/api/admin/actual_groups', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(g)
    });
    setSavingGroups(prev => ({ ...prev, [g.group_name]: 'done' }));
    setTimeout(() => setSavingGroups(prev => { const n = { ...prev }; delete n[g.group_name]; return n; }), 2000);
  };

  const updateGroupField = (idx, field, value) => {
    const n = [...groups];
    n[idx][field] = value;
    setGroups(n);
  };

  const handleFESave = async () => {
    setSavingFE(true);
    await fetch('/api/admin/actual_finaleight', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actualFE)
    });
    setSavingFE(false);
    setSavedFE(true);
    setTimeout(() => setSavedFE(false), 2500);
  };

  // ── Login screen ──
  if (!authed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
        <div style={{ fontSize: '3rem' }}>🗝️</div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Admin Access Required</h1>
        <p style={{ color: 'var(--text-secondary)' }}>This page is restricted to tournament administrators.</p>
        <div className="glass-card" style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="password"
            className="input-field"
            placeholder="Enter admin password..."
            value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError(false); }}
            onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
            style={{ borderColor: pwError ? '#ef4444' : undefined }}
          />
          {pwError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '-8px' }}>Incorrect password.</p>}
          <button
            className="btn-primary"
            onClick={handleLogin}
            disabled={logging}
          >
            {logging ? 'Verifying…' : 'Unlock Admin Hub'}
          </button>
        </div>
      </div>
    );
  }

  const groupsForTab = Object.keys(TOURNAMENT_GROUPS);
  const activeGroupData = groups.find(g => g.group_name === activeGroup);
  const activeGroupIdx = groups.findIndex(g => g.group_name === activeGroup);
  const matchesForGroup = matches.filter(m => m.group_name === activeGroup);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <h1 className="page-title-danger" style={{ margin: 0 }}>⚠️ Admin Hub</h1>
        <button onClick={handleLogout} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
          Lock 🔒
        </button>
      </div>
      <p className="page-subtitle">Changes here update official results and recalculate everyone's scores instantly.</p>

      {/* Group tab selector */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {groupsForTab.map(g => (
          <button key={g} onClick={() => setActiveGroup(g)} style={{
            padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            background: activeGroup === g ? '#ef4444' : 'var(--surface)',
            color: activeGroup === g ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${activeGroup === g ? '#ef4444' : 'var(--border)'}`,
            transition: 'all 0.15s ease',
          }}>Group {g}</button>
        ))}
        <button onClick={() => setActiveGroup('AWARDS')} style={{
          padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
          background: activeGroup === 'AWARDS' ? '#ef4444' : 'var(--surface)',
          color: activeGroup === 'AWARDS' ? 'white' : 'var(--text-secondary)',
          border: `1px solid ${activeGroup === 'AWARDS' ? '#ef4444' : 'var(--border)'}`,
        }}>🏆 Awards</button>
        <button onClick={() => {
          setActiveGroup('SCORERS');
          if (scorers.length === 0) {
            fetch('/api/admin/actual_goalscorers').then(r => r.json()).then(data => setScorers(data || []));
          }
        }} style={{
          padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
          background: activeGroup === 'SCORERS' ? '#ef4444' : 'var(--surface)',
          color: activeGroup === 'SCORERS' ? 'white' : 'var(--text-secondary)',
          border: `1px solid ${activeGroup === 'SCORERS' ? '#ef4444' : 'var(--border)'}`,
        }}>⚽ Goalscorers</button>
      </div>

      {activeGroup !== 'AWARDS' && activeGroupData && (
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>

          {/* Group standings */}
          <div style={{ flex: '0 0 280px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '1.1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Group {activeGroup} Standings</h2>
            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[['actual_1st', '🥇 1st Place'], ['actual_2nd', '🥈 2nd Place'], ['actual_3rd', '🥉 3rd Place']].map(([field, label]) => (
                <div key={field}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    <span>{label}</span>
                    {activeGroupData[field] && <Flag team={activeGroupData[field]} style={{ marginRight: 0, marginLeft: '4px', height: '11px' }} />}
                  </label>
                  <select className="input-field" style={{ padding: '8px' }}
                    value={activeGroupData[field]}
                    onChange={e => updateGroupField(activeGroupIdx, field, e.target.value)}
                  >
                    <option value="">-- Not set --</option>
                    {TOURNAMENT_GROUPS[activeGroup].map(t => (
                      <option key={t} value={t}
                        disabled={
                          (field !== 'actual_1st' && activeGroupData.actual_1st === t) ||
                          (field !== 'actual_2nd' && activeGroupData.actual_2nd === t) ||
                          (field !== 'actual_3rd' && activeGroupData.actual_3rd === t)
                        }
                      >{t}</option>
                    ))}
                  </select>
                </div>
              ))}
              <button
                onClick={() => handleGroupSave(activeGroupData)}
                style={{
                  width: '100%', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                  background: savingGroups[activeGroup] === 'done' ? '#10B981' : '#ef4444',
                  color: 'white', border: 'none', transition: 'all 0.2s',
                }}
              >
                {savingGroups[activeGroup] === 'done' ? '✅ Saved!' : savingGroups[activeGroup] === 'saving' ? 'Saving...' : 'Set Group Result'}
              </button>
            </div>
          </div>

          {/* Match results for this group */}
          <div style={{ flex: 1, minWidth: 320 }}>
            <h2 style={{ marginBottom: '16px', fontSize: '1.1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Group {activeGroup} Matches</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {matchesForGroup.map(m => (
                <div key={m.id} className="glass-card" style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Match #{m.id}</span>
                    <span style={{ color: m.status === 'completed' ? '#10B981' : 'var(--text-secondary)', fontWeight: 600 }}>
                      {m.status === 'completed' ? '✅ DONE' : 'PENDING'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ width: '38%', textAlign: 'right', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{m.team_home}</span>
                      <Flag team={m.team_home} style={{ marginRight: 0, marginLeft: 0 }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="number" min="0" max="20" style={{ width: '52px', padding: '8px', textAlign: 'center', fontWeight: 'bold' }} className="input-field"
                        value={m.actual_home_score ?? ''} onChange={e => updateMatchField(m.id, 'actual_home_score', e.target.value)} />
                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>–</span>
                      <input type="number" min="0" max="20" style={{ width: '52px', padding: '8px', textAlign: 'center', fontWeight: 'bold' }} className="input-field"
                        value={m.actual_away_score ?? ''} onChange={e => updateMatchField(m.id, 'actual_away_score', e.target.value)} />
                    </div>
                    <div style={{ width: '38%', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '4px' }}>
                      <Flag team={m.team_away} style={{ marginRight: 0, marginLeft: 0 }} />
                      <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{m.team_away}</span>
                    </div>
                  </div>
                  <button onClick={() => handleMatchScore(m)} style={{
                    width: '100%', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
                    background: savingMatches[m.id] === 'done' ? '#10B981' : '#ef4444',
                    color: 'white', border: 'none', transition: 'all 0.2s',
                  }}>
                    {savingMatches[m.id] === 'done' ? '✅ Committed' : savingMatches[m.id] === 'saving' ? 'Saving...' : 'Commit Official Score'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeGroup === 'AWARDS' && (
        <div style={{ maxWidth: 580 }}>
          <h2 style={{ marginBottom: '16px', fontSize: '1.1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tournament Awards & Final Eight</h2>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {[
              { field: 'winner', label: '🥇 Champion' },
              { field: 'silver', label: '🥈 Runner-up' },
              { field: 'bronze', label: '🥉 Third Place' },
              { field: 'fourth', label: '4️⃣ Fourth Place' },
              { field: 'qf1', label: '⚔️ Quarterfinalist 1' },
              { field: 'qf2', label: '⚔️ Quarterfinalist 2' },
              { field: 'qf3', label: '⚔️ Quarterfinalist 3' },
              { field: 'qf4', label: '⚔️ Quarterfinalist 4' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <span>{label}</span>
                  {actualFE[field] && <Flag team={actualFE[field]} style={{ marginRight: 0, marginLeft: '4px', height: '11px' }} />}
                </label>
                <select className="input-field" style={{ padding: '8px' }} value={actualFE[field] || ''} onChange={e => setActualFE({ ...actualFE, [field]: e.target.value })}>
                  <option value="">-- Not set --</option>
                  {ALL_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            ))}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>👟 Actual Golden Boot (Player)</label>
                <input className="input-field" value={actualFE.top_scorer || ''} onChange={e => setActualFE({ ...actualFE, top_scorer: e.target.value })} placeholder="Player name..." />
              </div>
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Shared Golden Boot count (if tied)</label>
                <input type="number" min="1" className="input-field" value={actualFE.shared_top_scorer_count || 1} onChange={e => setActualFE({ ...actualFE, shared_top_scorer_count: Number(e.target.value) })} style={{ width: '100px' }} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  <span>🌍 Actual Top Scoring Country (10 pts)</span>
                  {actualFE.top_country && <Flag team={actualFE.top_country} style={{ marginRight: 0, marginLeft: '4px', height: '11px' }} />}
                </label>
                <select className="input-field" style={{ padding: '8px' }} value={actualFE.top_country || ''} onChange={e => setActualFE({ ...actualFE, top_country: e.target.value })}>
                  <option value="">-- Not set --</option>
                  {ALL_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Shared count (if tied)</label>
                <input type="number" min="1" className="input-field" value={actualFE.shared_top_country_count || 1} onChange={e => setActualFE({ ...actualFE, shared_top_country_count: Number(e.target.value) })} style={{ width: '100px' }} />
              </div>
            </div>

            <button
              onClick={handleFESave}
              className="btn-primary"
              style={{ background: savedFE ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#ef4444,#b91c1c)', marginTop: '8px' }}
            >
              {savedFE ? '✅ Awards Saved!' : savingFE ? 'Saving...' : 'Commit All Award Results'}
            </button>
          </div>
        </div>
      )}

      {activeGroup === 'SCORERS' && (
        <div style={{ maxWidth: 560 }}>
          <h2 style={{ marginBottom: '8px', fontSize: '1.1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goalscorer Points</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Update running goal totals — leaderboard recalculates instantly. Only players picked by at least one participant are shown.
          </p>
          {scorers.length === 0 ? (
            <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              No goalscorer predictions submitted yet — check back once participants have made their picks.
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {scorers.map(s => (
                <div key={s.player_name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>{s.player_name}</span>
                  <input
                    type="number" min="0" max="20"
                    className="input-field"
                    style={{ width: '64px', textAlign: 'center', padding: '7px', fontWeight: 700 }}
                    value={s.goals}
                    onChange={e => setScorers(prev => prev.map(p => p.player_name === s.player_name ? { ...p, goals: Number(e.target.value) } : p))}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', width: '32px' }}>goal{s.goals !== 1 ? 's' : ''}</span>
                  <button
                    onClick={async () => {
                      setSavingScorer(prev => ({ ...prev, [s.player_name]: true }));
                      await fetch('/api/admin/actual_goalscorers', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ player_name: s.player_name, goals: s.goals }),
                      });
                      setSavingScorer(prev => ({ ...prev, [s.player_name]: false }));
                      setSavedScorer(prev => ({ ...prev, [s.player_name]: true }));
                      setTimeout(() => setSavedScorer(prev => ({ ...prev, [s.player_name]: false })), 2000);
                    }}
                    style={{
                      padding: '7px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem',
                      border: 'none', cursor: 'pointer', minWidth: '72px',
                      background: savedScorer[s.player_name] ? '#10B981' : '#ef4444',
                      color: 'white', transition: 'background 0.2s',
                    }}
                  >
                    {savingScorer[s.player_name] ? '...' : savedScorer[s.player_name] ? '✅ Saved' : 'Save'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

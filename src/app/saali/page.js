'use client';
import { useState, useEffect, useRef } from 'react';
import Flag from '../components/Flag';
import AuthModal from '../components/AuthModal';

const localDateKey = (d) => d.toLocaleDateString('sv-SE');

function SaaliCommunityPredictions({ matchId, teamHome, teamAway, kickoffTime, status }) {
  const [preds, setPreds] = useState(null);
  const [loading, setLoading] = useState(false);
  const hasStarted = status !== 'pending' || new Date(kickoffTime) <= new Date();

  const load = async () => {
    if (!hasStarted) return;
    if (preds !== null) { setPreds(null); return; }
    setLoading(true);
    const res = await fetch(`/api/saali/match_predictions?matchId=${matchId}`);
    setPreds(await res.json());
    setLoading(false);
  };

  const scoreCounts = {};
  if (preds) {
    preds.forEach(p => {
      if (p.predicted_home_score !== null && p.predicted_away_score !== null) {
        const key = `${p.predicted_home_score}-${p.predicted_away_score}`;
        scoreCounts[key] = scoreCounts[key] || [];
        scoreCounts[key].push(p.username);
      }
    });
  }
  const sortedScores = Object.entries(scoreCounts).sort((a, b) => b[1].length - a[1].length);
  const totalPredicted = preds ? preds.filter(p => p.predicted_home_score !== null).length : 0;

  return (
    <div style={{ marginTop: '12px' }}>
      <button
        onClick={load}
        style={{
          width: '100%', padding: '8px',
          background: hasStarted ? 'transparent' : 'rgba(0,0,0,0.15)',
          border: `1px solid ${hasStarted ? 'var(--border)' : 'rgba(255,255,255,0.05)'}`,
          borderRadius: '8px',
          color: hasStarted ? 'var(--text-secondary)' : 'rgba(255,255,255,0.2)',
          fontSize: '0.85rem', cursor: hasStarted ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}
        onMouseEnter={e => { if (hasStarted) e.currentTarget.style.borderColor = 'var(--primary)'; }}
        onMouseLeave={e => { if (hasStarted) e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        {!hasStarted ? '🔒 Visible after kickoff'
          : loading ? '⏳ Loading...'
          : preds !== null ? '▲ Hide Community Picks'
          : '👁 See What Others Predicted'}
      </button>

      {preds !== null && (
        <div style={{ marginTop: '10px', background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: '1px solid var(--border)' }}>
          {totalPredicted === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>No predictions submitted.</p>
          ) : (
            <>
              {sortedScores.map(([score, users]) => {
                const pct = Math.round((users.length / totalPredicted) * 100);
                const [h, a] = score.split('-');
                const outcome = Number(h) > Number(a) ? teamHome : Number(a) > Number(h) ? teamAway : 'Draw';
                return (
                  <div key={score} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: 'white' }}>{score} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({outcome})</span></span>
                      <span style={{ color: 'var(--text-secondary)' }}>{users.join(', ')} · {pct}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #818cf8)', borderRadius: '999px' }} />
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function groupByDate(matches) {
  const g = {};
  for (const m of matches) {
    const k = localDateKey(new Date(m.kickoff_time));
    if (!g[k]) g[k] = [];
    g[k].push(m);
  }
  return g;
}

export default function SaaliPage() {
  const [isAdmin, setIsAdmin] = useState(null); // null = loading
  const [userId, setUserId] = useState(null);
  const [userPin, setUserPin] = useState(null);
  const [matches, setMatches] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const todayRef = useRef(null);

  useEffect(() => {
    fetch('/api/admin/auth').then(r => setIsAdmin(r.ok));
  }, []);

  useEffect(() => {
    if (isAdmin === null) return;
    const id = localStorage.getItem('simUserId');
    const pin = localStorage.getItem('simUserPin');
    if (id) {
      setUserId(Number(id));
      setUserPin(pin);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const id = localStorage.getItem('simUserId');
    fetch(`/api/saali/matches${id ? `?userId=${id}` : ''}`)
      .then(r => r.json())
      .then(data => setMatches(Array.isArray(data) ? data : []));
  }, [isAdmin]);

  const handleScoreChange = (matchId, field, value) => {
    setMatches(prev => prev.map(m => {
      if (m.id !== matchId) return m;
      const updated = { ...m, [field]: value === '' ? null : Number(value) };
      if (updated.predicted_home_score != null && updated.predicted_away_score != null) {
        const h = updated.predicted_home_score;
        const a = updated.predicted_away_score;
        updated.predicted_outcome = h > a ? 'home' : a > h ? 'away' : 'draw';
      }
      return updated;
    }));
  };

  const savePrediction = async (m) => {
    if (!userId || !userPin) { setShowAuthModal(true); return; }
    if (m.predicted_home_score == null || m.predicted_away_score == null) return;
    setSavingId(m.id);
    try {
      const res = await fetch('/api/saali/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: userId,
          pin: userPin,
          match_id: m.id,
          predicted_home_score: m.predicted_home_score,
          predicted_away_score: m.predicted_away_score,
          predicted_outcome: m.predicted_outcome,
        }),
      });
      if (res.ok) {
        setSavedId(m.id);
        setTimeout(() => setSavedId(null), 2000);
      }
    } finally {
      setSavingId(null);
    }
  };

  // Loading state
  if (isAdmin === null) return null;

  // Not admin — show nothing
  if (!isAdmin) return null;

  const now = new Date();
  const completed = matches.filter(m => m.status === 'completed' || m.status === 'in_progress');
  const cutoffFor = (m) => new Date(new Date(m.kickoff_time).getTime() - 15 * 60 * 1000);
  const upcoming = matches.filter(m => m.status === 'pending' && cutoffFor(m) > now);
  const locked = matches.filter(m => m.status === 'pending' && cutoffFor(m) <= now);

  const today = localDateKey(now);
  const upcomingByDate = groupByDate([...locked, ...upcoming]);
  const upcomingDateKeys = Object.keys(upcomingByDate).sort();

  const totalPredicted = upcoming.filter(m => m.predicted_outcome).length;

  const renderCompletedCard = (m) => {
    const exact = m.predicted_home_score === m.actual_home_score && m.predicted_away_score === m.actual_away_score;
    const outcomeOk = m.predicted_outcome === m.actual_outcome;
    const pts = (outcomeOk ? 1 : 0) + (exact ? 2 : 0);
    const dateLabel = new Date(m.kickoff_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

    return (
      <div key={m.id} className="glass-card" style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '10px' }}>
          <span style={{ padding: '2px 8px', background: 'rgba(94,106,210,0.12)', borderRadius: 12, color: 'var(--primary)', fontWeight: 700 }}>
            {m.group_name ? `Group ${m.group_name}` : 'Knockout'}
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>{dateLabel}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
          <div style={{ flex: 1, fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', minWidth: 0 }}>
            <span style={{ textAlign: 'right', lineHeight: '1.2' }}>{m.team_home}</span>
            <Flag team={m.team_home} style={{ marginRight: 0, marginLeft: 0 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 6px', flexShrink: 0 }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', minWidth: '22px', textAlign: 'center' }}>{m.actual_home_score}</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>–</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', minWidth: '22px', textAlign: 'center' }}>{m.actual_away_score}</span>
          </div>
          <div style={{ flex: 1, fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '5px', minWidth: 0 }}>
            <Flag team={m.team_away} style={{ marginRight: 0, marginLeft: 0 }} />
            <span style={{ lineHeight: '1.2' }}>{m.team_away}</span>
          </div>
        </div>
        {m.predicted_outcome ? (
          <div style={{ padding: '6px 10px', borderRadius: '7px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', background: pts > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.07)', border: `1px solid ${pts > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}` }}>
            <span style={{ color: 'var(--text-secondary)' }}>Pick: <strong style={{ color: 'white' }}>{m.predicted_home_score}–{m.predicted_away_score}</strong></span>
            <span style={{ fontWeight: 700, color: pts > 0 ? '#10B981' : '#ef4444' }}>
              {pts > 0 ? `+${pts} pt${pts > 1 ? 's' : ''}` : '0 pts'}{exact ? ' ✨' : outcomeOk ? ' ✓' : ''}
            </span>
          </div>
        ) : (
          <div style={{ padding: '6px 10px', borderRadius: '7px', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', textAlign: 'center' }}>
            No prediction
          </div>
        )}
        <SaaliCommunityPredictions matchId={m.id} teamHome={m.team_home} teamAway={m.team_away} kickoffTime={m.kickoff_time} status={m.status} />
      </div>
    );
  };

  const renderUpcomingCard = (m) => {
    const kickoffDate = new Date(m.kickoff_time);
    const cutoff = new Date(kickoffDate.getTime() - 15 * 60 * 1000);
    const isLocked = m.status !== 'pending' || cutoff <= now;

    return (
      <div key={m.id} className="glass-card" style={{ padding: '18px', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '14px' }}>
          <span style={{ padding: '2px 8px', background: 'rgba(94,106,210,0.15)', borderRadius: 12, color: 'var(--primary)', fontWeight: 700 }}>
            {m.group_name ? `Group ${m.group_name}` : 'Knockout'}
          </span>
          <span style={{ color: isLocked ? '#ef4444' : 'var(--text-secondary)' }}>
            {isLocked ? '🔒 Locked' : kickoffDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', marginBottom: '14px' }}>
          <div style={{ flex: 1, fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', minWidth: 0 }}>
            <span style={{ textAlign: 'right', wordBreak: 'break-word', lineHeight: '1.2' }}>{m.team_home}</span>
            <Flag team={m.team_home} style={{ marginRight: 0, marginLeft: 0 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '0 4px', flexShrink: 0 }}>
            <input type="number" min="0" max="20" className="input-field" disabled={isLocked}
              style={{ width: '48px', minHeight: '44px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold', padding: '6px 2px', opacity: isLocked ? 0.45 : 1, cursor: isLocked ? 'not-allowed' : 'auto' }}
              value={m.predicted_home_score ?? ''} onChange={e => handleScoreChange(m.id, 'predicted_home_score', e.target.value)} />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>–</span>
            <input type="number" min="0" max="20" className="input-field" disabled={isLocked}
              style={{ width: '48px', minHeight: '44px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold', padding: '6px 2px', opacity: isLocked ? 0.45 : 1, cursor: isLocked ? 'not-allowed' : 'auto' }}
              value={m.predicted_away_score ?? ''} onChange={e => handleScoreChange(m.id, 'predicted_away_score', e.target.value)} />
          </div>
          <div style={{ flex: 1, fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '5px', minWidth: 0 }}>
            <Flag team={m.team_away} style={{ marginRight: 0, marginLeft: 0 }} />
            <span style={{ wordBreak: 'break-word', lineHeight: '1.2' }}>{m.team_away}</span>
          </div>
        </div>
        <button className="btn-primary" disabled={isLocked} onClick={() => !isLocked && savePrediction(m)}
          style={{
            width: '100%',
            background: isLocked ? 'rgba(255,255,255,0.06)' : savedId === m.id ? 'linear-gradient(135deg, #10B981, #059669)' : undefined,
            color: isLocked ? 'var(--text-secondary)' : undefined,
            cursor: isLocked ? 'not-allowed' : 'pointer',
            transform: savingId === m.id ? 'scale(0.98)' : undefined,
          }}>
          {isLocked
            ? m.predicted_outcome ? `Your pick: ${m.predicted_home_score}–${m.predicted_away_score}` : '🔒 Predictions closed'
            : savingId === m.id ? 'Saving...'
              : savedId === m.id ? '✅ Saved!'
                : m.predicted_outcome ? 'Update Score' : 'Lock in Score'}
        </button>
        <SaaliCommunityPredictions matchId={m.id} teamHome={m.team_home} teamAway={m.team_away} kickoffTime={m.kickoff_time} status={m.status} />
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title" style={{ marginBottom: '6px' }}>🏅 Säälipleijarit</h1>
        <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          1 pt outcome · 2 pts extra for exact score · locks at kickoff
          {upcoming.length > 0 && (
            <span style={{ padding: '3px 12px', background: 'rgba(94,106,210,0.15)', borderRadius: 20, fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 700 }}>
              {totalPredicted}/{upcoming.length} upcoming predicted
            </span>
          )}
          {upcomingDateKeys.some(k => k === today) && (
            <button onClick={() => todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              style={{ padding: '3px 12px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, fontSize: '0.82rem', color: '#10B981', fontWeight: 700, cursor: 'pointer' }}>
              ↓ Jump to Today
            </button>
          )}
        </p>
      </div>

      {!userId && (
        <div style={{ padding: '16px 20px', marginBottom: '24px', background: 'rgba(94,106,210,0.08)', border: '1px solid rgba(94,106,210,0.2)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sign in to make predictions</span>
          <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }} onClick={() => setShowAuthModal(true)}>Sign In</button>
        </div>
      )}

      {/* Upcoming matches (predictable) */}
      {upcomingDateKeys.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', padding: '3px 10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, color: '#10B981', fontWeight: 700 }}>OPEN</span>
            Upcoming Matches
          </h2>
          {upcomingDateKeys.map(dateKey => {
            const isToday = dateKey === today;
            const label = new Date(dateKey + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
            return (
              <div key={dateKey} ref={isToday ? todayRef : null} style={{ marginBottom: '28px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isToday ? '#10B981' : 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {label}
                  {isToday && <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(16,185,129,0.15)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.3)' }}>TODAY</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                  {upcomingByDate[dateKey].map(renderUpcomingCard)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {upcomingDateKeys.length === 0 && (
        <div style={{ padding: '24px', marginBottom: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          No upcoming matches to predict yet. Check back once the knockout stage fixtures are confirmed.
        </div>
      )}

      {/* Completed matches (read-only) */}
      {completed.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', padding: '3px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text-secondary)', fontWeight: 700 }}>DONE</span>
            Completed Matches
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
            {[...completed].reverse().map(renderCompletedCard)}
          </div>
        </div>
      )}

      {showAuthModal && <AuthModal onLoginSuccess={(id, name, pin) => {
        setUserId(id);
        setUserPin(pin);
        setShowAuthModal(false);
      }} />}
    </div>
  );
}

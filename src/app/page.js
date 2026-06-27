'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Flag from './components/Flag';
import AuthModal from './components/AuthModal';

// ─── Community Predictions (unchanged) ──────────────────────────────────────

function CommunityPredictions({ matchId, teamHome, teamAway, kickoffTime, status, tournamentLocked }) {
  const [preds, setPreds] = useState(null);
  const [loading, setLoading] = useState(false);
  const hasStarted = tournamentLocked || status === 'completed' || new Date(kickoffTime) <= new Date();

  const load = async () => {
    if (!hasStarted) return;
    if (preds !== null) { setPreds(null); return; }
    setLoading(true);
    const res = await fetch(`/api/match_predictions?matchId=${matchId}`);
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
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { if (hasStarted) e.currentTarget.style.borderColor = 'var(--primary)'; }}
        onMouseLeave={e => { if (hasStarted) e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        {!hasStarted ? '🔒 Predictions locked until kickoff'
          : loading ? '⏳ Loading...'
          : preds !== null ? '▲ Hide Community Picks'
          : '👁 See What Others Predicted'}
      </button>

      {preds !== null && (
        <div style={{ marginTop: '10px', background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: '1px solid var(--border)', animation: 'fadeIn 0.2s ease' }}>
          {totalPredicted === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>No predictions submitted yet.</p>
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
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #818cf8)', borderRadius: '999px', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
              {preds.filter(p => p.predicted_home_score === null).length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  ⏳ Not predicted yet: {preds.filter(p => p.predicted_home_score === null).map(p => p.username).join(', ')}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar: Mini Leaderboard ───────────────────────────────────────────────

const formatPts = (val) => { const n = parseFloat(val) || 0; return n % 1 === 0 ? String(n) : n.toFixed(1); };

function MiniLeaderboard({ board, userId }) {
  const medals = ['🏆', '🥈', '🥉'];
  const miniRanks = [];
  board.forEach((row, i) => {
    if (i === 0) { miniRanks.push(1); return; }
    const prev = parseFloat(board[i - 1].total_points);
    const cur = parseFloat(row.total_points);
    miniRanks.push(cur === prev ? miniRanks[i - 1] : i + 1);
  });
  return (
    <div className="glass-card" style={{ padding: '20px', marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>Standings</h3>
        <Link href="/leaderboard" style={{ fontSize: '0.78rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
          Full table →
        </Link>
      </div>
      {board.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0, fontStyle: 'italic' }}>No scores yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {(() => {
            const top3 = board.slice(0, 3);
            const myIndex = board.findIndex(r => r.participant_id === userId);
            const rows = myIndex > 2 ? [...top3, board[myIndex]] : top3;
            return rows;
          })().map((row, i, arr) => {
            const isMe = row.participant_id === userId;
            const i2 = board.findIndex(r => r.participant_id === row.participant_id);
            const total = parseFloat(row.total_points) || 0;
            return (
              <div key={row.participant_id}>
                {isMe && i2 > 2 && <div style={{ borderTop: '1px dashed var(--border)', margin: '4px 0' }} />}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px', borderRadius: '8px',
                  background: isMe ? 'rgba(94,106,210,0.12)' : 'transparent',
                  boxShadow: isMe ? 'inset 2px 0 0 var(--primary)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', width: '18px', textAlign: 'center' }}>
                      {miniRanks[i2] <= 3 ? medals[miniRanks[i2] - 1] : `#${miniRanks[i2]}`}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: isMe ? 700 : 500, color: isMe ? 'white' : 'var(--text-secondary)' }}>
                      {row.username}
                      {isMe && <span style={{ marginLeft: 5, fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700 }}>you</span>}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: miniRanks[i2] === 1 ? '#F59E0B' : 'var(--primary)' }}>
                    {formatPts(total)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar: Prediction Stats ───────────────────────────────────────────────

function PredictionStats({ matches }) {
  if (!matches.length) return null;
  const now = new Date();
  const total = matches.length;
  const predicted = matches.filter(m => m.predicted_outcome).length;
  const completed = matches.filter(m => m.status === 'completed').length;
  const stillOpen = matches.filter(m => m.status !== 'completed' && new Date(m.kickoff_time) > now && !m.predicted_outcome).length;
  const pct = Math.round((predicted / total) * 100);

  return (
    <div className="glass-card" style={{ padding: '20px', marginBottom: '14px' }}>
      <h3 style={{ margin: '0 0 14px 0', fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>Your Picks</h3>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Predicted</span>
          <span style={{ color: 'white', fontWeight: 700 }}>{predicted}/{total}</span>
        </div>
        <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #818cf8)', borderRadius: 999, transition: 'width 0.5s ease' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.77rem' }}>
        {completed > 0 && <span style={{ color: '#10B981' }}>✅ {completed} match{completed !== 1 ? 'es' : ''} completed</span>}
        {stillOpen > 0 && (() => {
          const openMatches = matches.filter(m => m.status !== 'completed' && new Date(m.kickoff_time) > now && !m.predicted_outcome);
          return (
            <span style={{ color: '#F59E0B' }}>
              ⚡ {stillOpen} match{stillOpen !== 1 ? 'es' : ''} still to predict
              {stillOpen === 1 && openMatches[0] && (
                <span style={{ color: 'rgba(245,158,11,0.75)', fontWeight: 400 }}> · {openMatches[0].team_home} vs {openMatches[0].team_away}</span>
              )}
            </span>
          );
        })()}
        {stillOpen === 0 && predicted > 0 && completed < total && (
          <span style={{ color: '#10B981' }}>✅ All open matches predicted!</span>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar: Quick Links ────────────────────────────────────────────────────

function QuickLinks() {
  return (
    <div className="glass-card" style={{ padding: '16px 20px' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>Also predict</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {[
          { href: '/finaleight', icon: '⚔️', label: 'Final Eight + Winner' },
          { href: '/goalscorers', icon: '⚽', label: 'Top Scorers' },
          { href: '/groups', icon: '🏟', label: 'Group Standings' },
          { href: '/leaderboard', icon: '🏆', label: 'Full Leaderboard' },
        ].map(({ href, icon, label }) => (
          <Link key={href} href={href} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '7px 10px', borderRadius: '8px',
            color: 'var(--text-secondary)', textDecoration: 'none',
            fontSize: '0.82rem', fontWeight: 500,
            transition: 'all 0.15s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(94,106,210,0.1)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <span>{icon}</span> {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function localDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function groupByDate(matches) {
  const map = {};
  matches.forEach(m => {
    const key = localDateKey(m.kickoff_time);
    if (!map[key]) map[key] = [];
    map[key].push(m);
  });
  return map;
}

function groupByGroup(matches) {
  const map = {};
  matches.forEach(m => {
    const key = m.group_name;
    if (!map[key]) map[key] = [];
    map[key].push(m);
  });
  return map;
}

function dateLabel(dateKey) {
  const d = new Date(dateKey + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function relativeDay(dateKey) {
  const today = localDateKey(new Date());
  const tomorrow = localDateKey(new Date(Date.now() + 86400000));
  if (dateKey === today) return { label: 'TODAY', color: '#10B981' };
  if (dateKey === tomorrow) return { label: 'TOMORROW', color: '#F59E0B' };
  if (dateKey < today) return { label: 'DONE', color: 'rgba(255,255,255,0.25)' };
  return null;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MatchesDashboard() {
  const [matches, setMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userId, setUserId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [openSections, setOpenSections] = useState({});
  const [wide, setWide] = useState(true);
  const [tournamentLocked, setTournamentLocked] = useState(false);
  const [userExempt, setUserExempt] = useState(false);
  const [viewMode, setViewMode] = useState('date');
  const [openGroupSections, setOpenGroupSections] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshState, setRefreshState] = useState('idle'); // idle | loading | done | error
  const [lastRefresh, setLastRefresh] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const todayRef = useRef(null);

  useEffect(() => {
    if (!lastRefresh) return;
    const tick = () => {
      const secs = Math.max(0, 60 - Math.floor((Date.now() - lastRefresh) / 1000));
      setCooldown(secs);
      if (secs === 0) clearInterval(id);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastRefresh]);

  useEffect(() => {
    const check = () => setWide(window.innerWidth >= 960);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const id = localStorage.getItem('simUserId');
    if (id) { setUserId(Number(id)); fetchMatches(id); }
    fetch(`/api/tournament/status${id ? `?userId=${id}` : ''}`).then(r => r.json()).then(d => setTournamentLocked(d.locked));
    fetch('/api/leaderboard').then(r => r.json()).then(d => setLeaderboard(d || []));
    fetch('/api/admin/auth').then(r => { if (r.ok) setIsAdmin(true); });
  }, []);

  // Poll every 60s while any match is in_progress so the card auto-flips to completed
  useEffect(() => {
    if (!userId) return;
    const hasLive = matches.some(m => m.status === 'in_progress');
    if (!hasLive) return;
    const timer = setInterval(() => fetchMatches(userId), 60_000);
    return () => clearInterval(timer);
  }, [matches, userId]);

  // Open future/today sections, collapse past by default
  useEffect(() => {
    if (!matches.length) return;
    const today = localDateKey(new Date());
    const grouped = groupByDate(matches);
    const initial = {};
    Object.keys(grouped).forEach(key => { initial[key] = key >= today; });
    setOpenSections(initial);
  }, [matches.length]);

  const fetchMatches = async (id) => {
    const res = await fetch(`/api/matches?userId=${id}`);
    const data = await res.json();
    const rows = Array.isArray(data) ? data : (data.matches ?? []);
    setUserExempt(!Array.isArray(data) && (data.exempt ?? false));
    setMatches(rows.map(m => ({
      ...m,
      predicted_home_score: m.predicted_home_score ?? (m.group_name ? 0 : null),
      predicted_away_score: m.predicted_away_score ?? (m.group_name ? 0 : null),
    })));
  };

  const handleScoreChange = (match_id, type, value) => {
    setMatches(prev => prev.map(m =>
      m.id === match_id ? { ...m, [type]: value === '' ? null : Number(value) } : m
    ));
  };

  const savePrediction = async (match) => {
    if (!userId) return;
    let h = match.predicted_home_score;
    let a = match.predicted_away_score;
    if (h === null || h === undefined || h === '' || Number.isNaN(h) ||
        a === null || a === undefined || a === '' || Number.isNaN(a)) {
      alert('Please enter both scores.'); return;
    }
    h = Number(h); a = Number(a);
    const outcome = h > a ? 'home' : a > h ? 'away' : 'draw';
    setSavingId(match.id);
    setMatches(prev => prev.map(m => m.id === match.id ? { ...m, predicted_outcome: outcome } : m));
    const pin = localStorage.getItem('simUserPin');
    const res = await fetch('/api/matches', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant_id: userId, pin, match_id: match.id, predicted_home_score: h, predicted_away_score: a, predicted_outcome: outcome }),
    });
    if (!res.ok) { const d = await res.json(); alert(d.error || 'Failed to save'); }
    setSavingId(null);
    setSavedId(match.id);
    setTimeout(() => setSavedId(null), 2000);
    fetchMatches(userId);
    fetch('/api/leaderboard').then(r => r.json()).then(d => setLeaderboard(d || []));
  };

  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Not logged in ──
  if (!userId) return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ marginBottom: '40px', animation: 'fadeIn 0.5s ease-out' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '16px' }}>🏆</span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: 'white', margin: '0 0 16px 0', letterSpacing: '-1px', lineHeight: 1.2 }}>
            The Ultimate <br />
            <span style={{ background: 'linear-gradient(135deg, var(--primary), #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>World Cup</span> Predictor
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            Join the community, lock in your knockout brackets, and compete on the live leaderboard. May the best predictor win!
          </p>
        </div>
        <button className="btn-primary" style={{ padding: '16px 36px', fontSize: '1.2rem', fontWeight: 800, borderRadius: '30px', marginBottom: '48px', boxShadow: '0 10px 30px rgba(94,106,210,0.3)', cursor: 'pointer' }} onClick={() => setShowAuthModal(true)}>
          Start Predicting Now ⚽
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', width: '100%', maxWidth: '1000px' }}>
          {[
            { icon: '📊', title: 'Match Predictions', body: 'Predict exact scores for every group stage match. Earn points for correct outcomes and perfectly guessed scorelines.' },
            { icon: '⚔️', title: 'Knockout Brackets', body: 'Your group winners sync automatically! Predict the final eight teams, the champion, and the golden boot winner.' },
            { icon: '🥇', title: 'Live Leaderboard', body: 'Community predictions are revealed at kickoff. Watch your rank climb on the live leaderboard as matches complete.' },
          ].map(({ icon, title, body }) => (
            <div key={title} className="glass-card" style={{ padding: '32px 24px', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '16px' }}>{icon}</span>
              <h3 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '12px', fontWeight: 700 }}>{title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
      {showAuthModal && <AuthModal onLoginSuccess={() => window.location.reload()} />}
    </>
  );

  // ── Logged in ──
  const grouped = groupByDate(matches);
  const dateKeys = Object.keys(grouped).sort();
  const groupedByGroup = groupByGroup(matches);
  const groupKeys = Object.keys(groupedByGroup).sort();
  const today = localDateKey(new Date());
  const totalPredicted = matches.filter(m => m.predicted_outcome).length;

  const isMatchLive = (match, now) => {
    const kickoffDate = new Date(match.kickoff_time);
    const status = String(match.status || '').toLowerCase();
    if (status === 'completed') return false;
    if (['live', 'in_progress', 'in-progress', 'ongoing', 'playing'].includes(status)) return true;
    const elapsedMs = now - kickoffDate;
    return elapsedMs >= 0 && elapsedMs <= 1000 * 60 * 95;
  };

  const GROUP_STAGE = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  const ROUND_LABELS = { R32: 'Round of 32', QF: 'Quarter-Finals', SF: 'Semi-Finals', F: 'Final' };

  const renderMatchCard = (m) => {
    const now = new Date();
    const kickoffDate = new Date(m.kickoff_time);
    const isKnockout = !GROUP_STAGE.includes(m.group_name);
    const isPast = isKnockout
      ? m.status !== 'pending' || kickoffDate <= now
      : userExempt
        ? ['completed', 'in_progress'].includes(String(m.status))
        : tournamentLocked || kickoffDate <= now;
    const isLive = isMatchLive(m, now);
    const badge = viewMode === 'group'
      ? kickoffDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
      : `Group ${m.group_name}`;
    return (
      <div key={m.id} className="glass-card" style={{ padding: '18px', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '14px' }}>
          <span style={{ padding: '2px 8px', background: 'rgba(94,106,210,0.15)', borderRadius: '12px', color: 'var(--primary)', fontWeight: 700 }}>
            {badge}
          </span>
          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {m.status === 'completed'
              ? <span style={{ color: '#10B981', fontWeight: 600 }}>✅ Finalised</span>
              : isLive
                ? <span style={{ color: '#ef4444' }}>🔴 Live</span>
                : kickoffDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {m.status === 'completed' ? (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
              <div style={{ flex: 1, fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', minWidth: 0 }}>
                <span style={{ textAlign: 'right', lineHeight: '1.2' }}>{m.team_home}</span>
                <Flag team={m.team_home} style={{ marginRight: 0, marginLeft: 0 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 6px', flexShrink: 0 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', minWidth: '24px', textAlign: 'center' }}>{m.actual_home_score}</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>–</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', minWidth: '24px', textAlign: 'center' }}>{m.actual_away_score}</span>
              </div>
              <div style={{ flex: 1, fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '5px', minWidth: 0 }}>
                <Flag team={m.team_away} style={{ marginRight: 0, marginLeft: 0 }} />
                <span style={{ lineHeight: '1.2' }}>{m.team_away}</span>
              </div>
            </div>
            {m.predicted_outcome ? (() => {
              const exact = m.predicted_home_score === m.actual_home_score && m.predicted_away_score === m.actual_away_score;
              const outcomeOk = m.predicted_outcome === m.actual_outcome;
              const pts = (outcomeOk ? 1 : 0) + (exact ? 2 : 0);
              return (
                <div style={{ padding: '7px 10px', borderRadius: '7px', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', background: pts > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.07)', border: `1px solid ${pts > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}` }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Pick: <strong style={{ color: 'white' }}>{m.predicted_home_score}–{m.predicted_away_score}</strong></span>
                  <span style={{ fontWeight: 700, color: pts > 0 ? '#10B981' : '#ef4444' }}>
                    {pts > 0 ? `+${pts} pt${pts > 1 ? 's' : ''}` : '0 pts'}{exact ? ' (exact!)' : outcomeOk ? ' (outcome)' : ''}
                  </span>
                </div>
              );
            })() : (
              <div style={{ padding: '7px 10px', borderRadius: '7px', fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', textAlign: 'center' }}>
                No prediction submitted
              </div>
            )}
          </div>
        ) : m.status === 'in_progress' ? (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
              <div style={{ flex: 1, fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', minWidth: 0 }}>
                <span style={{ textAlign: 'right', lineHeight: '1.2' }}>{m.team_home}</span>
                <Flag team={m.team_home} style={{ marginRight: 0, marginLeft: 0 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 6px', flexShrink: 0 }}>
                {m.actual_home_score !== null && m.actual_away_score !== null ? (
                  <>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444', minWidth: '24px', textAlign: 'center' }}>{m.actual_home_score}</span>
                    <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.7rem', lineHeight: 1 }}>LIVE</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444', minWidth: '24px', textAlign: 'center' }}>{m.actual_away_score}</span>
                  </>
                ) : (
                  <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.85rem', padding: '0 8px' }}>🔴 LIVE</span>
                )}
              </div>
              <div style={{ flex: 1, fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '5px', minWidth: 0 }}>
                <Flag team={m.team_away} style={{ marginRight: 0, marginLeft: 0 }} />
                <span style={{ lineHeight: '1.2' }}>{m.team_away}</span>
              </div>
            </div>
            {m.predicted_outcome ? (
              <div style={{ padding: '7px 10px', borderRadius: '7px', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Your pick: <strong style={{ color: 'white' }}>{m.predicted_home_score}–{m.predicted_away_score}</strong></span>
                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>in progress…</span>
              </div>
            ) : (
              <div style={{ padding: '7px 10px', borderRadius: '7px', fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', textAlign: 'center' }}>
                No prediction submitted
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
              <div style={{ flex: 1, fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', minWidth: 0 }}>
                <span style={{ textAlign: 'right', wordBreak: 'break-word', lineHeight: '1.2' }}>{m.team_home}</span>
                <Flag team={m.team_home} style={{ marginRight: 0, marginLeft: 0 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '0 4px', flexShrink: 0 }}>
                <input type="number" min="0" max="20" className="input-field" disabled={isPast}
                  style={{ width: '48px', minHeight: '44px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold', padding: '6px 2px', opacity: isPast ? 0.45 : 1, cursor: isPast ? 'not-allowed' : 'auto' }}
                  value={m.predicted_home_score ?? ''} onChange={e => handleScoreChange(m.id, 'predicted_home_score', e.target.value)} />
                <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>–</span>
                <input type="number" min="0" max="20" className="input-field" disabled={isPast}
                  style={{ width: '48px', minHeight: '44px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold', padding: '6px 2px', opacity: isPast ? 0.45 : 1, cursor: isPast ? 'not-allowed' : 'auto' }}
                  value={m.predicted_away_score ?? ''} onChange={e => handleScoreChange(m.id, 'predicted_away_score', e.target.value)} />
              </div>
              <div style={{ flex: 1, fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '5px', minWidth: 0 }}>
                <Flag team={m.team_away} style={{ marginRight: 0, marginLeft: 0 }} />
                <span style={{ wordBreak: 'break-word', lineHeight: '1.2' }}>{m.team_away}</span>
              </div>
            </div>
            {isPast && <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '8px 0 0 0' }}>🔒 Predictions locked at kickoff</p>}
          </div>
        )}

        {m.status !== 'completed' && (
          <button className="btn-primary" disabled={isPast} onClick={() => !isPast && savePrediction(m)}
            style={{
              width: '100%', marginBottom: '2px',
              background: isPast ? 'rgba(255,255,255,0.06)' : savedId === m.id ? 'linear-gradient(135deg, #10B981, #059669)' : undefined,
              color: isPast ? 'var(--text-secondary)' : undefined,
              cursor: isPast ? 'not-allowed' : 'pointer',
              transform: savingId === m.id ? 'scale(0.98)' : undefined,
            }}>
            {isPast
              ? m.predicted_outcome ? `Your pick: ${m.predicted_home_score}–${m.predicted_away_score}` : 'No prediction made'
              : savingId === m.id ? 'Saving...'
                : savedId === m.id ? '✅ Saved!'
                  : m.predicted_outcome ? 'Update Score' : 'Lock in Score'}
          </button>
        )}

        <CommunityPredictions matchId={m.id} teamHome={m.team_home} teamAway={m.team_away} kickoffTime={m.kickoff_time} status={m.status} tournamentLocked={GROUP_STAGE.includes(m.group_name) ? tournamentLocked : false} />
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title" style={{ marginBottom: '6px' }}>Matches</h1>
        {tournamentLocked && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 18px', marginBottom: '16px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px' }}>
            <span style={{ fontSize: '1.3rem' }}>🔒</span>
            <div>
              <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.9rem' }}>Predictions Locked — </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>The tournament has started. All picks are final.</span>
            </div>
          </div>
        )}
        <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          1 pt outcome · 2 pts exact score · predictions revealed at kickoff
          <span style={{ padding: '3px 12px', background: 'rgba(94,106,210,0.15)', borderRadius: 20, fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 700 }}>
            {totalPredicted}/{matches.length} predicted
          </span>
          {viewMode === 'date' && dateKeys.some(k => k === today) && (
            <button
              onClick={() => todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              style={{ padding: '3px 12px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, fontSize: '0.82rem', color: '#10B981', fontWeight: 700, cursor: 'pointer' }}
            >
              ↓ Jump to Today
            </button>
          )}
          {isAdmin && (
          <button
            disabled={refreshState === 'loading' || cooldown > 0}
            onClick={async () => {
              setRefreshState('loading');
              try {
                const res = await fetch('/api/admin/fetch-results', { method: 'POST' });
                const d = await res.json();
                setRefreshState(d.ok ? 'done' : 'error');
                if (d.ok) {
                  setLastRefresh(Date.now());
                  fetchMatches(userId);
                  fetch('/api/leaderboard').then(r => r.json()).then(d => setLeaderboard(d || []));
                }
              } catch {
                setRefreshState('error');
              }
              setTimeout(() => setRefreshState('idle'), 3000);
            }}
            style={{
              padding: '3px 12px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700,
              cursor: refreshState === 'loading' || cooldown > 0 ? 'not-allowed' : 'pointer',
              background: refreshState === 'done' ? 'rgba(16,185,129,0.12)' : refreshState === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(94,106,210,0.12)',
              border: refreshState === 'done' ? '1px solid rgba(16,185,129,0.3)' : refreshState === 'error' ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(94,106,210,0.3)',
              color: refreshState === 'done' ? '#10B981' : refreshState === 'error' ? '#ef4444' : cooldown > 0 ? 'var(--text-secondary)' : 'var(--primary)',
              opacity: refreshState === 'loading' || cooldown > 0 ? 0.55 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {refreshState === 'loading' ? '⏳ Fetching…' : refreshState === 'done' ? '✅ Done!' : refreshState === 'error' ? '❌ Failed' : cooldown > 0 ? `⏱ Wait ${cooldown}s` : '🔄 Refresh Results'}
          </button>
          )}
        </p>
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
        {[{ k: 'date', l: '📅 By Date' }, { k: 'group', l: '🏟 By Group/Round' }].map(({ k, l }) => (
          <button key={k} onClick={() => setViewMode(k)} style={{
            padding: '6px 18px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600,
            border: viewMode === k ? '1px solid rgba(94,106,210,0.5)' : '1px solid var(--border)',
            background: viewMode === k ? 'rgba(94,106,210,0.2)' : 'transparent',
            color: viewMode === k ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}>{l}</button>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: wide ? 'minmax(0, 1fr) 290px' : '1fr', gap: '24px', alignItems: 'start' }}>

        {/* Main: Matchdays */}
        <div>
          {/* ── By Group view ── */}
          {viewMode === 'group' && groupKeys.map(key => {
            const groupMatches = groupedByGroup[key];
            const isOpen = openGroupSections[key] ?? true;
            const groupPredicted = groupMatches.filter(m => m.predicted_outcome).length;
            const groupCompleted = groupMatches.filter(m => m.status === 'completed').length;
            const allDone = groupCompleted === groupMatches.length;
            const teams = [...new Set(groupMatches.flatMap(m => [m.team_home, m.team_away]))].sort();
            return (
              <div key={key} style={{ marginBottom: '20px' }}>
                <button
                  onClick={() => setOpenGroupSections(prev => ({ ...prev, [key]: !(prev[key] ?? true) }))}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 18px', marginBottom: isOpen ? '14px' : 0,
                    background: 'rgba(94,106,210,0.06)', border: '1px solid var(--border)',
                    borderRadius: isOpen ? '12px 12px 0 0' : '12px',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{isOpen ? '▼' : '▶'}</span>
                    <span style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem', flexShrink: 0 }}>{ROUND_LABELS[key] ?? `Group ${key}`}</span>
                    {!ROUND_LABELS[key] && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {teams.filter(t => t !== 'TBD').join(' · ')}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', flexShrink: 0, marginLeft: '10px' }}>
                    {allDone
                      ? <span style={{ color: '#10B981', fontWeight: 600 }}>✅ All done</span>
                      : <span style={{ color: groupPredicted === groupMatches.length ? '#10B981' : 'var(--text-secondary)' }}>
                          {groupPredicted}/{groupMatches.length} picked
                        </span>
                    }
                  </div>
                </button>
                {isOpen && (
                  <div style={{
                    display: 'grid', gap: '14px',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
                    padding: '14px', background: 'rgba(255,255,255,0.015)',
                    border: '1px solid var(--border)', borderTop: 'none',
                    borderRadius: '0 0 12px 12px', animation: 'fadeIn 0.15s ease',
                  }}>
                    {groupMatches.map(m => renderMatchCard(m))}
                  </div>
                )}
              </div>
            );
          })}

          {/* ── By Date view ── */}
          {viewMode === 'date' && dateKeys.map(key => {
            const dayMatches = grouped[key];
            const rel = relativeDay(key);
            const isOpen = openSections[key] ?? true;
            const isPastDay = key < today;
            const dayPredicted = dayMatches.filter(m => m.predicted_outcome).length;
            const dayCompleted = dayMatches.filter(m => m.status === 'completed').length;
            const allDone = dayCompleted === dayMatches.length;

            return (
              <div key={key} ref={key === today ? todayRef : null} style={{ marginBottom: '20px' }}>
                {/* Date section header */}
                <button
                  onClick={() => toggleSection(key)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 18px', marginBottom: isOpen ? '14px' : 0,
                    background: rel?.label === 'TODAY'
                      ? 'rgba(16,185,129,0.08)'
                      : isPastDay ? 'rgba(255,255,255,0.02)' : 'rgba(94,106,210,0.06)',
                    border: `1px solid ${rel?.label === 'TODAY' ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
                    borderRadius: isOpen ? '12px 12px 0 0' : '12px',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{isOpen ? '▼' : '▶'}</span>
                    <span style={{ fontWeight: 800, color: isPastDay ? 'var(--text-secondary)' : 'white', fontSize: '0.95rem' }}>
                      {dateLabel(key)}
                    </span>
                    {rel && (
                      <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 800, background: `${rel.color}20`, color: rel.color, border: `1px solid ${rel.color}40` }}>
                        {rel.label}
                      </span>
                    )}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {dayMatches.length} match{dayMatches.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                    {allDone
                      ? <span style={{ color: '#10B981', fontWeight: 600 }}>✅ All done</span>
                      : <span style={{ color: dayPredicted === dayMatches.length ? '#10B981' : 'var(--text-secondary)' }}>
                        {dayPredicted}/{dayMatches.length} picked
                      </span>
                    }
                  </div>
                </button>

                {/* Match cards */}
                {isOpen && (
                  <div style={{
                    display: 'grid', gap: '14px',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
                    padding: '14px', background: 'rgba(255,255,255,0.015)',
                    border: '1px solid var(--border)', borderTop: 'none',
                    borderRadius: '0 0 12px 12px',
                    animation: 'fadeIn 0.15s ease',
                  }}>
                    {dayMatches.map(m => renderMatchCard(m))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sticky Sidebar */}
        <div style={{ position: wide ? 'sticky' : 'static', top: '24px', alignSelf: 'start' }}>
          <MiniLeaderboard board={leaderboard} userId={userId} />
          <PredictionStats matches={matches} />
          <QuickLinks />
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

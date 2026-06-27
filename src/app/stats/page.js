'use client';
import { useState, useEffect } from 'react';
import Flag from '../components/Flag';
import AuthModal from '../components/AuthModal';

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

const MAIN_TABS = [
  { key: 'MATCHES',     label: '⚽ Matches' },
  { key: 'FINALEIGHT',  label: '🏆 Final Eight & Awards' },
  { key: 'GOALSCORERS', label: '👟 Top Scorers' },
];

const TOURNAMENT_START = new Date('2026-06-11T16:00:00Z');

const sectionHeading = {
  fontSize: '0.78rem',
  fontWeight: '700',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  marginBottom: '12px',
  marginTop: '4px',
};

function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  });
}

// ─── Matches tab ────────────────────────────────────────────────────────────

function PredictionBar({ homeCount, drawCount, awayCount, total, homeTeam, awayTeam, actualOutcome, exactCount }) {
  const h  = Number(homeCount);
  const dr = Number(drawCount);
  const a  = Number(awayCount);
  const t  = Number(total);

  if (t === 0) {
    return <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0, fontStyle: 'italic' }}>No predictions yet</p>;
  }

  const homeExact = (h  / t) * 100;
  const drawExact = (dr / t) * 100;
  const awayExact = (a  / t) * 100;

  const seg = (outcome, pct, color) => ({
    flex: `0 0 ${pct}%`,
    background: color,
    opacity: actualOutcome && actualOutcome !== outcome ? 0.3 : 1,
    transition: 'opacity 0.2s',
  });

  const correctCount =
    actualOutcome === 'home' ? h :
    actualOutcome === 'away' ? a :
    actualOutcome === 'draw' ? dr : null;

  return (
    <div>
      <div style={{ marginBottom: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
        {t} prediction{t !== 1 ? 's' : ''}
      </div>
      <div style={{ display: 'flex', height: '10px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', marginBottom: '8px' }}>
        {homeExact > 0 && <div style={seg('home', homeExact, '#5e6ad2')} />}
        {drawExact > 0 && <div style={seg('draw', drawExact, 'rgba(160,174,192,0.65)')} />}
        {awayExact > 0 && <div style={seg('away', awayExact, '#ffb86c')} />}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.79rem', gap: '4px' }}>
        <span style={{ color: '#8b8fff', minWidth: 0 }}>
          {homeTeam}: <strong>{Math.round(homeExact)}%</strong>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.71rem' }}> ({h})</span>
        </span>
        <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          Draw: <strong>{Math.round(drawExact)}%</strong>
          <span style={{ fontSize: '0.71rem' }}> ({dr})</span>
        </span>
        <span style={{ color: '#ffb86c', textAlign: 'right', minWidth: 0 }}>
          {awayTeam}: <strong>{Math.round(awayExact)}%</strong>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.71rem' }}> ({a})</span>
        </span>
      </div>
      {actualOutcome && correctCount !== null && (
        <div style={{ marginTop: '8px', fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#4ade80' }}>✓</span>
            {correctCount} of {t} predicted the outcome correctly ({Math.round((correctCount / t) * 100)}%)
          </div>
          {exactCount !== undefined && exactCount !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#f59e0b' }}>★</span>
              {Number(exactCount)} of {t} got the exact score ({Math.round((Number(exactCount) / t) * 100)}%)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }) {
  const { team_home, team_away, kickoff_time, status, actual_home_score, actual_away_score,
          actual_outcome, home_count, draw_count, away_count, total_count, exact_count } = match;
  const isCompleted = status === 'completed';
  const dateLabel = formatDate(kickoff_time);

  return (
    <div className="glass-card" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '12px', marginBottom: isCompleted ? '4px' : '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <Flag team={team_home} />
          <span style={{ fontWeight: '700', fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team_home}</span>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          {isCompleted
            ? <span style={{ fontWeight: '800', fontSize: '1.15rem', color: 'white', letterSpacing: '0.04em' }}>{actual_home_score} – {actual_away_score}</span>
            : <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{dateLabel}</span>
          }
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', minWidth: 0 }}>
          <span style={{ fontWeight: '700', fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team_away}</span>
          <Flag team={team_away} />
        </div>
      </div>
      {isCompleted && (
        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{dateLabel}</div>
      )}
      <PredictionBar
        homeCount={home_count} drawCount={draw_count} awayCount={away_count}
        total={total_count} homeTeam={team_home} awayTeam={team_away} actualOutcome={actual_outcome}
        exactCount={exact_count}
      />
    </div>
  );
}

function MatchesTab({ matches, loading }) {
  const [activeGroup, setActiveGroup] = useState('ALL');
  const totalPredictions = matches.reduce((s, m) => s + Number(m.total_count), 0);
  const filtered = activeGroup === 'ALL' ? matches : matches.filter(m => m.group_name === activeGroup);
  const grouped  = filtered.reduce((acc, m) => {
    if (!acc[m.group_name]) acc[m.group_name] = [];
    acc[m.group_name].push(m);
    return acc;
  }, {});

  return (
    <div>
      {totalPredictions > 0 && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
          {totalPredictions.toLocaleString()} predictions cast across all matches
        </p>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
        {['ALL', ...GROUPS].map(g => {
          const isActive = activeGroup === g;
          return (
            <button key={g} onClick={() => setActiveGroup(g)} style={{
              padding: '6px 14px', borderRadius: '20px',
              border: isActive ? '1px solid rgba(94,106,210,0.5)' : '1px solid var(--border)',
              background: isActive ? 'rgba(94,106,210,0.2)' : 'transparent',
              color: isActive ? 'white' : 'var(--text-secondary)',
              fontSize: '0.85rem', fontWeight: isActive ? '700' : '500',
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}>
              {g === 'ALL' ? 'All Groups' : `Group ${g}`}
            </button>
          );
        })}
      </div>
      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>}
      {!loading && filtered.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No matches found.</p>}
      {Object.entries(grouped).map(([groupName, groupMatches]) => (
        <div key={groupName} style={{ marginBottom: '36px' }}>
          <h2 style={sectionHeading}>Group {groupName}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {groupMatches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Shared ranking components ───────────────────────────────────────────────

function RankingList({ items, total, showFlag = false, maxItems = 12 }) {
  const shown = items.slice(0, maxItems);
  if (shown.length === 0) {
    return <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem', margin: 0 }}>No predictions yet</p>;
  }
  const maxCount = shown[0].count;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
      {shown.map((item, i) => {
        const name = item.value ?? item.name;
        const pct  = total > 0 ? Math.round((item.count / total) * 100) : 0;
        const barW = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
        return (
          <div key={name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '0.83rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                <span style={{ color: 'var(--text-secondary)', minWidth: '20px', fontSize: '0.75rem' }}>#{i + 1}</span>
                {showFlag && <Flag team={name} />}
                <span style={{ fontWeight: i === 0 ? '700' : '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                {pct}% <span style={{ opacity: 0.6 }}>({item.count})</span>
              </span>
            </div>
            <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ width: `${barW}%`, height: '100%', borderRadius: '3px', background: i === 0 ? '#5e6ad2' : 'rgba(94,106,210,0.4)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CategoryCard({ title, items, total, showFlag = false, maxItems = 12 }) {
  return (
    <div className="glass-card" style={{ padding: '18px 20px' }}>
      <h3 style={{ fontSize: '0.88rem', fontWeight: '700', marginBottom: '16px', color: 'white' }}>{title}</h3>
      <RankingList items={items} total={total} showFlag={showFlag} maxItems={maxItems} />
    </div>
  );
}

// ─── Final Eight tab ─────────────────────────────────────────────────────────

function FinalEightTab({ data, loading }) {
  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>;
  if (!data)   return null;

  const { total, winner, silver, bronze, fourth, quarterfinalists, top_scorer, top_country } = data;

  if (total === 0) {
    return <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No Final Eight predictions have been submitted yet.</p>;
  }

  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '28px' }}>
        Based on {total} participant{total !== 1 ? 's' : ''} — % shows how many picked this team/player
      </p>

      <h2 style={sectionHeading}>🏆 The Final Four</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        <CategoryCard title="🥇 Champion"     items={winner} total={total} showFlag />
        <CategoryCard title="🥈 Runner-Up"    items={silver} total={total} showFlag />
        <CategoryCard title="🥉 Third Place"  items={bronze} total={total} showFlag />
        <CategoryCard title="4️⃣ Fourth Place" items={fourth} total={total} showFlag />
      </div>

      <h2 style={sectionHeading}>⚔️ Quarterfinalists (5th–8th)</h2>
      <div style={{ marginBottom: '28px' }}>
        <CategoryCard title="Most picked to reach QF but not SF" items={quarterfinalists} total={total} showFlag maxItems={16} />
      </div>

      <h2 style={sectionHeading}>🎯 Individual Awards</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        <CategoryCard title="👟 Golden Boot (player)"       items={top_scorer}  total={total} />
        <CategoryCard title="🌍 Top Scoring Country"        items={top_country} total={total} showFlag />
      </div>
    </div>
  );
}

// ─── Goalscorers tab ─────────────────────────────────────────────────────────

function GoalscorersTab({ data, loading }) {
  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>;
  if (!data)   return null;

  const { total, players, topScorers } = data;

  if (total === 0) {
    return <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No goalscorer predictions have been submitted yet.</p>;
  }

  const hasAnyGoals = players.some(p => p.goals > 0);
  const predictedNames = new Set(players.map(p => p.name));

  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: topScorers?.length ? '16px' : '28px' }}>
        {total} participant{total !== 1 ? 's' : ''} each picked 3 players — % shows how many included this player
      </p>

      {topScorers?.length > 0 && (
        <div style={{
          marginBottom: '28px',
          padding: '14px 20px',
          borderRadius: '12px',
          background: 'rgba(250,204,21,0.08)',
          border: '1px solid rgba(250,204,21,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '1.4rem' }}>🥇</span>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(250,204,21,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600', marginBottom: '6px' }}>
              Current Tournament Top Scorer{topScorers.length > 1 ? 's' : ''} — {topScorers[0].goals} ⚽
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {topScorers.map(ts => {
                const unpicked = !predictedNames.has(ts.name);
                return (
                  <div key={ts.name} style={{ color: 'white', fontWeight: '700', fontSize: '0.97rem' }}>
                    {ts.name}
                    {unpicked && (
                      <span style={{ marginLeft: '10px', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '400' }}>
                        — not picked by anyone
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <h3 style={{ fontSize: '0.88rem', fontWeight: '700', marginBottom: '20px', color: 'white' }}>⚽ Most Picked Players</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <th style={{ textAlign: 'left', paddingBottom: '10px', fontWeight: '600', width: '28px' }}>#</th>
              <th style={{ textAlign: 'left', paddingBottom: '10px', fontWeight: '600' }}>Player</th>
              <th style={{ textAlign: 'right', paddingBottom: '10px', fontWeight: '600', whiteSpace: 'nowrap' }}>Picked by</th>
              {hasAnyGoals && (
                <th style={{ textAlign: 'right', paddingBottom: '10px', fontWeight: '600', whiteSpace: 'nowrap' }}>Goals</th>
              )}
            </tr>
          </thead>
          <tbody>
            {players.slice(0, 20).map((p, i) => {
              const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
              return (
                <tr key={p.name} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '9px 0', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{i + 1}</td>
                  <td style={{ padding: '9px 8px 9px 0', fontWeight: i === 0 ? '700' : '400', color: 'white' }}>{p.name}</td>
                  <td style={{ padding: '9px 0', textAlign: 'right', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {pct}% <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>({p.count})</span>
                  </td>
                  {hasAnyGoals && (
                    <td style={{ padding: '9px 0 9px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {p.goals > 0
                        ? <span style={{ color: '#4ade80', fontWeight: '700' }}>{p.goals} ⚽</span>
                        : <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>—</span>
                      }
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState('MATCHES');
  const [userId, setUserId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [matches, setMatches]               = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);

  const [finalEight, setFinalEight]                   = useState(null);
  const [finalEightLoading, setFinalEightLoading]     = useState(false);

  const [goalscorers, setGoalscorers]                 = useState(null);
  const [goalscorersLoading, setGoalscorersLoading]   = useState(false);

  const [saaliStats, setSaaliStats]             = useState(null);
  const [saaliStatsLoading, setSaaliStatsLoading] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('simUserId');
    if (id) setUserId(id);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || !userId) return;
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => { setMatches(Array.isArray(data) ? data : []); setMatchesLoading(false); })
      .catch(() => setMatchesLoading(false));
  }, [loaded, userId]);

  useEffect(() => {
    if (!loaded || !userId) return;
    if (activeTab === 'FINALEIGHT' && finalEight === null && !finalEightLoading) {
      setFinalEightLoading(true);
      fetch('/api/stats/finaleight')
        .then(r => r.json())
        .then(data => { setFinalEight(data); setFinalEightLoading(false); })
        .catch(() => setFinalEightLoading(false));
    }
  }, [activeTab, finalEight, finalEightLoading]);

  useEffect(() => {
    if (!loaded || !userId) return;
    if (activeTab === 'GOALSCORERS' && goalscorers === null && !goalscorersLoading) {
      setGoalscorersLoading(true);
      fetch('/api/stats/goalscorers')
        .then(r => r.json())
        .then(data => { setGoalscorers(data); setGoalscorersLoading(false); })
        .catch(() => setGoalscorersLoading(false));
    }
  }, [activeTab, goalscorers, goalscorersLoading]);

  useEffect(() => {
    if (!loaded || !userId) return;
    if (activeTab === 'SAALI' && saaliStats === null && !saaliStatsLoading) {
      setSaaliStatsLoading(true);
      fetch('/api/saali/stats')
        .then(r => r.json())
        .then(data => { setSaaliStats(Array.isArray(data) ? data : []); setSaaliStatsLoading(false); })
        .catch(() => setSaaliStatsLoading(false));
    }
  }, [activeTab, saaliStats, saaliStatsLoading]);

  if (loaded && !userId) return (
    <>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title" style={{ marginBottom: '8px' }}>Prediction Stats</h1>
        <p className="page-subtitle">How the group is calling it</p>
      </div>
      <div className="glass-card" style={{ padding: '40px 32px', textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'white' }}>Members only</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>Log in to view prediction stats.</p>
        <button className="btn-primary" onClick={() => setShowAuthModal(true)} style={{ padding: '12px 32px', fontWeight: 700 }}>
          Log In
        </button>
      </div>
      {showAuthModal && <AuthModal onLoginSuccess={() => window.location.reload()} />}
    </>
  );

  if (new Date() < TOURNAMENT_START) {
    return (
      <div>
        <div style={{ marginBottom: '28px' }}>
          <h1 className="page-title" style={{ marginBottom: '8px' }}>Prediction Stats</h1>
          <p className="page-subtitle">How the group is calling it</p>
        </div>
        <div className="glass-card" style={{ padding: '40px 32px', textAlign: 'center', maxWidth: '560px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '12px', color: 'white' }}>
            Stats unlock when the tournament starts
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
            Prediction stats will be revealed once the first match kicks off on{' '}
            <strong style={{ color: 'white' }}>11 June 2026 at 16:00 UTC</strong>.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Keep predicting — all picks must be locked in before the tournament kicks off!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title" style={{ marginBottom: '8px' }}>Prediction Stats</h1>
        <p className="page-subtitle">How the group is calling it</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {[...MAIN_TABS, { key: 'SAALI', label: '🏅 Säälipleijarit' }].map(({ key, label }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '9px 18px', borderRadius: '10px',
                border: isActive ? '1px solid rgba(94,106,210,0.5)' : '1px solid var(--border)',
                background: isActive ? 'rgba(94,106,210,0.2)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
                fontSize: '0.9rem', fontWeight: isActive ? '700' : '500',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === 'MATCHES'     && <MatchesTab     matches={matches} loading={matchesLoading} />}
      {activeTab === 'FINALEIGHT'  && <FinalEightTab  data={finalEight} loading={finalEightLoading} />}
      {activeTab === 'GOALSCORERS' && <GoalscorersTab data={goalscorers} loading={goalscorersLoading} />}
      {activeTab === 'SAALI'       && <MatchesTab     matches={saaliStats || []} loading={saaliStatsLoading} />}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import Flag from '../components/Flag';
import AuthModal from '../components/AuthModal';

const formatPts = (val) => { const n = parseFloat(val) || 0; return n % 1 === 0 ? String(n) : n.toFixed(1); };

const CAT_COLORS = {
  match: '#5e6ad2',
  group: '#818cf8',
  final: '#F59E0B',
  goal: '#10B981',
};

function StackedBar({ row, maxPts }) {
  const total = parseFloat(row.total_points) || 0;
  const fillPct = maxPts > 0 ? (total / maxPts) * 100 : 0;

  if (total === 0) {
    return <div style={{ height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: 999 }} />;
  }

  const segs = [
    { val: Number(row.match_pts), color: CAT_COLORS.match, label: 'Match pts' },
    { val: Number(row.group_rank_pts), color: CAT_COLORS.group, label: 'Group pts' },
    { val: Number(row.final_eight_pts), color: CAT_COLORS.final, label: 'Final Eight pts' },
    { val: parseFloat(row.goalscorer_pts) || 0, color: CAT_COLORS.goal, label: 'Goalscorer pts' },
  ].filter(s => s.val > 0);

  return (
    <div style={{ height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${fillPct}%`, height: '100%', display: 'flex', transition: 'width 0.6s ease' }}>
        {segs.map((s, i) => (
          <div
            key={i}
            title={`${s.label}: ${s.val}`}
            style={{ flex: s.val, background: s.color, minWidth: 3 }}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryNumbers({ row, leaders }) {
  const nums = [
    { val: Number(row.match_pts), color: CAT_COLORS.match, icon: '⚽', key: 'match' },
    { val: Number(row.group_rank_pts), color: CAT_COLORS.group, icon: '🏟', key: 'group' },
    { val: Number(row.final_eight_pts), color: CAT_COLORS.final, icon: '8️⃣', key: 'final' },
    { val: parseFloat(row.goalscorer_pts) || 0, color: CAT_COLORS.goal, icon: '🎯', key: 'goal' },
  ];
  return (
    <div style={{ display: 'flex', gap: '10px', marginTop: '5px', flexWrap: 'wrap' }}>
      {nums.map(n => (
        <span key={n.key} style={{ fontSize: '0.73rem', color: n.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
          {n.icon} {formatPts(n.val)}
          {leaders[n.key] === row.participant_id && n.val > 0 && (
            <span title={`Leading in this category`} style={{ fontSize: '0.65rem', marginLeft: 1 }}>★</span>
          )}
        </span>
      ))}
    </div>
  );
}

function PicksAccordion({ title, icon, items, type, expanded, setExpanded }) {
  if (!items || items.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', marginBottom: '12px' }}>{icon} {title}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No picks submitted yet.</p>
      </div>
    );
  }

  const total = items.reduce((s, i) => s + Number(i.count), 0);
  const max = Math.max(...items.map(i => Number(i.count)));

  return (
    <div>
      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', marginBottom: '12px' }}>{icon} {title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map(item => {
          const label = type === 'winner' ? item.team : item.player;
          const count = Number(item.count);
          const pct = Math.round((count / total) * 100);
          const barPct = (count / max) * 100;
          const isOpen = expanded === label;
          return (
            <div key={label}>
              <button
                onClick={() => setExpanded(isOpen ? null : label)}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {type === 'winner' && <Flag team={label} style={{ height: '13px', marginRight: 0, marginLeft: 0 }} />}
                    {label}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                    {count} pick{count !== 1 ? 's' : ''} · {pct}% {isOpen ? '▲' : '▼'}
                  </span>
                </div>
                <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${barPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #818cf8)', borderRadius: 999, transition: 'width 0.5s ease' }} />
                </div>
              </button>
              {isOpen && (
                <div style={{
                  marginTop: '6px', padding: '8px 12px',
                  background: 'rgba(0,0,0,0.25)', borderRadius: '8px',
                  fontSize: '0.82rem', color: 'var(--text-secondary)',
                  animation: 'fadeIn 0.15s ease',
                }}>
                  {item.pickers.join(' · ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [board, setBoard] = useState([]);
  const [picks, setPicks] = useState({ winners: [], topScorers: [] });
  const [userId, setUserId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [expandedWinner, setExpandedWinner] = useState(null);
  const [expandedScorer, setExpandedScorer] = useState(null);
  const [beerMap, setBeerMap] = useState({});
  const [tournamentLocked, setTournamentLocked] = useState(false);

  const fetchBoard = () => {
    fetch('/api/leaderboard').then(r => r.json()).then(data => {
      setBoard(data || []);
      setLastUpdated(new Date());
    });
  };

  useEffect(() => {
    const id = localStorage.getItem('simUserId');
    if (id) setUserId(Number(id));
    setLoaded(true);
    fetchBoard();
    fetch('/api/finaleight/summary')
      .then(r => r.json())
      .then(data => { if (!data.error) setPicks(data); });
    fetch('/api/participants')
      .then(r => r.json())
      .then(data => {
        const map = {};
        (data || []).forEach(p => { map[p.username] = p.beers_in; });
        setBeerMap(map);
      });
    fetch('/api/tournament/status')
      .then(r => r.json())
      .then(d => setTournamentLocked(d.locked));
  }, []);

  // Derived data
  const maxPts = Math.max(...board.map(r => parseFloat(r.total_points) || 0), 1);
  const leaderPts = board.length > 0 ? parseFloat(board[0].total_points) || 0 : 0;
  const lastPts = board.length > 0 ? parseFloat(board[board.length - 1]?.total_points) || 0 : 0;
  const spread = leaderPts - lastPts;

  // Category leaders: participant_id of the highest scorer in each category
  const leaders = {};
  if (board.length > 0) {
    const catMax = (key, parse = Number) => board.reduce((best, r) => {
      const v = parse(r[key]) || 0;
      return v > (parse(best[key]) || 0) ? r : best;
    }, board[0]);
    const ml = catMax('match_pts'); if (Number(ml.match_pts) > 0) leaders.match = ml.participant_id;
    const gl = catMax('group_rank_pts'); if (Number(gl.group_rank_pts) > 0) leaders.group = gl.participant_id;
    const fl = catMax('final_eight_pts'); if (Number(fl.final_eight_pts) > 0) leaders.final = fl.participant_id;
    const goalL = catMax('goalscorer_pts', parseFloat); if ((parseFloat(goalL.goalscorer_pts) || 0) > 0) leaders.goal = goalL.participant_id;
  }

  // Map username → winner/scorer for inline chips
  const winnerByUser = {};
  (picks.winners || []).forEach(({ team, pickers }) => pickers.forEach(n => { winnerByUser[n] = team; }));
  const scorerByUser = {};
  (picks.topScorers || []).forEach(({ player, pickers }) => pickers.forEach(n => { scorerByUser[n] = player; }));

  const medals = ['🏆', '🥈', '🥉'];
  const myRank = board.findIndex(r => r.participant_id === userId);

  // Shared-rank computation: players tied on total_points share the same rank number
  const ranksArr = [];
  board.forEach((row, i) => {
    if (i === 0) { ranksArr.push(1); return; }
    const prev = parseFloat(board[i - 1].total_points);
    const cur = parseFloat(row.total_points);
    ranksArr.push(cur === prev ? ranksArr[i - 1] : i + 1);
  });
  const isTied = (i) => ranksArr.some((r, ii) => r === ranksArr[i] && ii !== i);

  if (loaded && !userId) return (
    <>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="page-title">Leaderboard</h1>
        <p className="page-subtitle">Log in to see the standings</p>
      </div>
      <div className="glass-card" style={{ padding: '40px 32px', textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'white' }}>Members only</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>Log in to view the leaderboard.</p>
        <button className="btn-primary" onClick={() => setShowAuthModal(true)} style={{ padding: '12px 32px', fontWeight: 700 }}>
          Log In
        </button>
      </div>
      {showAuthModal && <AuthModal onLoginSuccess={() => window.location.reload()} />}
    </>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <h1 className="page-title">Leaderboard</h1>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            Real-time standings · updated after every result
            {board.length > 1 && spread > 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                · {formatPts(spread)} pts from 1st to last
              </span>
            )}
            {myRank >= 0 && (
              <span style={{ padding: '2px 10px', background: 'rgba(94,106,210,0.15)', borderRadius: 20, fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
                You're {isTied(myRank) ? '=' : '#'}{ranksArr[myRank]}
                {ranksArr[myRank] === 1 ? ' 👑' : ` · ${formatPts(leaderPts - (parseFloat(board[myRank]?.total_points) || 0))} pts behind`}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', paddingTop: '8px' }}>
          <button
            onClick={fetchBoard}
            style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            🔄 Refresh
          </button>
          {lastUpdated && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflowX: 'auto', padding: 0, marginBottom: '28px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.82rem' }}>Rank</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.82rem' }}>Player</th>
              <th style={{ padding: '14px 16px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Total Pts</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.82rem', minWidth: '180px' }}>
                Breakdown
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '0.68rem', fontWeight: 400 }}>
                  {[['⚽', 'Match', CAT_COLORS.match], ['🏟', 'Group', CAT_COLORS.group], ['8️⃣', 'F8', CAT_COLORS.final], ['🎯', 'Goals', CAT_COLORS.goal]].map(([icon, label, color]) => (
                    <span key={label} style={{ color, display: 'flex', alignItems: 'center', gap: '2px' }}>{icon} {label}</span>
                  ))}
                </div>
              </th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>Gap</th>
            </tr>
          </thead>
          <tbody>
            {board.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No scores yet — predictions are being collected!
                </td>
              </tr>
            )}
            {board.map((row, index) => {
              const isMe = row.participant_id === userId;
              const isLeader = index === 0;
              const rank = ranksArr[index];
              const tied = isTied(index);
              const total = parseFloat(row.total_points) || 0;
              const gap = total - leaderPts;
              const myWinner = winnerByUser[row.username];
              const myScorer = scorerByUser[row.username];
              const beersIn = beerMap[row.username];

              return (
                <tr
                  key={row.participant_id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: isMe && isLeader
                      ? 'rgba(94,106,210,0.1)'
                      : isMe
                        ? 'rgba(94,106,210,0.07)'
                        : isLeader
                          ? 'rgba(255,215,0,0.03)'
                          : 'transparent',
                    boxShadow: isMe ? 'inset 2px 0 0 var(--primary)' : isLeader ? 'inset 2px 0 0 #F59E0B' : 'none',
                  }}
                >
                  {/* Rank */}
                  <td style={{ padding: '16px', fontWeight: 700, fontSize: '1.1rem', whiteSpace: 'nowrap' }}>
                    {rank <= 3
                      ? medals[rank - 1]
                      : <span style={{ fontSize: '0.95rem' }}>{tied ? '=' : '#'}{rank}</span>}
                  </td>

                  {/* Player */}
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isMe ? 'white' : undefined }}>
                        {row.username}
                      </span>
                      {isMe && (
                        <span style={{ padding: '1px 7px', background: 'rgba(94,106,210,0.25)', border: '1px solid rgba(94,106,210,0.5)', borderRadius: 20, fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>
                          You
                        </span>
                      )}
                      {rank === 1 && total > 0 && (
                        <span style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 700 }}>
                          👑 {tied ? 'Joint Leader' : 'Leading'}
                        </span>
                      )}
                      {beersIn && (
                        <span title="In the beer pool" style={{ fontSize: '0.85rem' }}>🍺</span>
                      )}
                    </div>
                    {/* Picks chips — hidden until tournament starts */}
                    {tournamentLocked && (myWinner || myScorer) && (
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '3px' }}>
                        {myWinner && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            🏆 <Flag team={myWinner} style={{ height: '11px', marginRight: 0, marginLeft: 0 }} /> {myWinner}
                          </span>
                        )}
                        {myScorer && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            ⚽ {myScorer}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Total */}
                  <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 900, color: isLeader ? '#F59E0B' : 'var(--primary)', fontSize: '1.35rem' }}>
                      {formatPts(total)}
                    </span>
                  </td>

                  {/* Breakdown */}
                  <td style={{ padding: '16px', minWidth: '180px' }}>
                    <StackedBar row={row} maxPts={maxPts} />
                    <CategoryNumbers row={row} leaders={leaders} />
                  </td>

                  {/* Gap */}
                  <td style={{ padding: '16px', whiteSpace: 'nowrap', fontSize: '0.85rem', fontWeight: 700 }}>
                    {gap === 0
                      ? <span style={{ color: '#F59E0B' }}>—</span>
                      : <span style={{ color: '#ef4444' }}>{formatPts(gap)} pts</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Category leaders footer */}
          {board.length > 1 && Object.keys(leaders).length > 0 && (
            <tfoot>
              <tr style={{ borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
                <td colSpan={5} style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginRight: 4 }}>Category leads:</span>
                    {[
                      { key: 'match', icon: '⚽', label: 'Matches', color: CAT_COLORS.match },
                      { key: 'group', icon: '🏟', label: 'Groups', color: CAT_COLORS.group },
                      { key: 'final', icon: '8️⃣', label: 'Final 8', color: CAT_COLORS.final },
                      { key: 'goal', icon: '🎯', label: 'Goalscorer', color: CAT_COLORS.goal },
                    ].filter(c => leaders[c.key]).map(c => {
                      const leader = board.find(r => r.participant_id === leaders[c.key]);
                      return (
                        <span key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: c.color }}>{c.icon} {c.label}:</span>
                          <span style={{ color: 'white', fontWeight: 700 }}>{leader?.username}</span>
                        </span>
                      );
                    })}
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Beer Pool */}
      {Object.values(beerMap).some(Boolean) && (() => {
        const beerPlayers = board.filter(r => beerMap[r.username]);
        const n = beerPlayers.length;
        const second = n >= 2 ? Math.round(n * 0.2) : 0;
        const third = n >= 3 ? Math.round(n * 0.1) : 0;
        const first = n - second - third;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', padding: '14px 18px', marginBottom: '28px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>🍺</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.88rem', marginBottom: '5px' }}>
                Beer Pool — {n} player{n !== 1 ? 's' : ''} in · {n} beer{n !== 1 ? 's' : ''} at stake
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>🥇 {first} beer{first !== 1 ? 's' : ''} to winner</span>
                {n >= 2 && <span>🥈 {second} beer{second !== 1 ? 's' : ''} to 2nd</span>}
                {n >= 3 && <span>🥉 {third} beer{third !== 1 ? 's' : ''} to 3rd</span>}
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>· {beerPlayers.map(r => r.username).join(', ')}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tournament Picks */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', marginBottom: '16px' }}>
        🎯 Tournament Picks
      </h2>
      {tournamentLocked ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <PicksAccordion
              title="World Cup Winner"
              icon="🏆"
              items={picks.winners}
              type="winner"
              expanded={expandedWinner}
              setExpanded={setExpandedWinner}
            />
          </div>
          <div className="glass-card" style={{ padding: '24px' }}>
            <PicksAccordion
              title="Golden Boot"
              icon="⚽"
              items={picks.topScorers}
              type="scorer"
              expanded={expandedScorer}
              setExpanded={setExpandedScorer}
            />
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
          🔒 Revealed when the tournament kicks off
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

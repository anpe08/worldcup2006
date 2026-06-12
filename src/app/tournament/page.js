'use client';

import { useState, useEffect } from 'react';

export default function TournamentPicks() {
  const [picks, setPicks] = useState({
    winner: '', top_scorer: '', golden_glove: '', most_assists: ''
  });
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem('simUserId');
    if (id) {
       setUserId(id);
       fetch(`/api/tournament?userId=${id}`).then(r => r.json()).then(data => {
          if (data && Object.keys(data).length > 0) setPicks(data);
       });
    }
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) return;
    const pin = localStorage.getItem('simUserPin');
    await fetch('/api/tournament', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ participant_id: userId, pin, ...picks })
    });
    alert('Tournament Picks Saved Successfully!');
  };

  if (!userId) return <div style={{marginTop: 40}}>Please select a user profile to lock in tournament picks.</div>;

  return (
    <div>
      <h1 className="page-title">Tournament Awards</h1>
      <p className="page-subtitle">The massive 5-pointers. Who will conquer the World Cup?</p>

      <div className="glass-card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
             <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>Tournament Winner</label>
             <input className="input-field" value={picks.winner || ''} onChange={e => setPicks({...picks, winner: e.target.value})} placeholder="e.g. Argentina" required />
          </div>
          <div>
             <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>Top Goalscorer (Golden Boot)</label>
             <input className="input-field" value={picks.top_scorer || ''} onChange={e => setPicks({...picks, top_scorer: e.target.value})} placeholder="e.g. Kylian Mbappé" required />
          </div>
          <div>
             <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>Best Goalkeeper (Golden Glove)</label>
             <input className="input-field" value={picks.golden_glove || ''} onChange={e => setPicks({...picks, golden_glove: e.target.value})} placeholder="e.g. Emiliano Martínez" required />
          </div>
          <div>
             <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>Most Assists Playmaker</label>
             <input className="input-field" value={picks.most_assists || ''} onChange={e => setPicks({...picks, most_assists: e.target.value})} placeholder="e.g. Lionel Messi" required />
          </div>
          <button type="submit" className="btn-primary" style={{marginTop: '16px', padding: '16px'}}>Lock In Picks Securely</button>
        </form>
      </div>
    </div>
  );
}

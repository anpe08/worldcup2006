'use client';
import { useState, useEffect } from 'react';
import AuthModal from '../components/AuthModal';
import PlayerTypeahead from '../components/PlayerTypeahead';

export default function Goalscorers() {
  const [userId, setUserId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [picks, setPicks] = useState({ player_1: '', player_2: '', player_3: '' });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tournamentLocked, setTournamentLocked] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('simUserId');
    if (id) {
      setUserId(id);
      fetch(`/api/goalscorers?userId=${id}`).then(r => r.json()).then(data => {
        if (data && Object.keys(data).length > 0) setPicks(data);
      });
    }
    fetch(`/api/tournament/status${id ? `?userId=${id}` : ''}`).then(r => r.json()).then(d => setTournamentLocked(d.locked));
  }, []);

  const handlePlayerInput = (field, value) => {
    setPicks(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userId) return;

    if (!picks.player_1 || !picks.player_2 || !picks.player_3) {
      alert('Please select valid players from the dropdown suggestions for all 3 fields.');
      return;
    }

    const pin = localStorage.getItem('simUserPin');
    const res = await fetch('/api/goalscorers', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ participant_id: userId, pin, ...picks })
    });

    if (!res.ok) {
      const errorData = await res.json();
      alert(errorData.error || 'Failed to save goalscorers');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (!userId) return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '24px' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '40px', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🔒</span>
          <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '12px', marginTop: 0 }}>Authentication Required</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
            Please sign in or register a profile to lock in your goalscorer predictions.
          </p>
          <button
            className="btn-primary"
            style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 600, width: '100%' }}
            onClick={() => setShowAuthModal(true)}
          >
            Sign In / Register Profile
          </button>
        </div>
      </div>
      {showAuthModal && <AuthModal onLoginSuccess={() => window.location.reload()} />}
    </>
  );

  return (
    <div>
      <h1 className="page-title">Personal Goalscorers</h1>
      <p className="page-subtitle">Pick 3 players — you earn 1 pt for every goal they score during the group stage!</p>

      {tournamentLocked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', marginBottom: '20px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', maxWidth: 600 }}>
          <span style={{ fontSize: '1.5rem' }}>🔒</span>
          <div>
            <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '2px', fontSize: '0.95rem' }}>Predictions Locked</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>The tournament has started — your picks are locked in.</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="glass-card" style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: '16px', pointerEvents: tournamentLocked ? 'none' : 'auto', opacity: tournamentLocked ? 0.65 : 1 }}>
         {[1, 2, 3].map(num => {
           const field = `player_${num}`;
           return (
             <div key={num}>
               <label style={{display:'block', marginBottom:'4px', fontWeight:'600'}}>Player {num}</label>
               <PlayerTypeahead
                 value={picks[field]}
                 onChange={(val) => handlePlayerInput(field, val)}
                 placeholder="Start typing a player's name (e.g. Harry Kane)..."
                 required
               />
             </div>
           );
         })}
         <button
           type="submit"
           className="btn-primary"
           disabled={tournamentLocked}
           style={{
             marginTop: '16px',
             background: tournamentLocked ? 'rgba(255,255,255,0.06)' : saved ? 'linear-gradient(135deg, #10B981, #059669)' : undefined,
             color: tournamentLocked ? 'var(--text-secondary)' : undefined,
             cursor: tournamentLocked ? 'not-allowed' : 'pointer',
             opacity: tournamentLocked ? 0.5 : 1,
           }}
         >
           {tournamentLocked ? '🔒 Predictions Locked' : saved ? '✅ Saved Successfully!' : 'Lock In Top 3 Goalscorers'}
         </button>
      </form>
    </div>
  );
}

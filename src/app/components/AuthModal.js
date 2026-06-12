'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function AuthModal({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [pin, setPin] = useState('');
  const [beersIn, setBeersIn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [registrationClosed, setRegistrationClosed] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/tournament/status').then(r => r.json()).then(d => {
      if (d.locked) setRegistrationClosed(true);
    });
  }, []);

  // Fetch users list for login dropdown
  useEffect(() => {
    fetch('/api/participants')
      .then((r) => r.json())
      .then((data) => setUsers(data || []))
      .catch((err) => console.error('Error fetching users:', err));
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const username = activeTab === 'login' ? selectedUser : usernameInput.trim();

    if (!username) {
      setError(activeTab === 'login' ? 'Please select a user profile.' : 'Please enter a username.');
      setLoading(false);
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 numeric digits.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin, ...(activeTab === 'register' && { beers_in: beersIn }) }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      // Success
      localStorage.setItem('simUserId', data.userId);
      localStorage.setItem('simUsername', data.username);
      localStorage.setItem('simUserPin', pin); // Store plaintext locally to auto-send on POST requests
      
      if (onLoginSuccess) {
        onLoginSuccess(data.userId, data.username, pin);
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 15, 0.88)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflowY: 'auto',
      zIndex: 99999,
      padding: '24px',
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '440px',
        margin: '40px auto',
        flexShrink: 0,
        padding: '40px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        animation: 'modalScale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>⚽</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', margin: 0 }}>CupPredict Auth</h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '12px', marginBottom: 0 }}>
            Enter your credentials to lock in your predictions
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '24px',
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <button
            onClick={() => { setActiveTab('login'); setError(''); setPin(''); }}
            style={{
              flex: 1,
              padding: '14px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              background: activeTab === 'login' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'login' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            Log In
          </button>
          {!registrationClosed && (
            <button
              onClick={() => { setActiveTab('register'); setError(''); setPin(''); }}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                background: activeTab === 'register' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'register' ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              Register Profile
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeTab === 'login' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Select Your Profile
              </label>
              <select
                className="input-field"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{ padding: '10px', fontSize: '0.9rem' }}
                required
              >
                <option value="" disabled>Choose your name...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.username}>{u.username}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Create Username
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Kalle"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                style={{ padding: '10px' }}
                required
                maxLength={50}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              6-Digit PIN Code
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              className="input-field"
              placeholder="••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{
                padding: '10px',
                textAlign: 'center',
                fontSize: '1.2rem',
                letterSpacing: '8px',
                fontWeight: 'bold',
              }}
              required
              maxLength={6}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '6px', textAlign: 'center' }}>
              {activeTab === 'login' ? 'Enter your existing security PIN' : 'Set a PIN code to secure your profile predictions'}
            </span>
          </div>

          {activeTab === 'register' && (() => {
            const beerCount = users.filter(u => u.beers_in).length + (beersIn ? 1 : 0);
            const winner = Math.round(beerCount * 0.7);
            const second = Math.round(beerCount * 0.2);
            const third = beerCount - winner - second;
            return (
              <div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={beersIn}
                    onChange={e => setBeersIn(e.target.checked)}
                    style={{ marginTop: '3px', accentColor: 'var(--primary)', width: '16px', height: '16px', flexShrink: 0, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, lineHeight: '1.4' }}>
                    I'm in for the beer pool 🍺
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '2px' }}>
                      Each participant brings one beer — winner takes most!
                    </span>
                  </span>
                </label>
                {beerCount > 0 && (
                  <div style={{
                    marginTop: '10px', padding: '10px 14px',
                    background: 'rgba(94,106,210,0.08)', border: '1px solid rgba(94,106,210,0.2)',
                    borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)',
                  }}>
                    With <strong style={{ color: 'white' }}>{beerCount}</strong> player{beerCount !== 1 ? 's' : ''} in the pool:{' '}
                    <strong style={{ color: '#FFD700' }}>🥇 {winner} beer{winner !== 1 ? 's' : ''}</strong> ·{' '}
                    <strong style={{ color: '#C0C0C0' }}>🥈 {second} beer{second !== 1 ? 's' : ''}</strong> ·{' '}
                    <strong style={{ color: '#CD7F32' }}>🥉 {third} beer{third !== 1 ? 's' : ''}</strong>
                  </div>
                )}
              </div>
            );
          })()}

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#f87171',
              fontSize: '0.8rem',
              textAlign: 'center',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              padding: '12px',
              fontSize: '0.95rem',
              fontWeight: 700,
              marginTop: '8px',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Authenticating...' : activeTab === 'login' ? 'Unlock predictions' : 'Create & Log In'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes modalScale {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
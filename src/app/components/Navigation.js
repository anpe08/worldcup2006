'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AuthModal from './AuthModal';

export default function Navigation() {
  const [activeId, setActiveId] = useState('');
  const [activeUsername, setActiveUsername] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const id = localStorage.getItem('simUserId');
    const name = localStorage.getItem('simUsername');
    if (id) {
      setActiveId(id);
      setActiveUsername(name || '');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('simUserId');
    localStorage.removeItem('simUsername');
    localStorage.removeItem('simUserPin');
    setActiveId('');
    setActiveUsername('');
    setShowAuthModal(true);
    window.location.reload();
  };

  const handleAuthSuccess = (id, name, pin) => {
    setActiveId(id);
    setActiveUsername(name);
    setShowAuthModal(false);
    window.location.reload();
  };

  const links = [
    { href: '/', label: 'Matches' },
    { href: '/groups', label: 'Groups' },
    { href: '/predictions', label: 'Predictions' },
    { href: '/finaleight', label: 'Final Eight' },
    { href: '/goalscorers', label: 'Goalscorers' },
    { href: '/details', label: 'Details' },
    { href: '/stats', label: '📊 Stats' },
    { href: '/leaderboard', label: '🏆 Leaderboard' },
  ];

  return (
    <nav className="nav-container" style={{
      padding: '0 32px',
      height: 'var(--nav-height)',
      background: 'rgba(11,15,25,0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="nav-left" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ fontWeight: '900', fontSize: '1.4rem', color: 'var(--primary)', letterSpacing: '-0.5px' }}>
          ⚽ CupPredict
        </div>
        <div className="nav-links-wrapper" style={{ display: 'flex', gap: '4px', fontSize: '0.9rem', fontWeight: '500' }}>
          {links.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(94,106,210,0.2)' : 'transparent',
                  border: isActive ? '1px solid rgba(94,106,210,0.4)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {activeId ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Playing as:</span>
            <span style={{ 
              fontWeight: '700', 
              fontSize: '0.9rem', 
              color: 'white',
              background: 'rgba(94,106,210,0.12)',
              border: '1px solid rgba(94,106,210,0.25)',
              padding: '4px 12px',
              borderRadius: '20px',
            }}>{activeUsername}</span>
            <button 
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="btn-primary"
            style={{ padding: '10px 18px', fontSize: '1rem', fontWeight: 600 }}
          >
            Sign In / Register
          </button>
        )}
      </div>

      {showAuthModal && <AuthModal onLoginSuccess={handleAuthSuccess} />}

      <style>{`
        @media (max-width: 1100px) {
          .nav-container, .nav-left, .nav-links-wrapper, .nav-right {
            flex-direction: column !important;
            height: auto !important;
            width: 100%;
          }
        }
      `}</style>
    </nav>
  );
}

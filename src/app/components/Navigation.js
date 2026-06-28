'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import AuthModal from './AuthModal';

export default function Navigation() {
  const [activeId, setActiveId] = useState('');
  const [activeUsername, setActiveUsername] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef(null);

  useEffect(() => {
    const id = localStorage.getItem('simUserId');
    const name = localStorage.getItem('simUsername');
    if (id) {
      setActiveId(id);
      setActiveUsername(name || '');
    }
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menuOpen]);

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('simUserId');
    localStorage.removeItem('simUsername');
    localStorage.removeItem('simUserPin');
    setActiveId('');
    setActiveUsername('');
    setShowAuthModal(true);
    window.location.reload();
  };

  const handleAuthSuccess = (id, name) => {
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
    { href: '/saali', label: '🏅 Säälipleijarit' },
  ];

  return (
    <nav ref={menuRef} className="nav-container" style={{
      background: 'rgba(11,15,25,0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Main bar */}
      <div style={{
        height: 'var(--nav-height)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px',
      }}>
        {/* Brand + desktop links */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', minWidth: 0 }}>
          <div style={{ fontWeight: '900', fontSize: '1.4rem', color: 'var(--primary)', letterSpacing: '-0.5px', flexShrink: 0 }}>
            ⚽ CupPredict
          </div>
          {/* Desktop nav links */}
          <div className="desktop-nav-links" style={{ display: 'flex', gap: '4px', fontSize: '0.9rem', fontWeight: '500' }}>
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
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right side: auth + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Auth — hide text label on small screens */}
          {activeId ? (
            <div className="auth-block" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="playing-as-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Playing as:</span>
              <span style={{
                fontWeight: '700',
                fontSize: '0.9rem',
                color: 'white',
                background: 'rgba(94,106,210,0.12)',
                border: '1px solid rgba(94,106,210,0.25)',
                padding: '4px 12px',
                borderRadius: '20px',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
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
                  minHeight: '36px',
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.9rem', fontWeight: 600 }}
            >
              Sign In
            </button>
          )}

          {/* Hamburger button — shown on mobile only via CSS */}
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            style={{
              display: 'none', // overridden by CSS media query on mobile
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '5px',
              width: '44px',
              height: '44px',
              background: menuOpen ? 'rgba(94,106,210,0.2)' : 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              padding: '10px',
              flexShrink: 0,
            }}
          >
            <span style={{ display: 'block', width: '18px', height: '2px', background: 'white', borderRadius: '2px', transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: '18px', height: '2px', background: 'white', borderRadius: '2px', transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: '18px', height: '2px', background: 'white', borderRadius: '2px', transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="mobile-menu" style={{
          borderTop: '1px solid var(--border)',
          padding: '8px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}>
          {links.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: '12px 12px',
                  borderRadius: '8px',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(94,106,210,0.12)' : 'transparent',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '1rem',
                  textDecoration: 'none',
                  display: 'block',
                  minHeight: '44px',
                  lineHeight: '20px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}

      {showAuthModal && <AuthModal onLoginSuccess={handleAuthSuccess} />}

      <style>{`
        @media (min-width: 1025px) {
          .hamburger-btn { display: none !important; }
          .mobile-menu { display: none !important; }
          .desktop-nav-links { display: flex !important; }
        }
        @media (max-width: 1024px) {
          .hamburger-btn { display: flex !important; }
          .desktop-nav-links { display: none !important; }
          .playing-as-label { display: none !important; }
        }
      `}</style>
    </nav>
  );
}

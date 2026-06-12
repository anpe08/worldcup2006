'use client';
import { useState, useEffect } from 'react';
import Flag from '../components/Flag';

const KO_COLUMNS = [
  { key: 'winner',  label: 'Champion'   },
  { key: 'silver',  label: 'Runner-Up'  },
  { key: 'bronze',  label: '3rd Place'  },
  { key: 'fourth',  label: '4th Place'  },
  { key: 'qf1',     label: 'QF 1'       },
  { key: 'qf2',     label: 'QF 2'       },
  { key: 'qf3',     label: 'QF 3'       },
  { key: 'qf4',     label: 'QF 4'       },
];

const AWARDS_COLUMNS = [
  { key: 'top_scorer',  label: 'Golden Boot',         isPlayer: true  },
  { key: 'top_country', label: 'Top Scoring Country', isCountry: true },
  { key: 'player_1',   label: 'Goalscorer 1',         isPlayer: true  },
  { key: 'player_2',   label: 'Goalscorer 2',         isPlayer: true  },
  { key: 'player_3',   label: 'Goalscorer 3',         isPlayer: true  },
];

function TeamCell({ team }) {
  if (!team) return <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.8rem' }}>—</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
      <Flag team={team} style={{ height: '11px', marginRight: 0, marginLeft: 0, flexShrink: 0 }} />
      <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{team}</span>
    </span>
  );
}

function TextCell({ value }) {
  if (!value) return <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.8rem' }}>—</span>;
  return <span style={{ fontSize: '0.82rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{value}</span>;
}

function UserTable({ rows, columns, userId, renderCell }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: '600px' }}>
        <thead>
          <tr style={{ background: 'rgba(94,106,210,0.1)', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: 'white', fontWeight: 800, fontSize: '0.85rem', position: 'sticky', left: 0, background: 'rgba(20,24,40,0.98)', zIndex: 1, whiteSpace: 'nowrap' }}>
              Player
            </th>
            {columns.map(col => (
              <th key={col.key} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--primary)', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isMe = String(row.id) === String(userId);
            return (
              <tr
                key={row.id}
                style={{
                  borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: isMe ? 'rgba(94,106,210,0.07)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                }}
              >
                <td style={{
                  padding: '12px 16px',
                  fontWeight: isMe ? 700 : 500,
                  color: isMe ? 'white' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  position: 'sticky',
                  left: 0,
                  background: isMe ? 'rgba(30,35,65,0.98)' : i % 2 === 0 ? 'rgba(11,15,25,0.98)' : 'rgba(20,22,35,0.98)',
                  zIndex: 1,
                  boxShadow: '2px 0 6px rgba(0,0,0,0.3)',
                }}>
                  {row.username}
                  {isMe && <span style={{ marginLeft: '6px', fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 700 }}>you</span>}
                </td>
                {columns.map(col => (
                  <td key={col.key} style={{ padding: '12px 14px', color: 'white' }}>
                    {renderCell(row, col)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Details() {
  const [userId, setUserId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem('simUserId');
    if (id) setUserId(id);
    fetch('/api/details')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRows(data); })
      .finally(() => setLoading(false));
  }, []);

  if (!userId) {
    return (
      <div style={{ margin: '40px auto', maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: 'rgba(94,106,210,0.08)', borderRadius: '12px', border: '1px solid rgba(94,106,210,0.2)' }}>
        <span style={{ fontSize: '2rem' }}>🔒</span>
        <div>
          <h2 style={{ color: 'white', fontSize: '1.1rem', margin: '0 0 4px 0' }}>Authentication Required</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>
            Please click <strong>"Sign In / Register"</strong> in the top right first.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-secondary)' }}>⏳ Loading predictions…</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <div>
        <h1 className="page-title">Prediction Details</h1>
        <p className="page-subtitle">Everyone's knockout picks — Champion through to the Quarter-Finalists.</p>
        <UserTable
          rows={rows}
          columns={KO_COLUMNS}
          userId={userId}
          renderCell={(row, col) => <TeamCell team={row[col.key]} />}
        />
      </div>

      <div>
        <h2 style={{ color: 'white', fontSize: '1.3rem', fontWeight: 800, margin: '0 0 6px 0' }}>Awards & Goalscorers</h2>
        <p className="page-subtitle" style={{ marginBottom: '16px' }}>Golden Boot, Top Country, and personal goalscorer picks.</p>
        <UserTable
          rows={rows}
          columns={AWARDS_COLUMNS}
          userId={userId}
          renderCell={(row, col) =>
            col.isCountry
              ? <TeamCell team={row[col.key]} />
              : <TextCell value={row[col.key]} />
          }
        />
      </div>
    </div>
  );
}

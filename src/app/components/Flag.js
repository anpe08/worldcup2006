'use client';

import FLAGS from '@/lib/flags';

export default function Flag({ team, style }) {
  const code = FLAGS[team];
  if (!code) return null;

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={`${team} flag`}
      style={{
        height: '14px',
        width: 'auto',
        display: 'inline-block',
        verticalAlign: 'middle',
        borderRadius: '2px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
        marginRight: '8px',
        marginLeft: '4px',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

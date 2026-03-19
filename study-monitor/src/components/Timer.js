// src/components/Timer.js
import React, { useState, useEffect, useRef } from 'react';
import { T, font } from '../utils/design';

export default function Timer({ running, limit = 1800, onTimeout }) {
  const [secs, setSecs] = useState(limit);
  const ref = useRef(null);

  useEffect(() => {
    setSecs(limit);
  }, [limit]);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) { clearInterval(ref.current); onTimeout?.(); return 0; }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running, onTimeout]);

  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  const pct = (secs / limit) * 100;
  const col = pct > 50 ? T.green : pct > 20 ? T.accent : T.red;
  const r = 22;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: 56, height: 56 }}>
        <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="28" cy="28" r={r} fill="none" stroke={T.s4} strokeWidth="4" />
          <circle
            cx="28" cy="28" r={r} fill="none" stroke={col} strokeWidth="4"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            style={{ transition: 'stroke-dashoffset 0.9s, stroke 0.4s' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: font.mono, fontSize: 10, color: col, fontWeight: 700,
        }}>{m}:{s}</div>
      </div>
      <div>
        <div style={{ fontFamily: font.mono, fontSize: 22, fontWeight: 700, color: col, lineHeight: 1 }}>{m}:{s}</div>
        <div style={{ fontFamily: font.mono, fontSize: 9, color: T.muted, marginTop: 2, letterSpacing: 1 }}>REMAINING</div>
      </div>
    </div>
  );
}

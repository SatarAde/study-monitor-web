// src/utils/design.js — Design tokens + shared React atoms

export const T = {
  bg:        '#080912',
  s1:        '#0d0e1c',
  s2:        '#131426',
  s3:        '#1c1e30',
  s4:        '#24263a',
  border:    '#2a2c42',
  borderHi:  '#3a3d58',
  accent:    '#f0b429',
  accentLo:  '#f0b42912',
  accentMid: '#f0b42930',
  blue:      '#5b8dee',
  blueLo:    '#5b8dee14',
  green:     '#22c97a',
  greenLo:   '#22c97a14',
  red:       '#f04452',
  redLo:     '#f0445214',
  purple:    '#9b7bf4',
  purpleLo:  '#9b7bf414',
  text:      '#eceaf8',
  sub:       '#8f8daa',
  muted:     '#4e4d66',
};

export const font = {
  display: "'Outfit', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

// ── Atoms ─────────────────────────────────────────────────────
import React, { useState } from 'react';

export function Btn({ children, onClick, variant = 'primary', disabled, sm, style = {} }) {
  const [hover, setHover] = useState(false);
  const base = {
    padding: sm ? '6px 14px' : '10px 22px',
    borderRadius: 9,
    fontFamily: font.display,
    fontWeight: 600,
    fontSize: sm ? 12 : 14,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    border: 'none',
    transition: 'all .15s',
    letterSpacing: 0.2,
    outline: 'none',
  };
  const variants = {
    primary: { background: hover ? '#f5c040' : T.accent, color: '#000' },
    ghost:   { background: hover ? T.s4 : 'transparent', color: T.text, border: `1px solid ${T.border}` },
    danger:  { background: hover ? '#f55' : T.red, color: '#fff' },
    success: { background: hover ? '#2de' : T.green, color: '#000' },
    blue:    { background: hover ? '#7aa' : T.blue, color: '#fff' },
    dim:     { background: hover ? T.s4 : T.s3, color: T.sub, border: `1px solid ${T.border}` },
  };
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ ...base, ...(variants[variant] || {}), ...style }}
    >{children}</button>
  );
}

export function Badge({ children, color = T.accent }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
      borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
      fontFamily: font.mono, textTransform: 'uppercase',
      background: color + '18', color, border: `1px solid ${color}28`,
    }}>{children}</span>
  );
}

export function Card({ children, style = {}, glow }) {
  return (
    <div style={{
      background: T.s1, border: `1px solid ${glow ? glow + '50' : T.border}`,
      borderRadius: 14, padding: 22,
      boxShadow: glow ? `0 0 24px ${glow}12` : '0 2px 8px #00000030',
      ...style,
    }}>{children}</div>
  );
}

export function Label({ children, style = {} }) {
  return (
    <div style={{
      fontFamily: font.mono, fontSize: 10, color: T.muted,
      letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 7,
      ...style,
    }}>{children}</div>
  );
}

export function Input({ value, onChange, placeholder, type = 'text', style = {} }) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{
        width: '100%', background: T.s2, color: T.text,
        border: `1px solid ${T.border}`, borderRadius: 9,
        padding: '9px 13px', fontFamily: font.display, fontSize: 14,
        boxSizing: 'border-box', outline: 'none',
        ...style,
      }}
    />
  );
}

export function Textarea({ value, onChange, placeholder, rows = 5, style = {} }) {
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{
        width: '100%', background: T.s2, color: T.text,
        border: `1px solid ${T.border}`, borderRadius: 9,
        padding: '9px 13px', fontFamily: font.display, fontSize: 13,
        boxSizing: 'border-box', outline: 'none', resize: 'vertical', lineHeight: 1.7,
        ...style,
      }}
    />
  );
}

export function Select({ value, onChange, children, style = {} }) {
  return (
    <select
      value={value} onChange={onChange}
      style={{
        width: '100%', background: T.s2, color: T.text,
        border: `1px solid ${T.border}`, borderRadius: 9,
        padding: '9px 13px', fontFamily: font.display, fontSize: 14, outline: 'none',
        ...style,
      }}
    >{children}</select>
  );
}

export function Divider() {
  return <div style={{ height: 1, background: T.border, margin: '4px 0' }} />;
}

export function Spinner() {
  return (
    <div style={{
      width: 36, height: 36, border: `3px solid ${T.s4}`,
      borderTopColor: T.accent, borderRadius: '50%',
      animation: 'spin 0.9s linear infinite',
    }} />
  );
}

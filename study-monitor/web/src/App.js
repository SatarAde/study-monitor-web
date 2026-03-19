// src/App.js
import React, { useState, useEffect } from 'react';
import AdminScreen from './screens/AdminScreen';
import StudentScreen from './screens/StudentScreen';
import { T, font, Btn, Card } from './utils/design';

const ADMIN_PIN_KEY = 'sm_admin_pin';
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: ${T.bg}; color: ${T.text}; }
  body { font-family: 'Outfit', sans-serif; -webkit-font-smoothing: antialiased; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.2} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:none} }
  select option { background: ${T.s2}; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
  input, textarea, select { outline: none; color-scheme: dark; }
  input:focus, textarea:focus, select:focus { border-color: ${T.accent} !important; }
  input[type=date]::-webkit-calendar-picker-indicator,
  input[type=time]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
`;

// ── PIN Setup / Login ─────────────────────────────────────────
function PinGate({ onSuccess }) {
  const [pin, setPin]         = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError]     = useState('');
  const stored                = localStorage.getItem(ADMIN_PIN_KEY);
  const isSetup               = !stored;

  const submit = () => {
    if (isSetup) {
      if (pin.length < 4) { setError('PIN must be at least 4 digits'); return; }
      if (pin !== confirm) { setError('PINs do not match'); return; }
      localStorage.setItem(ADMIN_PIN_KEY, pin);
      onSuccess();
    } else {
      if (pin === stored) { onSuccess(); }
      else { setError('Incorrect PIN'); setPin(''); }
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: T.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <Card style={{ width: '100%', maxWidth: 360, textAlign: 'center', padding: 36 }}>
        <div style={{ fontSize: 44, marginBottom: 14 }}>🔐</div>
        <div style={{ fontFamily: font.mono, fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 6 }}>
          ADMIN ACCESS
        </div>
        <h2 style={{ fontFamily: font.display, fontSize: 20, color: T.text, marginBottom: 6 }}>
          {isSetup ? 'Set Your Admin PIN' : 'Enter Admin PIN'}
        </h2>
        <p style={{ fontFamily: font.display, fontSize: 13, color: T.sub, lineHeight: 1.6, marginBottom: 24 }}>
          {isSetup
            ? 'This PIN protects admin access. Only you should know it.'
            : 'Enter your PIN to access admin controls.'}
        </p>
        <input
          type="password" value={pin} onChange={e => setPin(e.target.value)}
          placeholder="Enter PIN"
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{
            width: '100%', background: T.s2, color: T.text, border: `1px solid ${T.border}`,
            borderRadius: 9, padding: '10px 14px', fontFamily: font.mono, fontSize: 18,
            letterSpacing: 6, textAlign: 'center', marginBottom: 10,
          }}
        />
        {isSetup && (
          <input
            type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Confirm PIN"
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={{
              width: '100%', background: T.s2, color: T.text, border: `1px solid ${T.border}`,
              borderRadius: 9, padding: '10px 14px', fontFamily: font.mono, fontSize: 18,
              letterSpacing: 6, textAlign: 'center', marginBottom: 10,
            }}
          />
        )}
        {error && (
          <div style={{ fontFamily: font.mono, fontSize: 11, color: T.red, marginBottom: 10 }}>{error}</div>
        )}
        <Btn onClick={submit} style={{ width: '100%', marginTop: 4 }}>
          {isSetup ? 'Set PIN & Enter' : 'Unlock Admin'}
        </Btn>
      </Card>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────
export default function App() {
  const [view, setView]           = useState('student');   // 'student' | 'admin'
  const [adminUnlocked, setAdmin] = useState(false);
  const [showPinGate, setPinGate] = useState(false);

  const switchToAdmin = () => {
    if (adminUnlocked) { setView('admin'); }
    else { setPinGate(true); }
  };

  const onPinSuccess = () => {
    setAdmin(true);
    setPinGate(false);
    setView('admin');
  };

  if (showPinGate) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <PinGate onSuccess={onPinSuccess} />
    </>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight: '100vh', background: T.bg }}>

        {/* Top bar */}
        <div style={{
          background: T.s1, borderBottom: `1px solid ${T.border}`,
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{
            maxWidth: 760, margin: '0 auto', padding: '0 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 56,
          }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, background: T.accent, borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: font.mono, fontWeight: 700, fontSize: 16, color: '#000',
              }}>S</div>
              <div>
                <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: T.text, letterSpacing: 0.3 }}>
                  Study Monitor
                </div>
                <div style={{ fontFamily: font.mono, fontSize: 9, color: T.muted, letterSpacing: 1.2 }}>
                  ACCOUNTABILITY PLATFORM
                </div>
              </div>
            </div>

            {/* Mode toggle */}
            <div style={{
              display: 'flex', gap: 3, background: T.s2,
              padding: 3, borderRadius: 9, border: `1px solid ${T.border}`,
            }}>
              <button onClick={() => setView('student')} style={{
                padding: '5px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontFamily: font.display, fontSize: 12, fontWeight: 600,
                background: view === 'student' ? T.blue : 'transparent',
                color: view === 'student' ? '#fff' : T.sub,
                transition: 'all .15s',
              }}>Student</button>
              <button onClick={switchToAdmin} style={{
                padding: '5px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontFamily: font.display, fontSize: 12, fontWeight: 600,
                background: view === 'admin' ? T.accent : 'transparent',
                color: view === 'admin' ? '#000' : T.sub,
                transition: 'all .15s',
              }}>Admin 🔒</button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{
          maxWidth: 760, margin: '0 auto', padding: '28px 20px 80px',
          animation: 'fadeIn .3s ease',
        }}>
          {view === 'admin' ? <AdminScreen /> : <StudentScreen />}
        </div>
      </div>
    </>
  );
}

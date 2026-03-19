// src/components/VoiceInput.js
import React, { useState, useRef } from 'react';
import { T, font, Btn, Label } from '../utils/design';

export default function VoiceInput({ value, onChange }) {
  const [recording, setRecording] = useState(false);
  const [interim, setInterim]     = useState('');
  const recRef                    = useRef(null);

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Speech recognition requires Chrome browser. Please type your answer instead.');
      return;
    }
    const r = new SR();
    r.continuous      = true;
    r.interimResults  = true;
    r.lang            = 'en-NG'; // Nigerian English accent
    r.onresult = e => {
      let fin = '', inter = '';
      for (const res of e.results) {
        if (res.isFinal) fin += res[0].transcript + ' ';
        else inter += res[0].transcript;
      }
      if (fin.trim()) onChange(prev => (prev + ' ' + fin).trim());
      setInterim(inter);
    };
    r.onend = () => { setRecording(false); setInterim(''); };
    r.onerror = () => { setRecording(false); setInterim(''); };
    r.start();
    recRef.current = r;
    setRecording(true);
    setInterim('');
  };

  const stop = () => {
    recRef.current?.stop();
    setRecording(false);
    setInterim('');
  };

  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Record controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Btn
          variant={recording ? 'danger' : 'ghost'} sm
          onClick={recording ? stop : start}
          style={{ minWidth: 140 }}
        >
          {recording ? '⏹  Stop Recording' : '🎙  Speak Answer'}
        </Btn>
        {recording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: font.mono, fontSize: 11, color: T.red }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: T.red,
              display: 'inline-block', animation: 'pulse 1s infinite',
            }} />
            RECORDING — speak clearly in English
          </div>
        )}
      </div>

      {/* Live transcript box */}
      {(recording || interim) && (
        <div style={{
          background: T.s2, border: `1px solid ${T.blue}40`,
          borderRadius: 9, padding: '10px 14px', minHeight: 44,
        }}>
          <div style={{
            fontFamily: font.mono, fontSize: 9, color: T.blue,
            letterSpacing: 1.5, marginBottom: 5,
          }}>LIVE TRANSCRIPT — AI is reading your words</div>
          <div style={{ fontFamily: font.display, fontSize: 13, lineHeight: 1.7 }}>
            <span style={{ color: T.text }}>{value}</span>
            {interim && (
              <span style={{ color: T.sub, fontStyle: 'italic' }}> {interim}</span>
            )}
          </div>
        </div>
      )}

      {/* Text area */}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Your answer will appear here as you speak. You can also type directly or edit what was transcribed..."
        rows={5}
        style={{
          width: '100%', background: T.s2, color: T.text,
          border: `1px solid ${T.border}`, borderRadius: 9,
          padding: '10px 13px', fontFamily: font.display, fontSize: 13,
          boxSizing: 'border-box', outline: 'none', resize: 'vertical', lineHeight: 1.7,
        }}
      />

      {/* Word count + clear */}
      {value && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: font.mono, fontSize: 10, color: T.muted }}>
            {wordCount} word{wordCount !== 1 ? 's' : ''}
          </span>
          <Btn variant="dim" sm onClick={() => onChange('')}>Clear</Btn>
        </div>
      )}
    </div>
  );
}

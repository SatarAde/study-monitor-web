// src/components/AlarmManager.js
import React, { useState, useEffect } from 'react';
import { T, font, Btn, Card, Label, Input, Select } from '../utils/design';

export default function AlarmManager({ alarms, onAdd, onRing, onDelete }) {
  const [time, setTime]     = useState('');
  const [label, setLabel]   = useState('');
  const [repeat, setRepeat] = useState('daily');

  // Auto-check alarms every 30 seconds
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const cur = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      alarms.forEach(a => { if (a.active && a.time === cur) onRing(a.id, a.label); });
    };
    const iv = setInterval(check, 30000);
    return () => clearInterval(iv);
  }, [alarms, onRing]);

  const add = () => {
    if (!time) return;
    onAdd({ time, label: label || 'Study time!', repeat });
    setTime(''); setLabel('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <Label>Create Study Alarm</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <Label>Alarm Time</Label>
            <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <div>
            <Label>Repeat</Label>
            <Select value={repeat} onChange={e => setRepeat(e.target.value)}>
              <option value="once">Once</option>
              <option value="daily">Every day</option>
              <option value="weekdays">Weekdays only</option>
            </Select>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <Label>Label (optional)</Label>
          <Input
            value={label} onChange={e => setLabel(e.target.value)}
            placeholder="e.g. Morning study session — Mathematics"
          />
        </div>
        <Btn sm onClick={add} disabled={!time}>Add Alarm 🔔</Btn>
      </Card>

      {alarms.length > 0 && (
        <div>
          <Label>Active Alarms</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alarms.map(a => (
              <Card key={a.id} style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ fontFamily: font.mono, fontSize: 24, fontWeight: 700, color: T.accent }}>
                      {a.time}
                    </div>
                    <div>
                      <div style={{ fontFamily: font.display, fontSize: 14, color: T.text }}>{a.label}</div>
                      <div style={{ fontFamily: font.mono, fontSize: 10, color: T.muted, marginTop: 2 }}>
                        {a.repeat}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn variant="ghost" sm onClick={() => onRing(a.id, a.label)}>🔔 Ring now</Btn>
                    <Btn variant="dim" sm onClick={() => onDelete(a.id)}>✕</Btn>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

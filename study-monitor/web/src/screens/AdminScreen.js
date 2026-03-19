// src/screens/AdminScreen.js
import React, { useState, useEffect } from 'react';
import { T, font, Btn, Badge, Card, Label, Input, Select, Textarea, Divider } from '../utils/design';
import PDFManager from '../components/PDFManager';
import AlarmManager from '../components/AlarmManager';
import {
  createAssignment, subscribeAssignments, subscribeResults,
  subscribeBooks, subscribeAlarms,
  uploadBookPages, createAlarm, deleteAlarmDB, pushToStudent,
} from '../services/firebase';

const SUBJECTS = [
  'Mathematics','English Language','Biology','Chemistry','Physics',
  'Economics','Government','Literature in English','Geography',
  'Agricultural Science','Civic Education','Commerce','Accounting','Further Mathematics',
];

const TABS = [
  { id: 'assign',  label: '📋 Assign',  },
  { id: 'books',   label: '📚 Books',   },
  { id: 'alarms',  label: '🔔 Alarms',  },
  { id: 'results', label: '📊 Results', },
];

export default function AdminScreen() {
  const [tab, setTab]                 = useState('assign');
  const [assignMode, setAssignMode]   = useState('manual'); // 'manual' | 'pages'
  const [subject, setSubject]         = useState(SUBJECTS[0]);
  const [topic, setTopic]             = useState('');
  const [material, setMaterial]       = useState('');
  const [materialSource, setMatSrc]   = useState('');
  const [dueDate, setDueDate]         = useState('');
  const [timeLimit, setTimeLimit]     = useState(30);
  const [saving, setSaving]           = useState(false);
  const [savedMsg, setSavedMsg]       = useState('');

  const [assignments, setAssignments] = useState([]);
  const [results, setResults]         = useState([]);
  const [books, setBooks]             = useState([]);
  const [alarms, setAlarms]           = useState([]);

  // Local pages cache (books with pages array for PDF manager)
  const [localBooks, setLocalBooks]   = useState([]);

  useEffect(() => {
    const u1 = subscribeAssignments(setAssignments);
    const u2 = subscribeResults(setResults);
    const u3 = subscribeBooks(setBooks);
    const u4 = subscribeAlarms(setAlarms);
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const handleUpload = async (name, totalPages, pages) => {
    const bookData = await uploadBookPages(pages, name, totalPages);
    // Keep pages in memory for page extraction
    setLocalBooks(prev => [{ ...bookData, pages }, ...prev]);
  };

  const handleExtract = (text, source) => {
    setMaterial(text);
    setMatSrc(source);
    setAssignMode('manual');
    setTab('assign');
  };

  const assign = async () => {
    if (!topic.trim() || !material.trim()) return;
    setSaving(true);
    try {
      await createAssignment({
        subject, topic, material,
        materialSource: materialSource || 'Manual',
        dueDate, timeLimit: timeLimit * 60,
      });
      await pushToStudent({
        type: 'new_assignment',
        title: `📚 New Assignment: ${subject}`,
        body: topic,
      });
      setTopic(''); setMaterial(''); setMatSrc(''); setDueDate('');
      setSavedMsg('✓ Assigned & brother notified!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (e) {
      setSavedMsg('Error saving. Check Firebase config.');
      setTimeout(() => setSavedMsg(''), 4000);
    }
    setSaving(false);
  };

  const handleAddAlarm = async (data) => {
    await createAlarm(data);
  };

  const handleRingAlarm = async (id, label) => {
    await pushToStudent({ type: 'alarm', title: '⏰ Study Reminder!', body: label });
    // Browser notification too
    if (Notification.permission === 'granted') {
      new Notification('⏰ Alarm triggered', { body: `"${label}" sent to your brother's device.` });
    }
  };

  const handleDeleteAlarm = async (id) => {
    await deleteAlarmDB(id);
  };

  const resultFor = id => results.find(r => r.assignmentId === id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <Badge color={T.accent}>ADMIN</Badge>
            <Badge color={T.blue}>SATAR · TOKYO</Badge>
          </div>
          <h2 style={{ margin: 0, fontFamily: font.display, fontSize: 24, fontWeight: 700, color: T.text }}>
            Study Control Panel
          </h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: font.mono, fontSize: 10, color: T.muted }}>TOTAL ASSIGNED</div>
          <div style={{ fontFamily: font.mono, fontSize: 32, fontWeight: 700, color: T.accent }}>{assignments.length}</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 3, background: T.s2,
        padding: 4, borderRadius: 11, border: `1px solid ${T.border}`,
      }}>
        {TABS.map(t => (
          <button
            key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: font.display, fontSize: 12, fontWeight: 600,
              background: tab === t.id ? T.accent : 'transparent',
              color: tab === t.id ? '#000' : T.sub,
              transition: 'all .15s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── ASSIGN TAB ── */}
      {tab === 'assign' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn
              variant={assignMode === 'pages' ? 'primary' : 'ghost'} sm
              onClick={() => setAssignMode('pages')}
            >📄 From Uploaded Book</Btn>
            <Btn
              variant={assignMode === 'manual' ? 'primary' : 'ghost'} sm
              onClick={() => setAssignMode('manual')}
            >✏️ Type / Paste Material</Btn>
          </div>

          {assignMode === 'pages' && (
            localBooks.length === 0 && books.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📚</div>
                <div style={{ fontFamily: font.display, color: T.sub }}>No books uploaded yet.</div>
                <Btn variant="ghost" sm onClick={() => setTab('books')} style={{ marginTop: 12 }}>
                  Go to Books tab →
                </Btn>
              </Card>
            ) : (
              <PDFManager
                books={localBooks.length > 0 ? localBooks : books}
                onUpload={handleUpload}
                onExtract={handleExtract}
              />
            )
          )}

          {assignMode === 'manual' && (
            <Card>
              {materialSource && (
                <div style={{
                  background: T.accentLo, border: `1px solid ${T.accent}30`,
                  borderRadius: 8, padding: '8px 12px', marginBottom: 14,
                  fontFamily: font.mono, fontSize: 11, color: T.accent,
                }}>📄 Material source: {materialSource}</div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <Label>Subject</Label>
                  <Select value={subject} onChange={e => setSubject(e.target.value)}>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <Label>Topic Name</Label>
                <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Quadratic Equations" />
              </div>

              <div style={{ marginBottom: 14 }}>
                <Label>Test Time Limit</Label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[15, 20, 30, 45, 60].map(m => (
                    <button
                      key={m} onClick={() => setTimeLimit(m)}
                      style={{
                        padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
                        border: `1px solid ${timeLimit === m ? T.accent : T.border}`,
                        background: timeLimit === m ? T.accentLo : 'transparent',
                        color: timeLimit === m ? T.accent : T.sub,
                        fontFamily: font.mono, fontSize: 12,
                      }}
                    >{m} min</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <Label>Study Material</Label>
                <Textarea
                  value={material} onChange={e => setMaterial(e.target.value)} rows={8}
                  placeholder="Paste notes, textbook content, or extracted pages. The AI will generate questions from exactly this text."
                />
                {material && (
                  <div style={{ fontFamily: font.mono, fontSize: 10, color: T.muted, marginTop: 4 }}>
                    {material.trim().split(/\s+/).length} words · ~{Math.ceil(material.length / 250)} pages
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Btn onClick={assign} disabled={saving || !topic.trim() || !material.trim()}>
                  {saving ? 'Saving...' : 'Assign & Notify Brother 🔔'}
                </Btn>
                {savedMsg && (
                  <span style={{
                    fontFamily: font.mono, fontSize: 12,
                    color: savedMsg.startsWith('✓') ? T.green : T.red,
                  }}>{savedMsg}</span>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── BOOKS TAB ── */}
      {tab === 'books' && (
        <PDFManager
          books={localBooks.length > 0 ? localBooks : books}
          onUpload={handleUpload}
          onExtract={handleExtract}
        />
      )}

      {/* ── ALARMS TAB ── */}
      {tab === 'alarms' && (
        <AlarmManager
          alarms={alarms}
          onAdd={handleAddAlarm}
          onRing={handleRingAlarm}
          onDelete={handleDeleteAlarm}
        />
      )}

      {/* ── RESULTS TAB ── */}
      {tab === 'results' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {results.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
              <div style={{ fontFamily: font.display, color: T.sub }}>
                No results yet. Your brother hasn't completed any tests.
              </div>
            </Card>
          ) : results.map((r, i) => {
            const a = assignments.find(x => x.id === r.assignmentId) || {};
            return (
              <Card key={i} style={{ borderColor: r.passed ? T.green + '44' : T.red + '44' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
                      <Badge color={T.accent}>{a.subject || 'Unknown'}</Badge>
                      <Badge color={r.passed ? T.green : T.red}>{r.passed ? 'PASSED' : 'FAILED'}</Badge>
                    </div>
                    <div style={{ fontFamily: font.display, fontWeight: 600, color: T.text }}>{a.topic || '—'}</div>
                    <div style={{ fontFamily: font.mono, fontSize: 10, color: T.muted, marginTop: 3 }}>
                      {r.takenAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                    </div>
                  </div>
                  <div style={{ fontFamily: font.mono, fontSize: 36, fontWeight: 700, color: r.passed ? T.green : T.red }}>
                    {r.score}%
                  </div>
                </div>
                <div style={{
                  marginTop: 12, background: T.s2, borderRadius: 8, padding: '10px 13px',
                  fontFamily: font.display, fontSize: 13, color: T.sub, lineHeight: 1.6,
                }}>{r.feedback}</div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

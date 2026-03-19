// src/screens/StudentScreen.js
import React, { useState, useEffect } from 'react';
import { T, font, Btn, Badge, Card, Label, Spinner } from '../utils/design';
import Timer from '../components/Timer';
import VoiceInput from '../components/VoiceInput';
import { subscribeAssignments, subscribeResults, saveResult } from '../services/firebase';
import { generateQuestions, gradeAnswers } from '../services/claude';

export default function StudentScreen() {
  const [phase, setPhase]           = useState('home'); // home|study|test|grading|done
  const [assignments, setAssignments] = useState([]);
  const [results, setResults]       = useState([]);
  const [active, setActive]         = useState(null);
  const [questions, setQuestions]   = useState([]);
  const [qIdx, setQIdx]             = useState(0);
  const [answers, setAnswers]       = useState([]);
  const [curAnswer, setCurAnswer]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timedOut, setTimedOut]     = useState(false);

  useEffect(() => {
    const u1 = subscribeAssignments(setAssignments);
    const u2 = subscribeResults(setResults);
    return () => { u1(); u2(); };
  }, []);

  // Request notification permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const resultFor = id => results.find(r => r.assignmentId === id);
  const pending = assignments.filter(a => !resultFor(a.id) || resultFor(a.id)?.passed === false);

  const startTest = async a => {
    setActive(a); setLoading(true);
    const qs = await generateQuestions(a.subject, a.topic, a.material);
    setQuestions(qs); setQIdx(0); setAnswers([]); setCurAnswer('');
    setTimerRunning(true); setTimedOut(false);
    setPhase('test'); setLoading(false);
  };

  const submitAnswer = () => {
    if (!curAnswer.trim()) return;
    const updated = [...answers, {
      question: questions[qIdx].question,
      answer: curAnswer,
      keyPoints: questions[qIdx].keyPoints,
    }];
    setAnswers(updated); setCurAnswer('');
    if (qIdx + 1 < questions.length) { setQIdx(qIdx + 1); }
    else { grade(updated); }
  };

  const handleTimeout = () => {
    setTimedOut(true); setTimerRunning(false);
    const updated = [...answers, {
      question: questions[qIdx]?.question || '',
      answer: curAnswer || '[Time expired]',
      keyPoints: questions[qIdx]?.keyPoints || [],
    }];
    grade(updated);
  };

  const grade = async all => {
    setTimerRunning(false); setPhase('grading');
    const g = await gradeAnswers(active.subject, active.topic, all);
    const full = { ...g, assignmentId: active.id, answers: all };
    await saveResult(full);
    setResult(full); setPhase('done');
  };

  const reset = () => {
    setPhase('home'); setResult(null); setActive(null);
    setQuestions([]); setAnswers([]); setCurAnswer('');
  };

  // ── HOME ──
  if (phase === 'home') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Badge color={T.blue}>STUDENT PORTAL</Badge>
          <h2 style={{ margin: '6px 0 0', fontFamily: font.display, fontSize: 24, fontWeight: 700, color: T.text }}>
            My Assignments
          </h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: font.mono, fontSize: 10, color: T.muted }}>COMPLETED</div>
          <div style={{ fontFamily: font.mono, fontSize: 32, fontWeight: 700, color: T.green }}>
            {results.filter(r => r.passed).length}
          </div>
        </div>
      </div>

      {assignments.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 56 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🎓</div>
          <div style={{ fontFamily: font.display, color: T.sub, fontSize: 16 }}>
            No assignments yet. Your brother will assign topics from Tokyo.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {assignments.map((a, i) => {
            const res = resultFor(a.id);
            const isNew = i === 0 && !res;
            return (
              <Card key={a.id} glow={isNew ? T.accent : null}
                style={{ borderColor: isNew ? T.accent + '55' : T.border }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 5 }}>
                      <Badge color={T.accent}>{a.subject}</Badge>
                      {isNew && <Badge color={T.blue}>NEW</Badge>}
                      {res?.passed && <Badge color={T.green}>PASSED</Badge>}
                      {res && !res.passed && <Badge color={T.red}>FAILED — RETRY</Badge>}
                    </div>
                    <div style={{ fontFamily: font.display, fontWeight: 600, color: T.text, fontSize: 15 }}>
                      {a.topic}
                    </div>
                    <div style={{ fontFamily: font.mono, fontSize: 10, color: T.muted, marginTop: 3 }}>
                      {a.assignedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                      {a.dueDate && ` · Due ${a.dueDate}`}
                      {` · ${Math.round(a.timeLimit / 60)} min test`}
                    </div>
                    {res && (
                      <div style={{
                        fontFamily: font.mono, fontSize: 14, fontWeight: 700, marginTop: 4,
                        color: res.passed ? T.green : T.red,
                      }}>{res.score}%</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Btn sm onClick={() => { setActive(a); setPhase('study'); }}>Study 📖</Btn>
                    {!res?.passed && (
                      <Btn variant="blue" sm onClick={() => startTest(a)} disabled={loading}>
                        {loading ? '...' : 'Test 📝'}
                      </Btn>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── STUDY ──
  if (phase === 'study') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={() => setPhase('home')} style={{
          background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 22,
        }}>←</button>
        <div>
          <Badge color={T.accent}>{active.subject}</Badge>
          <h2 style={{ margin: '4px 0 0', fontFamily: font.display, fontSize: 20, color: T.text }}>{active.topic}</h2>
        </div>
      </div>

      <Card style={{ borderLeft: `3px solid ${T.accent}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Label style={{ marginBottom: 0 }}>Study Material</Label>
          {active.materialSource && (
            <span style={{ fontFamily: font.mono, fontSize: 9, color: T.muted }}>{active.materialSource}</span>
          )}
        </div>
        <div style={{
          fontFamily: font.display, fontSize: 13, color: T.text,
          lineHeight: 1.85, whiteSpace: 'pre-wrap',
          maxHeight: 420, overflowY: 'auto',
        }}>{active.material}</div>
      </Card>

      <Card style={{ background: T.accentLo, border: `1px solid ${T.accent}30` }}>
        <div style={{ fontFamily: font.display, fontSize: 13, color: T.text, lineHeight: 1.7 }}>
          <strong style={{ color: T.accent }}>📋 Test rules:</strong> You'll get{' '}
          <strong>5 questions</strong> generated from this material. You have{' '}
          <strong>{Math.round(active.timeLimit / 60)} minutes</strong>. You can{' '}
          <strong>speak</strong> or type. You need <strong>60% or above to pass</strong>.
          If you fail, distracting apps on your phone will be locked.
        </div>
      </Card>

      <Btn onClick={() => startTest(active)} disabled={loading} style={{ alignSelf: 'flex-start' }}>
        {loading ? 'Generating questions...' : "I've studied — Start Test →"}
      </Btn>
    </div>
  );

  // ── TEST ──
  if (phase === 'test') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: font.mono, fontSize: 10, color: T.muted, marginBottom: 6 }}>
            QUESTION {qIdx + 1} OF {questions.length}
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {questions.map((_, i) => (
              <div key={i} style={{
                width: 28, height: 5, borderRadius: 3,
                background: i < qIdx ? T.green : i === qIdx ? T.accent : T.s4,
                transition: 'background .3s',
              }} />
            ))}
          </div>
        </div>
        <Timer running={timerRunning} limit={active.timeLimit} onTimeout={handleTimeout} />
      </div>

      {timedOut && (
        <div style={{
          background: T.redLo, border: `1px solid ${T.red}40`,
          borderRadius: 9, padding: '10px 14px',
          fontFamily: font.mono, fontSize: 11, color: T.red,
        }}>⏰ Time's up — submitting your answers now...</div>
      )}

      <Card style={{ borderLeft: `3px solid ${T.blue}` }}>
        <Label>Question {qIdx + 1}</Label>
        <div style={{ fontFamily: font.display, fontSize: 17, color: T.text, lineHeight: 1.75 }}>
          {questions[qIdx]?.question}
        </div>
      </Card>

      <div>
        <Label>Your Answer — speak or type</Label>
        <VoiceInput value={curAnswer} onChange={setCurAnswer} />
      </div>

      <Btn onClick={submitAnswer} disabled={!curAnswer.trim()}>
        {qIdx + 1 === questions.length ? 'Submit Final Answer →' : 'Next Question →'}
      </Btn>
    </div>
  );

  // ── GRADING ──
  if (phase === 'grading') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', gap: 20 }}>
      <Spinner />
      <div style={{ fontFamily: font.display, color: T.sub, fontSize: 16 }}>Marking your answers...</div>
      <div style={{ fontFamily: font.mono, fontSize: 11, color: T.muted }}>This may take a few seconds</div>
    </div>
  );

  // ── DONE ──
  if (phase === 'done' && result) {
    const pass = result.passed;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Score card */}
        <Card style={{
          textAlign: 'center', padding: 40,
          background: pass ? T.greenLo : T.redLo,
          border: `2px solid ${pass ? T.green : T.red}`,
        }}>
          <div style={{ fontSize: 50, marginBottom: 10 }}>{pass ? '🎉' : '😞'}</div>
          <div style={{ fontFamily: font.mono, fontSize: 56, fontWeight: 700, color: pass ? T.green : T.red, lineHeight: 1 }}>
            {result.score}%
          </div>
          <div style={{
            fontFamily: font.display, fontSize: 20, fontWeight: 700,
            color: pass ? T.green : T.red, margin: '8px 0 14px',
          }}>
            {pass ? 'PASSED — Well done!' : 'FAILED — Keep going'}
          </div>
          <div style={{
            fontFamily: font.display, fontSize: 14, color: T.text,
            lineHeight: 1.75, maxWidth: 420, margin: '0 auto',
          }}>{result.feedback}</div>
        </Card>

        {/* Phone lock warning */}
        {!pass && (
          <Card style={{ background: '#120810', border: `1px solid ${T.red}40` }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 24 }}>🔒</div>
              <div>
                <div style={{ fontFamily: font.mono, fontSize: 11, color: T.red, fontWeight: 700, marginBottom: 4 }}>
                  PHONE RESTRICTIONS ACTIVE
                </div>
                <div style={{ fontFamily: font.display, fontSize: 13, color: T.sub, lineHeight: 1.65 }}>
                  Social media and games are now hidden on the mobile app. They will be restored when you score 60% or above. Review the material carefully and retake the test.
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Per-question breakdown */}
        {result.perQuestion && (
          <div>
            <Label>Question Breakdown</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.perQuestion.map((q, i) => (
                <Card key={i} style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: font.display, fontSize: 13, color: T.sub, lineHeight: 1.5, marginBottom: 4 }}>
                        <strong style={{ color: T.text }}>Q{i + 1}:</strong> {result.answers[i]?.question}
                      </div>
                      <div style={{ fontFamily: font.mono, fontSize: 10, color: T.muted }}>{q.comment}</div>
                    </div>
                    <div style={{
                      fontFamily: font.mono, fontSize: 18, fontWeight: 700,
                      color: q.score >= 12 ? T.green : T.red, whiteSpace: 'nowrap',
                    }}>{q.score}/20</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {!pass && <Btn variant="blue" onClick={() => startTest(active)}>Retake Test</Btn>}
          <Btn variant="ghost" onClick={reset}>Back to Assignments</Btn>
        </div>
      </div>
    );
  }

  return null;
}

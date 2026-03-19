// src/screens/StudentScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert,
} from 'react-native';
import Voice from 'react-native-voice';
import { subscribeAssignments, subscribeResults, saveResult } from '../services/firebase';
import { generateQuestions, gradeAnswers } from '../services/claude';

const C = {
  bg:'#080912',s1:'#0d0e1c',s2:'#131426',s3:'#1c1e30',
  border:'#2a2c42',accent:'#f0b429',accentLo:'#f0b42912',
  blue:'#5b8dee',blueLo:'#5b8dee14',
  green:'#22c97a',greenLo:'#22c97a14',
  red:'#f04452',redLo:'#f0445214',
  text:'#eceaf8',sub:'#8f8daa',muted:'#4e4d66',
};

// ── Timer ────────────────────────────────────────────────────
function Timer({ running, limit, onTimeout }: { running: boolean; limit: number; onTimeout: () => void }) {
  const [secs, setSecs] = useState(limit);
  const ref = useRef<ReturnType<typeof setInterval>|null>(null);
  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setSecs(s => { if (s <= 1) { clearInterval(ref.current!); onTimeout(); return 0; } return s - 1; });
      }, 1000);
    } else if (ref.current) clearInterval(ref.current);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);
  const m = String(Math.floor(secs/60)).padStart(2,'0');
  const s = String(secs%60).padStart(2,'0');
  const pct = secs/limit;
  const col = pct > 0.5 ? C.green : pct > 0.2 ? C.accent : C.red;
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: col, fontSize: 28, fontWeight: '700', fontFamily: 'monospace' }}>{m}:{s}</Text>
      <Text style={{ color: C.muted, fontSize: 9, letterSpacing: 1 }}>REMAINING</Text>
    </View>
  );
}

export default function StudentScreen({ onResult }: { onResult: (passed: boolean) => void }) {
  const [phase, setPhase]           = useState('home');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [results, setResults]       = useState<any[]>([]);
  const [active, setActive]         = useState<any>(null);
  const [questions, setQuestions]   = useState<any[]>([]);
  const [qIdx, setQIdx]             = useState(0);
  const [answers, setAnswers]       = useState<any[]>([]);
  const [curAnswer, setCurAnswer]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<any>(null);
  const [timerOn, setTimerOn]       = useState(false);
  const [recording, setRecording]   = useState(false);
  const [interim, setInterim]       = useState('');

  useEffect(() => {
    const u1 = subscribeAssignments(setAssignments);
    const u2 = subscribeResults(setResults);

    Voice.onSpeechResults = e => {
      const txt = e.value?.[0] || '';
      setCurAnswer(prev => (prev + ' ' + txt).trim());
      setInterim('');
    };
    Voice.onSpeechPartialResults = e => setInterim(e.value?.[0] || '');
    Voice.onSpeechEnd = () => setRecording(false);
    Voice.onSpeechError = () => setRecording(false);

    return () => { u1(); u2(); Voice.destroy().then(Voice.removeAllListeners); };
  }, []);

  const resultFor = (id: string) => results.find(r => r.assignmentId === id);

  const startRecording = async () => {
    try { await Voice.start('en-NG'); setRecording(true); setInterim(''); }
    catch { Alert.alert('Microphone error', 'Please grant microphone permission.'); }
  };
  const stopRecording = async () => { await Voice.stop(); setRecording(false); };

  const startTest = async (a: any) => {
    setActive(a); setLoading(true);
    const qs = await generateQuestions(a.subject, a.topic, a.material);
    setQuestions(qs); setQIdx(0); setAnswers([]); setCurAnswer('');
    setTimerOn(true); setPhase('test'); setLoading(false);
  };

  const submitAnswer = () => {
    if (!curAnswer.trim()) return;
    const updated = [...answers, { question: questions[qIdx].question, answer: curAnswer, keyPoints: questions[qIdx].keyPoints }];
    setAnswers(updated); setCurAnswer('');
    if (qIdx + 1 < questions.length) setQIdx(qIdx + 1);
    else doGrade(updated);
  };

  const handleTimeout = () => {
    setTimerOn(false);
    const updated = [...answers, { question: questions[qIdx]?.question||'', answer: curAnswer||'[Time expired]', keyPoints: [] }];
    doGrade(updated);
  };

  const doGrade = async (all: any[]) => {
    setTimerOn(false); setPhase('grading');
    const g = await gradeAnswers(active.subject, active.topic, all);
    const full = { ...g, assignmentId: active.id, answers: all };
    await saveResult(full);
    setResult(full); onResult(full.passed); setPhase('done');
  };

  const reset = () => { setPhase('home'); setResult(null); setActive(null); setQuestions([]); setAnswers([]); setCurAnswer(''); };

  // ── HOME ──
  if (phase === 'home') return (
    <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
      <Text style={s.pageTitle}>My Assignments</Text>
      {assignments.length === 0 ? (
        <View style={[s.card, { alignItems: 'center', paddingVertical: 48 }]}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🎓</Text>
          <Text style={{ color: C.sub }}>No assignments yet. Waiting for Tokyo...</Text>
        </View>
      ) : assignments.map((a, i) => {
        const res = resultFor(a.id);
        return (
          <View key={a.id} style={[s.card, { marginBottom: 10, borderColor: i===0&&!res ? C.accent+'55' : C.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.accent, fontSize: 10, fontWeight: '700', marginBottom: 3 }}>{a.subject}</Text>
                <Text style={{ color: C.text, fontWeight: '600', fontSize: 15, marginBottom: 3 }}>{a.topic}</Text>
                <Text style={{ color: C.muted, fontSize: 10 }}>
                  {Math.round(a.timeLimit/60)} min test{a.dueDate && ` · Due ${a.dueDate}`}
                </Text>
                {res && <Text style={{ color: res.passed?C.green:C.red, fontWeight:'700', fontSize:13, marginTop:4 }}>{res.score}% — {res.passed?'PASSED':'FAILED'}</Text>}
              </View>
              <View style={{ gap: 6 }}>
                <TouchableOpacity onPress={() => { setActive(a); setPhase('study'); }}
                  style={[s.btn, { paddingVertical: 7, paddingHorizontal: 14 }]}>
                  <Text style={[s.btnTxt, { fontSize: 12 }]}>Study 📖</Text>
                </TouchableOpacity>
                {!res?.passed && (
                  <TouchableOpacity onPress={() => startTest(a)} disabled={loading}
                    style={[s.btn, { backgroundColor: C.blue, paddingVertical: 7, paddingHorizontal: 14, opacity: loading?.5:1 }]}>
                    <Text style={[s.btnTxt, { fontSize: 12, color: '#fff' }]}>Test 📝</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  // ── STUDY ──
  if (phase === 'study') return (
    <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
      <TouchableOpacity onPress={() => setPhase('home')} style={{ marginBottom: 14 }}>
        <Text style={{ color: C.sub, fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>
      <Text style={{ color: C.accent, fontSize: 11, fontWeight: '700', marginBottom: 3 }}>{active?.subject}</Text>
      <Text style={s.pageTitle}>{active?.topic}</Text>
      <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: C.accent, marginBottom: 14 }]}>
        <Text style={{ color: C.text, fontSize: 13, lineHeight: 22 }}>{active?.material}</Text>
      </View>
      <View style={[s.card, { backgroundColor: C.accentLo, borderColor: C.accent+'33', marginBottom: 16 }]}>
        <Text style={{ color: C.text, fontSize: 13, lineHeight: 20 }}>
          <Text style={{ color: C.accent, fontWeight: '700' }}>📋 Rules: </Text>
          5 questions · {Math.round(active?.timeLimit/60)} minutes · 60% to pass · Speak or type
        </Text>
      </View>
      <TouchableOpacity onPress={() => startTest(active)} disabled={loading}
        style={[s.btn, { opacity: loading?.5:1 }]}>
        <Text style={s.btnTxt}>{loading ? 'Generating...' : "Ready — Start Test →"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ── TEST ──
  if (phase === 'test') return (
    <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View>
          <Text style={{ color: C.muted, fontSize: 10, letterSpacing: 1 }}>QUESTION {qIdx+1} OF {questions.length}</Text>
          <View style={{ flexDirection: 'row', gap: 5, marginTop: 6 }}>
            {questions.map((_,i) => (
              <View key={i} style={{ width: 28, height: 4, borderRadius: 2, backgroundColor: i<qIdx?C.green:i===qIdx?C.accent:C.s3 }} />
            ))}
          </View>
        </View>
        <Timer running={timerOn} limit={active.timeLimit} onTimeout={handleTimeout} />
      </View>

      <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: C.blue, marginBottom: 14 }]}>
        <Text style={{ color: C.muted, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>QUESTION {qIdx+1}</Text>
        <Text style={{ color: C.text, fontSize: 16, lineHeight: 26 }}>{questions[qIdx]?.question}</Text>
      </View>

      {/* Voice controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <TouchableOpacity onPress={recording ? stopRecording : startRecording}
          style={[s.btn, { backgroundColor: recording ? C.red : 'transparent', borderWidth:1, borderColor: recording?C.red:C.border, paddingHorizontal:16 }]}>
          <Text style={[s.btnTxt, { color: recording?'#fff':C.sub, fontSize:13 }]}>
            {recording ? '⏹ Stop' : '🎙 Speak'}
          </Text>
        </TouchableOpacity>
        {recording && <Text style={{ color: C.red, fontSize: 12 }}>● Recording...</Text>}
      </View>

      {/* Live transcript */}
      {(recording || interim) && (
        <View style={[s.card, { backgroundColor: C.blueLo||'#5b8dee14', borderColor: C.blue+'33', marginBottom: 10 }]}>
          <Text style={{ color: C.blue, fontSize: 9, letterSpacing: 1.5, marginBottom: 4 }}>LIVE TRANSCRIPT</Text>
          <Text style={{ color: C.text, fontSize: 13, lineHeight: 20 }}>
            {curAnswer}
            {interim ? <Text style={{ color: C.sub, fontStyle: 'italic' }}> {interim}</Text> : null}
          </Text>
        </View>
      )}

      <TextInput
        value={curAnswer} onChangeText={setCurAnswer} multiline
        numberOfLines={5} placeholder="Speak or type your answer here..."
        placeholderTextColor={C.muted}
        style={[s.input, { height: 120, textAlignVertical: 'top', marginBottom: 14 }]}
      />

      <TouchableOpacity onPress={submitAnswer} disabled={!curAnswer.trim()} style={[s.btn, { opacity: curAnswer.trim()?1:.4 }]}>
        <Text style={s.btnTxt}>{qIdx+1===questions.length ? 'Submit Final Answer →' : 'Next Question →'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ── GRADING ──
  if (phase === 'grading') return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor:C.bg }}>
      <Text style={{ fontSize: 40, marginBottom: 16 }}>⏳</Text>
      <Text style={{ color: C.sub, fontSize: 16 }}>Marking your answers...</Text>
    </View>
  );

  // ── DONE ──
  if (phase === 'done' && result) {
    const pass = result.passed;
    return (
      <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        <View style={[s.card, { alignItems: 'center', padding: 36, borderColor: pass?C.green:C.red, backgroundColor: pass?C.greenLo||'#22c97a14':C.redLo||'#f0445214' }]}>
          <Text style={{ fontSize: 48, marginBottom: 10 }}>{pass?'🎉':'😞'}</Text>
          <Text style={{ color: pass?C.green:C.red, fontSize: 52, fontWeight: '700', fontFamily: 'monospace' }}>{result.score}%</Text>
          <Text style={{ color: pass?C.green:C.red, fontSize: 18, fontWeight: '700', marginVertical: 8 }}>
            {pass ? 'PASSED — Well done!' : 'FAILED — Keep studying'}
          </Text>
          <Text style={{ color: C.text, fontSize: 14, lineHeight: 22, textAlign: 'center' }}>{result.feedback}</Text>
        </View>

        {!pass && (
          <View style={[s.card, { marginTop: 12, backgroundColor:'#120810', borderColor:C.red+'33' }]}>
            <Text style={{ color: C.red, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>🔒 PHONE RESTRICTIONS ACTIVE</Text>
            <Text style={{ color: C.sub, fontSize: 13, lineHeight: 20 }}>
              Social media and games have been hidden. They will be restored when you score 60% or above.
            </Text>
          </View>
        )}

        {result.perQuestion?.map((q: any, i: number) => (
          <View key={i} style={[s.card, { marginTop: 10 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: C.sub, fontSize: 12, flex: 1, lineHeight: 18 }}>
                <Text style={{ color: C.text, fontWeight: '600' }}>Q{i+1}: </Text>
                {result.answers[i]?.question}
              </Text>
              <Text style={{ color: q.score>=12?C.green:C.red, fontWeight:'700', fontSize:16, marginLeft:10 }}>{q.score}/20</Text>
            </View>
            <Text style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>{q.comment}</Text>
          </View>
        ))}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          {!pass && (
            <TouchableOpacity onPress={() => startTest(active)} style={[s.btn, { flex:1, backgroundColor:C.blue }]}>
              <Text style={[s.btnTxt, { color:'#fff' }]}>Retake Test</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={reset} style={[s.btn, { flex:1, backgroundColor:'transparent', borderWidth:1, borderColor:C.border }]}>
            <Text style={[s.btnTxt, { color:C.sub }]}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return null;
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#080912' },
  pageTitle: { color: '#eceaf8', fontWeight: '700', fontSize: 22, marginBottom: 16 },
  card: {
    backgroundColor: '#0d0e1c', borderWidth: 1, borderColor: '#2a2c42',
    borderRadius: 14, padding: 18,
  },
  input: {
    backgroundColor: '#131426', color: '#eceaf8', borderWidth: 1,
    borderColor: '#2a2c42', borderRadius: 9, padding: 10, fontSize: 14,
  },
  btn: {
    backgroundColor: '#f0b429', borderRadius: 9,
    paddingVertical: 11, paddingHorizontal: 20, alignItems: 'center',
  },
  btnTxt: { color: '#000', fontWeight: '700', fontSize: 14 },
});

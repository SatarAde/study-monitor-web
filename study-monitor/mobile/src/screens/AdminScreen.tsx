// src/screens/AdminScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert,
} from 'react-native';
import {
  subscribeAssignments, subscribeResults, subscribeBooks,
  subscribeAlarms, fetchBookPages,
} from '../services/firebase';
import { createAssignment, createAlarm, deleteAlarmDB, pushToStudent } from '../services/firebase';
import { ringNow } from '../services/notifications';
import { startBettingBlock, stopBettingBlock, isBettingBlockActive } from '../native/DeviceControl';

const C = {
  bg:'#080912',s1:'#0d0e1c',s2:'#131426',s3:'#1c1e30',s4:'#24263a',
  border:'#2a2c42',accent:'#f0b429',accentLo:'#f0b42912',
  blue:'#5b8dee',green:'#22c97a',greenLo:'#22c97a14',
  red:'#f04452',redLo:'#f0445214',
  text:'#eceaf8',sub:'#8f8daa',muted:'#4e4d66',
};

const SUBJECTS = [
  'Mathematics','English Language','Biology','Chemistry','Physics',
  'Economics','Government','Literature','Geography','Agricultural Science',
];

const TABS = ['Assign','Books','Alarms','Results'];

export default function AdminScreen() {
  const [tab, setTab]               = useState('Assign');
  const [subject, setSubject]       = useState(SUBJECTS[0]);
  const [topic, setTopic]           = useState('');
  const [material, setMaterial]     = useState('');
  const [dueDate, setDueDate]       = useState('');
  const [timeLimit, setTimeLimit]   = useState(30);
  const [saving, setSaving]         = useState(false);

  const [assignments, setAssignments] = useState<any[]>([]);
  const [results, setResults]         = useState<any[]>([]);
  const [books, setBooks]             = useState<any[]>([]);
  const [alarms, setAlarms]           = useState<any[]>([]);
  const [bettingActive, setBettingActive] = useState(false);

  // Alarm form
  const [alarmTime, setAlarmTime]   = useState('');
  const [alarmLabel, setAlarmLabel] = useState('');

  useEffect(() => {
    const u1 = subscribeAssignments(setAssignments);
    const u2 = subscribeResults(setResults);
    const u3 = subscribeBooks(setBooks);
    const u4 = subscribeAlarms(setAlarms);
    isBettingBlockActive().then(setBettingActive);
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const assign = async () => {
    if (!topic.trim() || !material.trim()) {
      Alert.alert('Missing fields', 'Please fill in topic and material.'); return;
    }
    setSaving(true);
    try {
      await createAssignment({ subject, topic, material, dueDate, timeLimit: timeLimit * 60 });
      await pushToStudent({ type: 'new_assignment', title: `📚 ${subject}`, body: topic });
      setTopic(''); setMaterial(''); setDueDate('');
      Alert.alert('Done!', 'Assignment created and brother notified.');
    } catch { Alert.alert('Error', 'Check your Firebase config.'); }
    setSaving(false);
  };

  const addAlarm = async () => {
    if (!alarmTime) { Alert.alert('Set a time first'); return; }
    await createAlarm({ time: alarmTime, label: alarmLabel || 'Study time!', repeat: 'daily' });
    setAlarmTime(''); setAlarmLabel('');
  };

  const ringAlarm = async (label: string) => {
    await ringNow('⏰ Study Reminder!', label);
    await pushToStudent({ type: 'alarm', title: '⏰ Study Reminder', body: label });
  };

  const toggleBetting = async () => {
    if (bettingActive) {
      await stopBettingBlock(); setBettingActive(false);
      Alert.alert('Betting blocker disabled');
    } else {
      const ok = await startBettingBlock();
      if (ok) { setBettingActive(true); Alert.alert('Betting sites blocked!', 'All Nigerian betting sites are now blocked across all browsers on this device.'); }
    }
  };

  const resultFor = (id: string) => results.find(r => r.assignmentId === id);

  return (
    <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
      {/* Tab bar */}
      <View style={s.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)}
            style={[s.tabBtn, tab === t && { backgroundColor: C.accent }]}>
            <Text style={[s.tabTxt, tab === t && { color: '#000' }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── ASSIGN ── */}
      {tab === 'Assign' && (
        <View style={s.card}>
          <Text style={s.label}>SUBJECT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {SUBJECTS.map(sub => (
                <TouchableOpacity key={sub} onPress={() => setSubject(sub)}
                  style={[s.chip, subject === sub && { backgroundColor: C.accentLo, borderColor: C.accent }]}>
                  <Text style={[s.chipTxt, subject === sub && { color: C.accent }]}>{sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={s.label}>TOPIC</Text>
          <TextInput value={topic} onChangeText={setTopic} placeholder="e.g. Quadratic Equations"
            placeholderTextColor={C.muted} style={s.input} />

          <Text style={s.label}>DUE DATE</Text>
          <TextInput value={dueDate} onChangeText={setDueDate} placeholder="e.g. 2027-04-30"
            placeholderTextColor={C.muted} style={[s.input, { marginBottom: 12 }]} />

          <Text style={s.label}>TIME LIMIT (MINUTES)</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
            {[15, 20, 30, 45, 60].map(m => (
              <TouchableOpacity key={m} onPress={() => setTimeLimit(m)}
                style={[s.chip, timeLimit === m && { backgroundColor: C.accentLo, borderColor: C.accent }]}>
                <Text style={[s.chipTxt, timeLimit === m && { color: C.accent }]}>{m}m</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>STUDY MATERIAL</Text>
          <TextInput
            value={material} onChangeText={setMaterial} multiline
            numberOfLines={8} placeholder="Paste textbook content, notes, or extracted pages here..."
            placeholderTextColor={C.muted} style={[s.input, { height: 160, textAlignVertical: 'top' }]}
          />

          <TouchableOpacity onPress={assign} disabled={saving}
            style={[s.btn, saving && { opacity: 0.5 }]}>
            <Text style={s.btnTxt}>{saving ? 'Saving...' : 'Assign & Notify 🔔'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── BOOKS ── */}
      {tab === 'Books' && (
        <View>
          <View style={s.card}>
            <Text style={s.cardTitle}>PDF Upload</Text>
            <Text style={{ color: C.sub, fontSize: 13, lineHeight: 20 }}>
              On mobile, use the web app at your Amplify URL to upload PDFs and extract pages. The extracted material will sync here automatically via Firebase.{'\n\n'}
              Books uploaded from the web app will appear below:
            </Text>
          </View>
          {books.map(b => (
            <View key={b.id} style={[s.card, { marginTop: 10 }]}>
              <Text style={{ color: C.text, fontWeight: '600' }}>{b.name}</Text>
              <Text style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{b.totalPages} pages</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── ALARMS ── */}
      {tab === 'Alarms' && (
        <View>
          <View style={s.card}>
            <Text style={s.label}>ALARM TIME (24h FORMAT)</Text>
            <TextInput value={alarmTime} onChangeText={setAlarmTime} placeholder="e.g. 07:00"
              placeholderTextColor={C.muted} style={[s.input, { marginBottom: 10 }]} />
            <Text style={s.label}>LABEL</Text>
            <TextInput value={alarmLabel} onChangeText={setAlarmLabel}
              placeholder="e.g. Morning study session"
              placeholderTextColor={C.muted} style={[s.input, { marginBottom: 12 }]} />
            <TouchableOpacity onPress={addAlarm} style={s.btn}>
              <Text style={s.btnTxt}>Add Alarm 🔔</Text>
            </TouchableOpacity>
          </View>

          {alarms.map(a => (
            <View key={a.id} style={[s.card, { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <View>
                <Text style={{ color: C.accent, fontFamily: 'monospace', fontSize: 22, fontWeight: '700' }}>{a.time}</Text>
                <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{a.label}</Text>
              </View>
              <View style={{ gap: 6 }}>
                <TouchableOpacity onPress={() => ringAlarm(a.label)} style={[s.btn, { paddingVertical: 6, paddingHorizontal: 12 }]}>
                  <Text style={[s.btnTxt, { fontSize: 12 }]}>Ring Now</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteAlarmDB(a.id)}
                  style={[s.btn, { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: C.s3 }]}>
                  <Text style={[s.btnTxt, { fontSize: 12, color: C.sub }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Betting blocker toggle */}
          <View style={[s.card, { marginTop: 20, borderColor: bettingActive ? C.green + '44' : C.border }]}>
            <Text style={s.cardTitle}>Betting Site Blocker</Text>
            <Text style={{ color: C.sub, fontSize: 13, lineHeight: 20, marginBottom: 14 }}>
              {bettingActive
                ? '✅ Active — All betting sites are blocked across all browsers on this device.'
                : 'Blocks Bet9ja, SportyBet, NairaBet, 1xBet, and 20+ other sites via local VPN.'}
            </Text>
            <TouchableOpacity
              onPress={toggleBetting}
              style={[s.btn, { backgroundColor: bettingActive ? C.red : C.green }]}>
              <Text style={[s.btnTxt, { color: '#000' }]}>
                {bettingActive ? 'Disable Blocker' : 'Enable Betting Blocker 🔒'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── RESULTS ── */}
      {tab === 'Results' && (
        <View>
          {results.length === 0 ? (
            <View style={[s.card, { alignItems: 'center', paddingVertical: 48 }]}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>📊</Text>
              <Text style={{ color: C.sub, fontSize: 14 }}>No results yet.</Text>
            </View>
          ) : results.map((r, i) => {
            const a = assignments.find(x => x.id === r.assignmentId) || {};
            return (
              <View key={i} style={[s.card, { marginBottom: 10, borderColor: r.passed ? C.green + '44' : C.red + '44' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.accent, fontSize: 11, fontWeight: '700', marginBottom: 3 }}>{a.subject}</Text>
                    <Text style={{ color: C.text, fontWeight: '600', fontSize: 15 }}>{a.topic}</Text>
                    <Text style={{ color: r.passed ? C.green : C.red, fontSize: 11, marginTop: 3 }}>
                      {r.passed ? 'PASSED' : 'FAILED'}
                    </Text>
                  </View>
                  <Text style={{ color: r.passed ? C.green : C.red, fontSize: 32, fontWeight: '700' }}>{r.score}%</Text>
                </View>
                <Text style={{ color: C.sub, fontSize: 12, marginTop: 10, lineHeight: 18 }}>{r.feedback}</Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#080912' },
  tabs: {
    flexDirection: 'row', backgroundColor: '#131426',
    padding: 4, borderRadius: 11, marginBottom: 16,
    borderWidth: 1, borderColor: '#2a2c42',
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabTxt: { color: '#8f8daa', fontSize: 12, fontWeight: '600' },
  card: {
    backgroundColor: '#0d0e1c', borderWidth: 1, borderColor: '#2a2c42',
    borderRadius: 14, padding: 18, marginBottom: 4,
  },
  cardTitle: { color: '#eceaf8', fontWeight: '700', fontSize: 16, marginBottom: 8 },
  label: { color: '#4e4d66', fontSize: 10, letterSpacing: 1.5, marginBottom: 7, fontWeight: '700' },
  input: {
    backgroundColor: '#131426', color: '#eceaf8', borderWidth: 1,
    borderColor: '#2a2c42', borderRadius: 9, padding: 10,
    fontSize: 14, marginBottom: 12,
  },
  btn: {
    backgroundColor: '#f0b429', borderRadius: 9,
    paddingVertical: 11, paddingHorizontal: 20, alignItems: 'center',
  },
  btnTxt: { color: '#000', fontWeight: '700', fontSize: 14 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: '#2a2c42',
  },
  chipTxt: { color: '#8f8daa', fontSize: 12 },
});

// src/App.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, Alert,
} from 'react-native';
import { setupChannels, ringNow } from './services/notifications';
import { registerFCMToken, subscribePushQueue, setupFCMListener } from './services/firebase';
import { enforceFailRestrictions, liftRestrictions, ensureDeviceAdmin } from './native/DeviceControl';
import { useStore } from './store';
import AdminScreen from './screens/AdminScreen';
import StudentScreen from './screens/StudentScreen';

const C = {
  bg: '#080912', s1: '#0d0e1c', s2: '#131426',
  border: '#2a2c42', accent: '#f0b429', blue: '#5b8dee',
  green: '#22c97a', red: '#f04452', text: '#eceaf8', muted: '#4e4d66',
};

export default function App() {
  const { role, setRole, adminPin, setAdminPin } = useStore();
  const [view, setView] = useState<'student'|'admin'>('student');
  const [pinModal, setPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    setupChannels();
    registerFCMToken('student');

    // Listen for push queue (admin sends from web app)
    const unsub = subscribePushQueue(async (payload) => {
      if (!payload) return;
      if (payload.type === 'new_assignment') {
        await ringNow(payload.title || '📚 New Assignment', payload.body || '');
      } else if (payload.type === 'alarm') {
        await ringNow(payload.title || '⏰ Study Reminder', payload.body || '');
      }
    });

    // FCM foreground
    const unsubFCM = setupFCMListener(async (msg) => {
      await ringNow(
        msg.notification?.title || 'Study Monitor',
        msg.notification?.body || ''
      );
    });

    // Request device admin on first run
    ensureDeviceAdmin();

    return () => { unsub(); unsubFCM(); };
  }, []);

  const handleResultUpdate = async (passed: boolean) => {
    if (passed) {
      await liftRestrictions();
      useStore.getState().setRestrictionsActive(false);
    } else {
      await enforceFailRestrictions();
      useStore.getState().setRestrictionsActive(true);
    }
  };

  const switchToAdmin = () => {
    if (!adminPin) {
      // First time: set PIN
      Alert.prompt('Set Admin PIN', 'Create a PIN to protect admin access.', (pin) => {
        if (pin && pin.length >= 4) { setAdminPin(pin); setView('admin'); }
        else Alert.alert('PIN must be at least 4 digits');
      });
    } else {
      Alert.prompt('Admin PIN', 'Enter your PIN', (pin) => {
        if (pin === adminPin) { setView('admin'); }
        else Alert.alert('Incorrect PIN');
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Top bar */}
      <View style={styles.topbar}>
        <View style={styles.logo}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
          <View>
            <Text style={styles.logoTitle}>Study Monitor</Text>
            <Text style={styles.logoSub}>ACCOUNTABILITY PLATFORM</Text>
          </View>
        </View>
        <View style={styles.toggle}>
          <TouchableOpacity
            onPress={() => setView('student')}
            style={[styles.toggleBtn, view === 'student' && { backgroundColor: C.blue }]}
          >
            <Text style={[styles.toggleTxt, view === 'student' && { color: '#fff' }]}>Student</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={switchToAdmin}
            style={[styles.toggleBtn, view === 'admin' && { backgroundColor: C.accent }]}
          >
            <Text style={[styles.toggleTxt, view === 'admin' && { color: '#000' }]}>Admin 🔒</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {view === 'admin'
          ? <AdminScreen />
          : <StudentScreen onResult={handleResultUpdate} />
        }
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topbar: {
    backgroundColor: '#0d0e1c',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2c42',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: {
    width: 32, height: 32, backgroundColor: '#f0b429',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  logoLetter: { fontWeight: '700', fontSize: 18, color: '#000' },
  logoTitle: { color: '#eceaf8', fontWeight: '700', fontSize: 14 },
  logoSub: { color: '#4e4d66', fontSize: 9, letterSpacing: 1 },
  toggle: {
    flexDirection: 'row', backgroundColor: '#131426',
    padding: 3, borderRadius: 9, borderWidth: 1, borderColor: '#2a2c42',
  },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 7 },
  toggleTxt: { color: '#4e4d66', fontSize: 12, fontWeight: '600' },
});

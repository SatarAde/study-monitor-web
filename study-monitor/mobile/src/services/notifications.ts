// src/services/notifications.ts
import notifee, {
  AndroidImportance, AndroidVisibility,
  TriggerType, RepeatFrequency,
} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

export async function setupChannels() {
  await notifee.createChannel({
    id: 'alarms',
    name: 'Study Alarms',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: 'default',
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
  });
  await notifee.createChannel({
    id: 'assignments',
    name: 'New Assignments',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });
}

export async function scheduleAlarm(alarm: {
  id: string; time: string; label: string; repeat: string;
}) {
  const [h, m] = alarm.time.split(':').map(Number);
  const t = new Date();
  t.setHours(h, m, 0, 0);
  if (t <= new Date()) t.setDate(t.getDate() + 1);

  await notifee.createTriggerNotification(
    {
      id: `alarm-${alarm.id}`,
      title: '⏰ Study Time!',
      body: alarm.label,
      android: {
        channelId: 'alarms',
        importance: AndroidImportance.HIGH,
        fullScreenAction: { id: 'open' },
        pressAction: { id: 'open', launchActivity: 'default' },
        actions: [
          { title: 'Open App', pressAction: { id: 'open', launchActivity: 'default' } },
          { title: 'Dismiss', pressAction: { id: 'dismiss' } },
        ],
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: t.getTime(),
      repeatFrequency: alarm.repeat === 'daily' ? RepeatFrequency.DAILY : undefined,
    }
  );
}

export async function ringNow(title: string, body: string) {
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: 'alarms',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      pressAction: { id: 'open', launchActivity: 'default' },
    },
  });
}

export async function cancelAlarm(alarmId: string) {
  await notifee.cancelTriggerNotification(`alarm-${alarmId}`);
}

export async function requestPermission(): Promise<boolean> {
  const s = await notifee.requestPermission();
  return s.authorizationStatus >= 1;
}

export async function setupFCM() {
  const status = await messaging().requestPermission();
  if (status < 1) return null;
  return messaging().getToken();
}

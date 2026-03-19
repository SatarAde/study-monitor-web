// src/native/DeviceControl.ts
import { NativeModules, Platform, Alert } from 'react-native';

const { DeviceControl } = NativeModules;

const stub = {
  isDeviceAdmin: async () => false,
  requestDeviceAdmin: async () => {},
  blockAppsOnFail: async () => {},
  unblockAppsOnPass: async () => {},
  startBettingBlocker: async () => {},
  stopBettingBlocker: async () => {},
  isBettingBlockerActive: async () => false,
  getBlockableAppsInstalled: async () => [],
};

const native = Platform.OS === 'android' && DeviceControl ? DeviceControl : stub;

export async function ensureDeviceAdmin(): Promise<boolean> {
  const has = await native.isDeviceAdmin();
  if (!has) {
    Alert.alert(
      'Admin Permission Needed',
      'Study Monitor needs device admin access to restrict distracting apps when you fail a test. Apps are fully restored when you pass.',
      [
        { text: 'Grant Access', onPress: () => native.requestDeviceAdmin() },
        { text: 'Later', style: 'cancel' },
      ]
    );
    return false;
  }
  return true;
}

export async function enforceFailRestrictions(): Promise<void> {
  const ok = await native.isDeviceAdmin();
  if (!ok) return;
  await native.blockAppsOnFail();
}

export async function liftRestrictions(): Promise<void> {
  await native.unblockAppsOnPass();
}

export async function startBettingBlock(): Promise<boolean> {
  try {
    await native.startBettingBlocker();
    return true;
  } catch (e: any) {
    if (e?.code === 'VPN_PERMISSION_NEEDED') {
      Alert.alert(
        'VPN Permission',
        'To block betting sites across all browsers, Study Monitor needs to set up a local VPN. This VPN only filters gambling domains — all other traffic is unaffected.',
        [
          { text: 'Allow VPN', onPress: async () => { await native.startBettingBlocker(); } },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
    return false;
  }
}

export async function stopBettingBlock(): Promise<void> {
  await native.stopBettingBlocker();
}

export async function isBettingBlockActive(): Promise<boolean> {
  return native.isBettingBlockerActive();
}

export async function getInstalledBlockableApps(): Promise<string[]> {
  return native.getBlockableAppsInstalled();
}

export const APP_DISPLAY_NAMES: Record<string, string> = {
  'com.instagram.android': 'Instagram',
  'com.twitter.android': 'Twitter / X',
  'com.facebook.katana': 'Facebook',
  'com.facebook.orca': 'Messenger',
  'com.snapchat.android': 'Snapchat',
  'com.zhiliaoapp.musically': 'TikTok',
  'com.tiktok.android': 'TikTok',
  'com.google.android.youtube': 'YouTube',
  'com.supercell.clashofclans': 'Clash of Clans',
  'com.supercell.clashroyale': 'Clash Royale',
  'com.mojang.minecraftpe': 'Minecraft',
  'com.king.candycrushsaga': 'Candy Crush',
  'com.activision.callofduty.shooter': 'Call of Duty Mobile',
};

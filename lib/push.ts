// lib/push.ts
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { supabase } from '@/lib/supabase';

// SDK 53 types expect banner/list too
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPush() {
  try {
    if (!Device.isDevice) return null;

    // Request permissions
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') {
      console.log('[Push] permission not granted');
      return null;
    }

    // Get Expo token
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Platform deviceId
    let deviceId = 'unknown';
    if (Platform.OS === 'android' && typeof (Application as any).getAndroidId === 'function') {
      // getAndroidId(): string | null
      deviceId = Application.getAndroidId?.() ?? 'unknown-android';
    } else if (
      Platform.OS === 'ios' &&
      typeof (Application as any).getIosIdForVendorAsync === 'function'
    ) {
      // getIosIdForVendorAsync(): Promise<string | null>
      deviceId = (await Application.getIosIdForVendorAsync()) ?? 'unknown-ios';
    }

    // Store to DB if logged in
    const { data: au } = await supabase.auth.getUser();
    const userId = au?.user?.id;
    if (userId) {
      await supabase.from('user_push_tokens').upsert({
        user_id: userId,
        device_id: deviceId,
        expo_push_token: token,
        device_os: Platform.OS,
        updated_at: new Date().toISOString(),
      });
    }

    return token;
  } catch (e) {
    console.warn('[Push] register error', e);
    return null;
  }
}

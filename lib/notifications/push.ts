import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    // new fields on SDK 53 types
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function registerForPushAndSave() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    finalStatus = req.status;
  }
  if (finalStatus !== 'granted') return;

  // Project ID helps in bare/dev client contexts
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });

  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (user && token?.data) {
    await supabase.from('push_tokens').upsert({
      user_id: user.id,
      expo_push_token: token.data
    });
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT
    });
  }
}

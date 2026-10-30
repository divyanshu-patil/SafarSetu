import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });

/** Asks once (the OS only prompts the first time); returns whether alerts are allowed. */
export async function askNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('trip', { name: 'Trip alerts', importance: Notifications.AndroidImportance.HIGH });
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    if (!cur.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch { return false; }
}

export const notificationsAllowed = async () => {
  try { return Platform.OS !== 'web' && (await Notifications.getPermissionsAsync()).granted; } catch { return false; }
};

export const notifyNow = (title: string, body: string) =>
  Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null }).catch(() => {});

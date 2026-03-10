import { Platform } from "react-native";

let Notifications: any = null;
let Device: any = null;
let asyncStorage: any = null;
try {
  Notifications = require("expo-notifications");
  Device = require("expo-device");
  asyncStorage = require("@react-native-async-storage/async-storage").default;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // Native modules not available
}

const PUSH_TOKEN_KEY = "push_token";

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications || !Device || !Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  if (asyncStorage) await asyncStorage.setItem(PUSH_TOKEN_KEY, token);

  return token;
}

export async function getStoredPushToken(): Promise<string | null> {
  return asyncStorage ? asyncStorage.getItem(PUSH_TOKEN_KEY) : null;
}

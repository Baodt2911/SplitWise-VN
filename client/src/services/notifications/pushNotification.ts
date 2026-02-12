import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiClient } from "../api/config";

type PlatformDevice = "ANDROID" | "IOS" | "WEB";

/**
 * Đăng ký push token lên server
 */
export const registerPushTokenApi = async (
  token: string,
  platform: PlatformDevice,
): Promise<void> => {
  await apiClient.post("/notifications/devices", { token, platform });
  // Lưu token vào SecureStore để unregister khi logout
  await SecureStore.setItemAsync("expoPushToken", token);
};

/**
 * Hủy đăng ký push token khi logout
 */
export const unregisterPushTokenApi = async (token: string): Promise<void> => {
  await apiClient.delete(`/notifications/devices/${token}`);
};

/**
 * Đăng ký nhận push notification và lấy Expo Push Token
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  // Tạo notification channel cho Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Thông báo mặc định",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#10B981",
    });
  }

  // Kiểm tra thiết bị vật lý
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device");
    return null;
  }

  // Kiểm tra và yêu cầu quyền
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Push notification permission not granted");
    return null;
  }

  // Lấy Expo Push Token
  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      throw new Error("Project ID not found in app.json");
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log("Expo Push Token:", token);
    return token;
  } catch (error) {
    console.error("Failed to get Expo push token:", error);
    return null;
  }
}

/**
 * Đăng ký push notification và gửi token lên server
 */
export async function setupPushNotifications(): Promise<string | null> {
  const token = await registerForPushNotificationsAsync();
  if (token) {
    const platform: PlatformDevice =
      Platform.OS === "ios"
        ? "IOS"
        : Platform.OS === "android"
          ? "ANDROID"
          : "WEB";

    try {
      await registerPushTokenApi(token, platform);
      console.log("Push token registered successfully");
    } catch (error) {
      console.error("Failed to register push token:", error);
    }
  }

  return token;
}

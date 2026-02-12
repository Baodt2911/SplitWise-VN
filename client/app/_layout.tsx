import "../global.css";
import "../src/services/i18n"; // Initialize i18n

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useMemo } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Alert } from "../src/components/ui/Alert";
import { ToastContainer } from "../src/components/ui/Toast";
import { useCategoryStore } from "../src/store/categoryStore";
import { usePreferencesStore } from "../src/store/preferencesStore";
import { getThemeColors } from "../src/utils/themeColors";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

SplashScreen.preventAutoHideAsync();

function useNotificationObserver() {
  useEffect(() => {
    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      if (typeof url === "string") {
        router.push(url);
      }
    }

    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) {
      redirect(response.notification);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        redirect(response.notification);
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);
}

export default function RootLayout() {
  useNotificationObserver();
  const theme = usePreferencesStore((state) => state.theme);
  const colors = useMemo(() => getThemeColors(theme), [theme]);
  const [loaded] = useFonts({
    BeVietnamPro: require("../assets/fonts/Be_Vietnam_Pro/BeVietnamPro-Regular.ttf"),
    BeVietnamProBold: require("../assets/fonts/Be_Vietnam_Pro/BeVietnamPro-Bold.ttf"),
    BeVietnamProExtraBold: require("../assets/fonts/Be_Vietnam_Pro/BeVietnamPro-ExtraBold.ttf"),
    BeVietnamProMedium: require("../assets/fonts/Be_Vietnam_Pro/BeVietnamPro-Medium.ttf"),
    BeVietnamProSemiBold: require("../assets/fonts/Be_Vietnam_Pro/BeVietnamPro-SemiBold.ttf"),
    BeVietnamProThin: require("../assets/fonts/Be_Vietnam_Pro/BeVietnamPro-Thin.ttf"),
    BeVietnamProLight: require("../assets/fonts/Be_Vietnam_Pro/BeVietnamPro-Light.ttf"),
    BeVietnamProBlack: require("../assets/fonts/Be_Vietnam_Pro/BeVietnamPro-Black.ttf"),
    BeVietnamProExtraLight: require("../assets/fonts/Be_Vietnam_Pro/BeVietnamPro-ExtraLight.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hide();
      // Note: initializeAuth is called in index.tsx to ensure proper timing

      // Prefetch categories (cached if already exists)
      useCategoryStore.getState().fetchCategories();
    }
  }, [loaded]);

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      animation: "slide_from_right" as const,
      animationDuration: 300,
      animationTypeForReplace: "push" as const,
      gestureEnabled: true,
      gestureDirection: "horizontal" as const,
      contentStyle: {
        backgroundColor: colors.background,
      },
    }),
    [colors.background],
  );

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={screenOptions} />
        <Alert />
        <ToastContainer />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

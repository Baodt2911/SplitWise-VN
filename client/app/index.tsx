import { useEffect, useState, useRef } from "react";
import { router } from "expo-router";
import { useAuthStore } from "../src/store/authStore";
import { View, ActivityIndicator } from "react-native";
import { getThemeColors } from "../src/utils/themeColors";
import { usePreferencesStore } from "../src/store/preferencesStore";
import  OnboardingScreen  from "../src/features/onboarding/screens/OnboardingScreen";

export default function Index() {
  const [isInitialized, setIsInitialized] = useState(false);
  const hasResetOnboardingRef = useRef(false); // Track if we've reset onboarding on app start
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const hasCompletedOnboarding = usePreferencesStore(
    (state) => state.hasCompletedOnboarding
  );
  const setHasCompletedOnboarding = usePreferencesStore(
    (state) => state.setHasCompletedOnboarding
  );
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);

  useEffect(() => {
    const checkAuth = async () => {
      // Initialize auth state from SecureStore
      await initializeAuth();
      // Small delay to ensure state is updated
      await new Promise((resolve) => setTimeout(resolve, 100));
      setIsInitialized(true);
    };

    checkAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isInitialized) return;

    console.log("[Index] Routing check:", {
      hasCompletedOnboarding,
      isAuthenticated,
      hasResetOnboarding: hasResetOnboardingRef.current,
    });

    // Nếu user đã đăng nhập, tự động set hasCompletedOnboarding = true
    // và đi thẳng đến home (vì họ đã hoàn thành onboarding khi đăng ký/đăng nhập)
    if (isAuthenticated) {
      if (!hasCompletedOnboarding) {
        console.log("[Index] User authenticated but onboarding not marked, setting it now");
        setHasCompletedOnboarding(true);
      }
      console.log("[Index] User authenticated, redirecting to home");
      router.replace("/(tabs)/home");
      return;
    }

    // User chưa đăng nhập
    // Chỉ reset onboarding một lần khi app khởi động lại (không có auth)
    // Điều này đảm bảo:
    // - Người mới tải app → onboarding
    // - Đăng xuất rồi thoát app → khi mở lại → onboarding
    // - Đăng xuất trong app → giữ hasCompletedOnboarding = true → redirect đến login
    if (!hasResetOnboardingRef.current && hasCompletedOnboarding) {
      console.log("[Index] App started without auth, resetting onboarding for next launch");
      setHasCompletedOnboarding(false);
      hasResetOnboardingRef.current = true;
      return;
    }

    // Nếu đã reset onboarding hoặc chưa hoàn thành onboarding, hiển thị onboarding
    if (!hasCompletedOnboarding) {
      console.log("[Index] Showing onboarding screen");
      return;
    }

    // Nếu đã hoàn thành onboarding nhưng chưa đăng nhập (logout trong app)
    // Redirect đến login
    console.log("[Index] User not authenticated but onboarding completed, redirecting to login");
    router.replace("/auth/login");
  }, [isInitialized, hasCompletedOnboarding, isAuthenticated, setHasCompletedOnboarding]);

  // Show loading while checking auth
  if (!isInitialized) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <OnboardingScreen />;
  }

  return null;
}


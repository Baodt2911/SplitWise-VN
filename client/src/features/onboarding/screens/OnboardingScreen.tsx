import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { LanguageSelect } from "../components/LanguageToggle";
import { OnboardingImage } from "../components/OnboardingImage";
import { ThemeToggle } from "../components/ThemeToggle";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { getThemeColors } from "../../../utils/themeColors";
import type { AppLanguage, OnboardingSlide } from "../types";
import type { SharedValue } from "react-native-reanimated";

const slides: OnboardingSlide[] = [
  {
    key: "welcome",
    title: {
      vi: "Nhóm bạn ăn uống",
      en: "Dining with friends",
    },
    description: {
      vi: "Chia tiền thông minh, không còn đau đầu tính toán ai nợ ai bao nhiêu",
      en: "Split bills effortlessly and keep everyone clear on who owes what",
    },
    image: "welcome", // Using key to identify SVG
  },
  {
    key: "qr",
    title: {
      vi: "QR Code thanh toán",
      en: "QR payment",
    },
    description: {
      vi: "Thanh toán nhanh chóng. Quét QR và chuyển khoản ngay lập tức",
      en: "Pay in seconds. Scan a QR code and settle your balance instantly",
    },
    image: "qr",
  },
  {
    key: "stats",
    title: {
      vi: "Biểu đồ chi tiêu",
      en: "Spending insights",
    },
    description: {
      vi: "Theo dõi chi tiêu, biết rõ bạn đang chi tiền vào đâu",
      en: "Track where your money goes with clear charts and categories",
    },
    image: "stats",
  },
  {
    key: "start",
    title: {
      vi: "Tất cả thiết bị",
      en: "All your devices",
    },
    description: {
      vi: "Sẵn sàng bắt đầu? Tạo nhóm đầu tiên và trải nghiệm ngay",
      en: "Ready to start? Create your first group and enjoy the experience",
    },
    image: "start",
  },
];

const translations: Record<
  AppLanguage,
  {
    skip: string;
    next: string;
    getStarted: string;
    alreadyAccount: string;
    startHint: string;
  }
> = {
  vi: {
    skip: "Bỏ qua",
    next: "Tiếp tục",
    getStarted: "Tạo tài khoản",
    alreadyAccount: "Đã có tài khoản",
    startHint: "Kết nối tới màn hình chính sau khi hoàn tất onboarding.",
  },
  en: {
    skip: "Skip",
    next: "Next",
    getStarted: "Get started",
    alreadyAccount: "Already have an account",
    startHint: "Proceed to the main app after finishing onboarding.",
  },
};

interface PaginationDotProps {
  index: number;
  scrollX: SharedValue<number>;
  width: number;
  color: string;
}

const PaginationDot = ({ index, scrollX, width, color }: PaginationDotProps) => {
  const animatedStyle = useAnimatedStyle(
    () => {
      const inputRange = [
        (index - 1) * width,
        index * width,
        (index + 1) * width,
      ];

      const scale = interpolate(
        scrollX.value,
        inputRange,
        [0.8, 1.2, 0.8],
        Extrapolation.CLAMP,
      );
      const opacity = interpolate(
        scrollX.value,
        inputRange,
        [0.4, 1, 0.4],
        Extrapolation.CLAMP,
      );

      return {
        transform: [{ scale }],
        opacity,
        backgroundColor: color,
      };
    },
    [width, color],
  );

  return (
    <Animated.View
      className="mx-1 h-2 w-2 rounded-full"
      style={animatedStyle}
    />
  );
};

const OnboardingScreen = () => {
  const { width } = useWindowDimensions();
  const language = usePreferencesStore((state) => state.language);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);
  const theme = usePreferencesStore((state) => state.theme);
  const setTheme = usePreferencesStore((state) => state.setTheme);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const scrollX = useSharedValue(0);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  // Animation values for toggles and buttons
  const toggleOpacity = useSharedValue(0);
  const toggleTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(1);
  const buttonTranslateY = useSharedValue(0);
  const secondaryButtonOpacity = useSharedValue(0);
  const secondaryButtonTranslateY = useSharedValue(10);

  const t = translations[language];
  const isLastSlide = currentIndex === slides.length - 1;
  const colors = getThemeColors(theme);

  // Animate toggles when last slide appears
  useEffect(() => {
    if (isLastSlide) {
      toggleOpacity.value = withTiming(1, { duration: 400 });
      toggleTranslateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
    } else {
      toggleOpacity.value = withTiming(0, { duration: 200 });
      toggleTranslateY.value = withTiming(20, { duration: 200 });
    }
  }, [isLastSlide, toggleOpacity, toggleTranslateY]);

  // Animate buttons when last slide appears
  useEffect(() => {
    if (isLastSlide) {
      buttonOpacity.value = withTiming(1, { duration: 400 });
      buttonTranslateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      // Delay secondary button animation
      secondaryButtonOpacity.value = withDelay(
        150,
        withTiming(1, { duration: 300 })
      );
      secondaryButtonTranslateY.value = withDelay(
        150,
        withSpring(0, {
          damping: 15,
          stiffness: 150,
        })
      );
    } else {
      buttonOpacity.value = withTiming(1, { duration: 200 });
      buttonTranslateY.value = withTiming(0, { duration: 200 });
      secondaryButtonOpacity.value = withTiming(0, { duration: 200 });
      secondaryButtonTranslateY.value = withTiming(10, { duration: 200 });
    }
  }, [isLastSlide, buttonOpacity, buttonTranslateY, secondaryButtonOpacity, secondaryButtonTranslateY]);

  // Animated styles for toggles
  const toggleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: toggleOpacity.value,
      transform: [{ translateY: toggleTranslateY.value }],
    };
  });

  // Animated styles for buttons
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
      transform: [{ translateY: buttonTranslateY.value }],
    };
  });

  const secondaryButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: secondaryButtonOpacity.value,
      transform: [{ translateY: secondaryButtonTranslateY.value }],
    };
  });

  // Close one dropdown when the other opens
  const handleThemeOpenChange = (open: boolean) => {
    setThemeDropdownOpen(open);
    if (open) setLanguageDropdownOpen(false);
  };

  const handleLanguageOpenChange = (open: boolean) => {
    setLanguageDropdownOpen(open);
    if (open) setThemeDropdownOpen(false);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const goToSlide = (index: number) => {
    scrollRef.current?.scrollTo({ x: width * index, animated: true });
    setCurrentIndex(index);
  };

  const handleSkip = () => goToSlide(slides.length - 1);

  const setHasCompletedOnboarding = usePreferencesStore(
    (state) => state.setHasCompletedOnboarding
  );

  const handlePrimaryAction = () => {
    if (isLastSlide) {
      // Đánh dấu đã hoàn thành onboarding
      setHasCompletedOnboarding(true);
      // Chuyển đến trang đăng ký và không cho quay lại onboarding
      router.replace("/auth/register");
      return;
    }
    goToSlide(currentIndex + 1);
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      
      {/* Overlay to close dropdowns when clicking outside */}
      {(themeDropdownOpen || languageDropdownOpen) && (
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
          }}
          onPress={() => {
            setThemeDropdownOpen(false);
            setLanguageDropdownOpen(false);
          }}
        />
      )}

      <View className="flex-row items-center justify-end px-6 pt-3 pb-1" style={{ overflow: "visible" }}>
        {isLastSlide ? (
          <Animated.View
            className="items-end gap-2"
            style={[
              {
                overflow: "visible",
                zIndex: 100,
              },
              toggleAnimatedStyle,
            ]}
          >
            <LanguageSelect
              value={language}
              onChange={setLanguage}
              onOpenChange={handleLanguageOpenChange}
              isOtherOpen={themeDropdownOpen}
            />
            <ThemeToggle
              value={theme}
              onChange={setTheme}
              onOpenChange={handleThemeOpenChange}
              isOtherOpen={languageDropdownOpen}
            />
          </Animated.View>
        ) : (
          <TouchableOpacity onPress={handleSkip} className="py-1.5">
            <Text
              className="text-base font-semibold"
              style={{
                color: colors.textSecondary,
              }}
            >
              {t.skip}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ alignItems: "center" }}
      >
        {slides.map((slide, index) => (
          <View
            key={slide.key}
            style={{ width }}
            className="items-center px-6 pt-4"
          >
            <View className="h-64 w-full items-center justify-center rounded-3xl">
              <OnboardingImage
                slideKey={slide.key}
                theme={theme}
                backgroundColor={colors.background}
                className="h-60 w-full rounded-3xl"
              />
            </View>

            <Text
              className="mt-8 text-center text-3xl"
              style={{
                color: colors.textPrimary,
              }}
            >
              {slide.title[language]}
            </Text>
            <Text
              className="mt-3 text-center text-base leading-6"
              style={{
                color: colors.textSecondary,
              }}
            >
              {slide.description[language]}
            </Text>
          </View>
        ))}
      </Animated.ScrollView>

      <View className="mt-2 flex-row items-center justify-center">
        {slides.map((_, index) => (
          <PaginationDot
            key={_.key}
            index={index}
            scrollX={scrollX}
            width={width}
            color={colors.paginationDot}
          />
        ))}
      </View>

      <View className="px-6 pb-6">
        <Animated.View style={buttonAnimatedStyle}>
          <TouchableOpacity
            onPress={handlePrimaryAction}
            className="mt-6 w-full rounded-2xl py-4"
            style={{ backgroundColor: colors.primary }}
          >
            <Text
              className="text-center text-base font-semibold"
              style={{
                color: colors.primaryText,
              }}
            >
              {isLastSlide ? t.getStarted : t.next}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {isLastSlide ? (
          <Animated.View style={secondaryButtonAnimatedStyle}>
            <TouchableOpacity
              className="mt-3"
              onPress={() => router.push("/auth/login")}
            >
              <Text
                className="text-center text-sm font-semibold"
                style={{
                  color: colors.primary,
                }}
              >
                {t.alreadyAccount}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;


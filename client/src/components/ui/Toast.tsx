import { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useToastStore } from "../../store/toastStore";
import { getThemeColors } from "../../utils/themeColors";
import { usePreferencesStore } from "../../store/preferencesStore";

const ToastItem = ({ toast }: { toast: { id: string; type: string; message: string; title?: string } }) => {
  const { hide } = useToastStore();
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getToastColors = () => {
    switch (toast.type) {
      case "success":
        return {
          bg: colors.success,
          border: colors.success,
          icon: "✓",
        };
      case "error":
        return {
          bg: colors.danger,
          border: colors.danger,
          icon: "✕",
        };
      case "warning":
        return {
          bg: colors.warning,
          border: colors.warning,
          icon: "⚠",
        };
      default:
        return {
          bg: colors.primary,
          border: colors.primary,
          icon: "ℹ",
        };
    }
  };

  const toastColors = getToastColors();

  const handleHide = () => {
    translateY.value = withTiming(-100, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 });
    // Call hide after animation completes
    setTimeout(() => {
      hide(toast.id);
    }, 200);
  };

  return (
    <Animated.View
      className="mb-3"
      style={animatedStyle}
    >
      <Pressable
        onPress={handleHide}
        className="rounded-xl py-5 px-3 min-w-[80%] max-w-[90%] min-h-8 max-h-32 shadow-md"
        style={{
          backgroundColor: colors.surface,
          borderLeftWidth: 4,
          borderLeftColor: toastColors.border,
        }}
      >
        <View className="flex flex-row items-start">
          <View
            className="w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5"
            style={{
              backgroundColor: toastColors.bg + "20",
            }}
          >
            <Text
              className="text-sm font-normal"
              style={{
                color: toastColors.bg,
              }}
            >
              {toastColors.icon}
            </Text>
          </View>
          <View className="flex-1" style={{ flexShrink: 1, minHeight: 24 }}>
            {toast.title && (
              <Text
                className="text-base mb-1.5 font-semibold"
                style={{
                  color: colors.textPrimary,
                }}
                numberOfLines={3}
              >
                {toast.title}
              </Text>
            )}
            <Text
              className="text-sm leading-5 font-medium"
              style={{
                color: colors.textSecondary,
              }}
            >
              {toast.message}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const ToastContainer = () => {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <View
      className="absolute top-[60px] left-0 right-0 items-center z-[9999]"
      style={{ pointerEvents: "box-none" }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
};


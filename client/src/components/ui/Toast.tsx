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

const ToastItem = ({
  toast,
}: {
  toast: { id: string; type: string; message: string; title?: string };
}) => {
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
    <Animated.View className="mb-3" style={animatedStyle}>
      <Pressable
        onPress={handleHide}
        className="flex-row items-start rounded-xl py-4 px-3 min-w-[80%] max-w-[90%] shadow-md"
        style={{
          backgroundColor: colors.surface,
          borderLeftWidth: 4,
          borderLeftColor: toastColors.border,
        }}
      >
        {/* Icon circle */}
        <View
          className="w-7 h-7 rounded-full items-center justify-center mr-3 flex-shrink-0"
          style={{
            marginTop: toast.title ? 1 : 0,
            backgroundColor: toastColors.bg + "20",
          }}
        >
          <Text
            className="text-sm font-medium"
            style={{ color: toastColors.bg, lineHeight: 16 }}
          >
            {toastColors.icon}
          </Text>
        </View>

        {/* Text content */}
        <View className="flex-1">
          {toast.title && (
            <Text
              className="text-base font-semibold mb-0.5"
              style={{ color: colors.textPrimary }}
              numberOfLines={3}
            >
              {toast.title}
            </Text>
          )}
          {!!toast.message && (
            <Text
              className="text-sm font-medium"
              style={{ color: colors.textSecondary }}
            >
              {toast.message}
            </Text>
          )}
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

import { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { useToastStore } from "../../store/toastStore";
import { getThemeColors } from "../../utils/themeColors";
import { usePreferencesStore } from "../../store/preferencesStore";

const ToastItem = ({ toast }: { toast: { id: string; type: string; message: string; title?: string } }) => {
  const { hide } = useToastStore();
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hide(toast.id);
    });
  };

  return (
    <Animated.View
      className="mb-3"
      style={{
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
      }}
    >
      <Pressable
        onPress={handleHide}
        className="rounded-xl py-3.5 px-3 min-w-[300px] max-w-[90%]"
        style={{
          backgroundColor: colors.surface,
          borderLeftWidth: 4,
          borderLeftColor: toastColors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View className="flex-row items-start">
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
              numberOfLines={8}
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


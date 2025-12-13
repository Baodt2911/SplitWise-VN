import { useState, useEffect } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import type { AppLanguage, AppTheme } from "../types";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { getThemeColors } from "../../../utils/themeColors";

interface ThemeToggleProps {
  value: AppTheme;
  onChange: (theme: AppTheme) => void;
  onOpenChange?: (open: boolean) => void;
  isOtherOpen?: boolean;
}

const OPTIONS: { 
  label: Record<AppLanguage, string>; 
  icon: string; 
  code: AppTheme 
}[] = [
  { label: { vi: "Sáng", en: "Light" }, icon: "☀️", code: "light" },
  { label: { vi: "Tối", en: "Dark" }, icon: "🌙", code: "dark" },
];

export const ThemeToggle = ({ value, onChange, onOpenChange, isOtherOpen }: ThemeToggleProps) => {
  const [open, setOpen] = useState(false);
  const language = usePreferencesStore((state) => state.language);
  const current = OPTIONS.find((o) => o.code === value) ?? OPTIONS[0];
  const colors = getThemeColors(value);

  // Animation values
  const dropdownOpacity = useSharedValue(0);

  // Close if other dropdown opens
  useEffect(() => {
    if (isOtherOpen && open) {
      setOpen(false);
      onOpenChange?.(false);
    }
  }, [isOtherOpen, open, onOpenChange]);

  // Animate dropdown when open state changes
  useEffect(() => {
    if (open) {
      dropdownOpacity.value = withTiming(1, { duration: 200 });
    } else {
      dropdownOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [open]);

  const dropdownAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: dropdownOpacity.value,
    };
  });

  const handleToggle = () => {
    if (isOtherOpen) return; // Don't open if other is open
    const newOpen = !open;
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const handleSelect = (theme: AppTheme) => {
    onChange(theme);
    setOpen(false);
    onOpenChange?.(false);
  };

  const handleClose = () => {
    setOpen(false);
    onOpenChange?.(false);
  };

  return (
    <View className="relative" style={{ zIndex: open ? 100 : 40, overflow: "visible" }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleToggle}
        className="flex-row items-center rounded-full border px-3 py-1.5"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
        hitSlop={12}
      >
        <Text className="mr-1.5 text-base">{current.icon}</Text>
        <Text
          className="mr-1 text-xs font-semibold"
          style={{
            color: colors.textPrimary,
          }}
        >
          {current.label[language]}
        </Text>
        <Text
          className="text-xs"
          style={{ color: colors.textTertiary }}
          accessibilityLabel="Toggle theme options"
        >
          ▾
        </Text>
      </TouchableOpacity>

      {open && (
        <Animated.View
          className="absolute mt-2 rounded-2xl py-1 shadow-lg"
          style={[
            {
              right: 0,
              width: 144,
              minWidth: 130,
              backgroundColor: colors.surface,
              elevation: 20,
              borderWidth: 1,
              borderColor: colors.border,
              zIndex: 1000,
            },
            dropdownAnimatedStyle,
          ]}
          onStartShouldSetResponder={() => true}
        >
          {OPTIONS.map((option) => {
            const isActive = option.code === value;
            return (
              <TouchableOpacity
                key={option.code}
                className="px-3 py-2 flex-row items-center"
                activeOpacity={0.9}
                onPress={() => handleSelect(option.code)}
              >
                <Text className="mr-2 text-base">{option.icon}</Text>
                <Text
                  className="text-base font-semibold"
                  style={{
                    color: isActive ? colors.primary : colors.textPrimary,
                  }}
                >
                  {option.label[language]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
};


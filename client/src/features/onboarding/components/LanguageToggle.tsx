import { useState, useEffect } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import type { AppLanguage } from "../types";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { getThemeColors } from "../../../utils/themeColors";

interface LanguageSelectProps {
  value: AppLanguage;
  onChange: (language: AppLanguage) => void;
  onOpenChange?: (open: boolean) => void;
  isOtherOpen?: boolean;
}

const OPTIONS: { label: string; code: AppLanguage }[] = [
  { label: "Tiếng Việt", code: "vi" },
  { label: "English", code: "en" },
];

export const LanguageSelect = ({ value, onChange, onOpenChange, isOtherOpen }: LanguageSelectProps) => {
  const [open, setOpen] = useState(false);
  const theme = usePreferencesStore((state) => state.theme);
  const current = OPTIONS.find((o) => o.code === value) ?? OPTIONS[0];
  const colors = getThemeColors(theme);

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

  const handleSelect = (language: AppLanguage) => {
    onChange(language);
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
        <Text
          className="mr-1 text-xs font-semibold"
          style={{
            color: colors.textPrimary,
          }}
        >
          {current.label}
        </Text>
        <Text
          className="text-xs"
          style={{ color: colors.textTertiary }}
          accessibilityLabel="Toggle language options"
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
              width: 160,
              minWidth: 140,
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
                className="px-3 py-2"
                activeOpacity={0.9}
                onPress={() => handleSelect(option.code)}
              >
                <Text
                  className="text-base font-semibold"
                  style={{
                    color: isActive ? colors.primary : colors.textPrimary,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
};



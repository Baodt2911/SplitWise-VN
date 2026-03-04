import { Modal, Text, TouchableOpacity, View, Pressable } from "react-native";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import type { AppTheme } from "../../onboarding/types";

interface ThemeModalProps {
  visible: boolean;
  onClose: () => void;
  onThemeChange?: (theme: AppTheme) => void;
}

const THEME_OPTIONS: {
  code: AppTheme;
  label: string;
}[] = [
  {
    code: "light",
    label: "Sáng",
  },
  {
    code: "dark",
    label: "Tối",
  },
  {
    code: "auto",
    label: "Tự động (Hệ thống)",
  },
];

export const ThemeModal = ({
  visible,
  onClose,
  onThemeChange,
}: ThemeModalProps) => {
  const theme = usePreferencesStore((state) => state.theme);
  const setTheme = usePreferencesStore((state) => state.setTheme);
  const colors = getThemeColors(theme);

  const handleSelect = (selectedTheme: AppTheme) => {
    setTheme(selectedTheme);
    if (onThemeChange) {
      onThemeChange(selectedTheme);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onPress={onClose}
      >
        <Pressable
          className="rounded-3xl px-6 py-6"
          style={{
            backgroundColor: colors.surface,
            width: "85%",
            maxWidth: 400,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="mb-6">
            <Text
              className="text-xl font-bold"
              style={{
                color: colors.textPrimary,
              }}
            >
              Chọn giao diện
            </Text>
          </View>

          {/* Options */}
          <View className="mb-4">
            {THEME_OPTIONS.map((option, index) => {
              const isSelected = option.code === theme;
              return (
                <TouchableOpacity
                  key={option.code}
                  className="flex-row items-center py-4"
                  style={{
                    borderBottomWidth: index < THEME_OPTIONS.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                  onPress={() => handleSelect(option.code)}
                  activeOpacity={0.7}
                >
                  {/* Radio Button */}
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center mr-4"
                    style={{
                      borderWidth: 2,
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected
                        ? colors.primary
                        : "transparent",
                    }}
                  >
                    {isSelected && (
                      <View
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors.primaryText }}
                      />
                    )}
                  </View>
                  {/* Label */}
                  <Text
                    className="text-base flex-1"
                    style={{
                      color: isSelected ? colors.primary : colors.textPrimary,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            className="items-end mt-2"
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text
              className="text-base font-semibold"
              style={{
                color: colors.primary,
              }}
            >
              HỦY
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

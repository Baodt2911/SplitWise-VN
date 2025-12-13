import { Modal, Text, TouchableOpacity, View, Pressable } from "react-native";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import type { AppTheme } from "../../onboarding/types";

interface ThemeModalProps {
  visible: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: {
  code: AppTheme;
  label: { vi: string; en: string };
  emoji: string;
}[] = [
  {
    code: "system",
    label: { vi: "Mặc định theo thiết bị", en: "Default according to device" },
    emoji: "⚙️",
  },
  {
    code: "light",
    label: { vi: "Sáng", en: "Light" },
    emoji: "☀️",
  },
  {
    code: "dark",
    label: { vi: "Tối", en: "Dark" },
    emoji: "🌙",
  },
];

export const ThemeModal = ({ visible, onClose }: ThemeModalProps) => {
  const theme = usePreferencesStore((state) => state.theme);
  const language = usePreferencesStore((state) => state.language);
  const setTheme = usePreferencesStore((state) => state.setTheme);
  const colors = getThemeColors(theme);

  const handleSelect = (selectedTheme: AppTheme) => {
    setTheme(selectedTheme);
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
              {language === "vi" ? "Chọn giao diện" : "Choose interface"}
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
                      backgroundColor: isSelected ? colors.primary : "transparent",
                    }}
                  >
                    {isSelected && (
                      <View
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors.primaryText }}
                      />
                    )}
                  </View>

                  {/* Emoji */}
                  <Text className="text-xl mr-3">{option.emoji}</Text>

                  {/* Label */}
                  <Text
                    className="text-base flex-1"
                    style={{
                      color: isSelected ? colors.primary : colors.textPrimary,
                    }}
                  >
                    {option.label[language]}
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
              {language === "vi" ? "HỦY" : "CANCEL"}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};


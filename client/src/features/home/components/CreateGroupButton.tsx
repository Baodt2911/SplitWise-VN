import { Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";

interface CreateGroupButtonProps {
  onPress: () => void;
}

export const CreateGroupButton = ({ onPress }: CreateGroupButtonProps) => {
  const theme = usePreferencesStore((state) => state.theme);
  const language = usePreferencesStore((state) => state.language);
  const colors = getThemeColors(theme);

  const gradientColors: [string, string] = [colors.primary, colors.primaryDark];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="flex-1">
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="rounded-2xl py-4 items-center justify-center"
      >
        <Text
          className="text-base font-semibold"
          style={{
            color: colors.primaryText,
          }}
        >
          {language === "vi" ? "Tạo nhóm" : "Create group"}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};


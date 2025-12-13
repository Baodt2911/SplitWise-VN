import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";

interface OverviewCardProps {
  title: string;
  amount: string;
  type: "owe" | "owed"; // "owe" = bạn đang nợ (red), "owed" = nợ bạn (green)
}

export const OverviewCard = ({ title, amount, type }: OverviewCardProps) => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const cardColor = type === "owe" ? colors.danger : colors.success;

  return (
    <View
      className="flex-1 rounded-2xl p-4 shadow-sm"
      style={{
        backgroundColor: colors.surface,
      }}
    >
      <Text
        className="text-sm mb-2 font-medium"
        style={{
          color: colors.textSecondary,
        }}
      >
        {title}
      </Text>
      <Text
        className="text-2xl font-bold"
        style={{
          color: cardColor,
        }}
      >
        {amount}
      </Text>
    </View>
  );
};


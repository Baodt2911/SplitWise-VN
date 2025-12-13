import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
}

export const Button = ({
  title,
  onPress,
  loading = false,
  variant = "primary",
  disabled = false,
}: ButtonProps) => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const isDisabled = disabled || loading;

  const getButtonStyle = () => {
    if (variant === "outline") {
      return {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: colors.border,
      };
    }
    if (variant === "secondary") {
      return {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      };
    }
    return {
      backgroundColor: colors.primary,
    };
  };

  const getTextColor = () => {
    if (variant === "outline" || variant === "secondary") {
      return colors.textPrimary;
    }
    return colors.primaryText;
  };

  const isDark = theme === "dark";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className="rounded-2xl py-4 px-6 items-center justify-center"
      style={{
        ...getButtonStyle(),
        opacity: isDisabled ? 0.5 : 1,
        shadowColor: variant === "primary" ? colors.primary : isDark ? "#000" : "#000",
        shadowOffset: {
          width: 0,
          height: variant === "primary" ? 2 : 1,
        },
        shadowOpacity: variant === "primary" ? (isDark ? 0.2 : 0.15) : (isDark ? 0.2 : 0.05),
        shadowRadius: variant === "primary" ? 4 : 2,
        elevation: variant === "primary" ? 2 : 1,
      }}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text
          className="text-base font-semibold"
          style={{
            fontSize: 16,
            color: getTextColor(),
          }}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};


import { useCallback } from "react";
import { View, Text, Pressable, Vibration } from "react-native";
import { getThemeColors } from "../../utils/themeColors";
import { usePreferencesStore } from "../../store/preferencesStore";
import { Icon } from "./Icon";

const KEYS = [
  "C", "÷", "×", "del",
  "7", "8", "9", "-",
  "4", "5", "6", "+",
  "1", "2", "3", "=", // Large button starts here
  "0", "000", ".", "=", // Large button continues here
];

interface MoneyKeypadProps {
  onKeyPress: (key: string) => void;
  hasOperator?: boolean; // Whether the input contains an operator
}

export const MoneyKeypad = ({ onKeyPress, hasOperator = false }: MoneyKeypadProps) => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const handlePress = useCallback(
    (key: string) => {
      // Haptic feedback for all buttons
      Vibration.vibrate(20); // 20ms vibration - lighter feedback
      onKeyPress(key);
    },
    [onKeyPress]
  );

  const gapSize = 8;
  const buttonHeight = 56;
  const buttonWidth = "23%";
  const largeButtonHeight = 120; // 2 rows: 56 + 8 gap + 56

  const renderButton = (key: string, index: number) => {
    const isDel = key === "del";
    const isC = key === "C";
    const isOperator = ["÷", "×", "-", "+"].includes(key);

    return (
      <Pressable
        key={`${key}-${index}`}
        onPress={() => handlePress(key)}
        style={{
          width: buttonWidth as any,
          height: buttonHeight,
          borderRadius: 12,
          backgroundColor: isDel ? "#FFE5E5" : colors.surface, // Light red background for delete button
          alignItems: "center",
          justifyContent: "center",
        }}
        android_ripple={{ 
          color: isDel ? "#FF6B6B" + "40" : colors.primary + "20" // Red ripple for delete button
        }}
      >
        {isDel ? (
          <Icon name="backspace" size={20} color="#DC2626" />
        ) : isOperator ? (
          <Text
            className="font-semibold"
            style={{
              fontSize: 24,
              color: colors.primary,
            }}
          >
            {key === "÷" ? "÷" : key === "×" ? "×" : key === "-" ? "-" : "+"}
          </Text>
        ) : isC ? (
          <Text
            className="font-semibold"
            style={{
              fontSize: 16,
              color: colors.primary,
            }}
          >
            C
          </Text>
        ) : (
          <Text
            className="font-semibold"
            style={{
              fontSize: 18,
              color: colors.textPrimary,
            }}
          >
            {key}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <View className="px-4 pt-4 pb-2" style={{ backgroundColor: "transparent" }}>
      <View style={{ position: "relative" }}>
        {/* Row 1: C, ÷, ×, del */}
        <View style={{ flexDirection: "row", gap: gapSize, marginBottom: gapSize }}>
          {renderButton("C", 0)}
          {renderButton("÷", 1)}
          {renderButton("×", 2)}
          {renderButton("del", 3)}
        </View>

        {/* Row 2: 7, 8, 9, - */}
        <View style={{ flexDirection: "row", gap: gapSize, marginBottom: gapSize }}>
          {renderButton("7", 4)}
          {renderButton("8", 5)}
          {renderButton("9", 6)}
          {renderButton("-", 7)}
        </View>

        {/* Row 3: 4, 5, 6, + */}
        <View style={{ flexDirection: "row", gap: gapSize, marginBottom: gapSize }}>
          {renderButton("4", 8)}
          {renderButton("5", 9)}
          {renderButton("6", 10)}
          {renderButton("+", 11)}
        </View>

        {/* Row 4: 1, 2, 3, [Large button starts here] */}
        <View style={{ flexDirection: "row", gap: gapSize, marginBottom: gapSize, position: "relative" }}>
          {renderButton("1", 12)}
          {renderButton("2", 13)}
          {renderButton("3", 14)}
          {/* Large button placeholder - invisible, just for spacing */}
          <View style={{ width: buttonWidth as any, height: buttonHeight }} />
        </View>

        {/* Row 5: 0, 000, ., [Large button continues here] */}
        <View style={{ flexDirection: "row", gap: gapSize, position: "relative" }}>
          {renderButton("0", 16)}
          {renderButton("000", 17)}
          {renderButton(".", 18)}
          {/* Large button placeholder - invisible, just for spacing */}
          <View style={{ width: buttonWidth as any, height: buttonHeight }} />
        </View>

        {/* Large blue button - positioned absolutely */}
        <Pressable
          onPress={() => handlePress("=")}
          style={{
            width: buttonWidth as any,
            height: largeButtonHeight,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            right: 0,
            top: 3 * (buttonHeight + gapSize), // Start from row 4
            paddingVertical: 8,
          }}
          android_ripple={{ color: "#3B82F6" + "20" }}
        >
          {/* Show "=" if has operator, otherwise show arrow icon */}
          {hasOperator ? (
            <Text
              className="font-semibold"
              style={{
                fontSize: 24,
                color: "#FFFFFF",
              }}
            >
              =
            </Text>
          ) : (
            <Icon name="arrowRight" size={24} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    </View>
  );
};

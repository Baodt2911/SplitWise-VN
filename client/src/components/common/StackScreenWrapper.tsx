import { useEffect } from "react";
import { View, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { getThemeColors } from "../../utils/themeColors";
import { usePreferencesStore } from "../../store/preferencesStore";

interface StackScreenWrapperProps {
  children: React.ReactNode;
}

export const StackScreenWrapper = ({ children }: StackScreenWrapperProps) => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(width);

  useEffect(() => {
    translateX.value = withTiming(0, { duration: 300 });
    return () => {
      translateX.value = withTiming(-width, { duration: 200 });
    };
  }, [translateX, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View 
        style={[
          { 
            flex: 1, 
          }, 
          animatedStyle
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};


import { Stack } from "expo-router";
import { usePreferencesStore } from "../../src/store/preferencesStore";
import { getThemeColors } from "../../src/utils/themeColors";

export default function OverviewLayout() {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 300,
        gestureEnabled: true,
        gestureDirection: "horizontal",
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="balance" />
    </Stack>
  );
}

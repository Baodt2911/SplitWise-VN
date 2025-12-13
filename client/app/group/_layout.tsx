import { Stack } from "expo-router";
import { usePreferencesStore } from "../../src/store/preferencesStore";
import { getThemeColors } from "../../src/utils/themeColors";

export default function GroupLayout() {
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
      <Stack.Screen name="[id]" />
      <Stack.Screen 
        name="[id]/add-expense" 
        options={{
          animation: "slide_from_bottom",
          presentation: "modal",
        }}
      />
      <Stack.Screen 
        name="[id]/settings"
        options={{
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}


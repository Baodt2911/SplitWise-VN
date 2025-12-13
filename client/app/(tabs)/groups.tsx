import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getThemeColors } from "../../src/utils/themeColors";
import { usePreferencesStore } from "../../src/store/preferencesStore";
import { BottomNavBar } from "../../src/features/home/components/BottomNavBar";

export default function GroupsScreen() {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-1 items-center justify-center">
        <Text style={{ color: colors.textPrimary }}>Groups Screen</Text>
      </View>
      <BottomNavBar />
    </SafeAreaView>
  );
}


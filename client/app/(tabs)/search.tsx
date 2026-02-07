import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getThemeColors } from "../../src/utils/themeColors";
import { usePreferencesStore } from "../../src/store/preferencesStore";

export default function SearchScreen() {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-1 items-center justify-center">
        <Text style={{ color: colors.textPrimary }}>Search Screen</Text>
      </View>
    </SafeAreaView>
  );
}

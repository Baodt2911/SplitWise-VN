import { Tabs } from "expo-router";
import { useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomNavBar } from "../../src/components/common/BottomNavBar/BottomNavBar";

export default function TabsLayout() {
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarStyle: { display: "none" } as const,
    }),
    [],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs screenOptions={screenOptions}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="search" />
        <Tabs.Screen name="stats" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <BottomNavBar />
    </GestureHandlerRootView>
  );
}

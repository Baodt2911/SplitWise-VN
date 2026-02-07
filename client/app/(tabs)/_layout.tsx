import { Tabs } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomNavBar } from "../../src/components/common/BottomNavBar/BottomNavBar";


export default function TabsLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="search" />
        <Tabs.Screen name="stats" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <BottomNavBar  />
    </GestureHandlerRootView>
  );
}
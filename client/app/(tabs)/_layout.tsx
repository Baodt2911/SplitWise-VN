import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" }, // Hide default tab bar, we use custom one
        animation: "none", // Disable all animations for tabs
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="groups" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}


import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { router, usePathname, useSegments } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { Icon, type IconName } from "../Icon";
import { CreateGroupBottomSheet } from "./CreateGroupBottomSheet";


interface NavItem {
  key: string;
  label: string;
  icon: IconName;
  route: string;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { key: "home", label: "Trang chủ", icon: "home", route: "/home" },
  { key: "search", label: "Tìm kiếm", icon: "search", route: "/search" },
  { key: "group", label: "Nhóm", icon: "plus", route: "/groups", isCenter: true },
  { key: "statistics", label: "Thống kê", icon: "barChart", route: "/stats" },
  { key: "profile", label: "Hồ sơ", icon: "user", route: "/profile" },
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

interface NavItemComponentProps {
  item: NavItem;
  active: boolean;
  colors: ReturnType<typeof getThemeColors>;
  onCenterPress?: () => void;
}

const NavItemComponent = ({ item, active, colors, onCenterPress }: NavItemComponentProps) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);
  const indicatorOpacity = useSharedValue(0);
  const centerScale = useSharedValue(1);
  const centerGlow = useSharedValue(0);

  useEffect(() => {
    if (item.isCenter) {
      centerScale.value = withSpring(active ? 1.05 : 1, {
        damping: 15,
        stiffness: 200,
      });
      centerGlow.value = withTiming(active ? 1 : 0, { duration: 300 });
    } else {
      scale.value = withSpring(active ? 1.15 : 1, {
        damping: 12,
        stiffness: 200,
      });
      opacity.value = withTiming(active ? 1 : 0.7, { duration: 250 });
      indicatorOpacity.value = withTiming(active ? 1 : 0, { duration: 250 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, item.isCenter]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    transform: [{ scaleX: indicatorOpacity.value }],
  }));

  const centerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: centerScale.value },
    ],
    shadowOpacity: 0.3 + centerGlow.value * 0.4,
    shadowRadius: 8 + centerGlow.value * 8,
  }));

  if (item.isCenter) {
    return (
      <View className="w-14 h-14 items-center justify-center">
        <View className="w-20 h-20 items-center justify-center rounded-full" 
        style={{ transform: [{ translateY: "-30%" }], backgroundColor: colors.surface }}>
        <AnimatedTouchableOpacity
          onPress={onCenterPress}
          activeOpacity={0.8}
          className="w-16 h-16 rounded-full items-center justify-center"
          style={[
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            },
            centerAnimatedStyle,
          ]}
        >
          <Icon name={item.icon} size={24} color="#FFFFFF" />
        </AnimatedTouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <AnimatedTouchableOpacity
      onPress={() => {
        // Normalize route to tabs format
        const route = item.route.startsWith("/") ? item.route : `/${item.route}`;
        const tabsRoute = route.startsWith("/(tabs)") ? route : `/(tabs)${route}`;
        router.replace(tabsRoute as any);
      }}
      activeOpacity={0.7}
      className="flex-1 items-center py-2"
      style={animatedStyle}
    >
      <View className="items-center relative">
        <Icon
          name={item.icon}
          size={24}
          color={active ? colors.primary : colors.textSecondary}
        />
        <AnimatedView
          className="absolute -bottom-1 w-6 h-0.5 rounded-full"
          style={[
            {
              backgroundColor: colors.primary,
            },
            indicatorStyle,
          ]}
        />
      </View>
      <Text
        className="text-xs mt-1 font-medium"
        style={{
          color: active ? colors.primary : colors.textSecondary,
        }}
      >
        {item.label}
      </Text>
    </AnimatedTouchableOpacity>
  );
};

export const BottomNavBar = () => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  const pathname = usePathname();
  const segments = useSegments();
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const isActive = (route: string) => {
    // Get the last segment from current path
    const currentSegment = segments[segments.length - 1] || "";
    // Extract segment from route (e.g., "/home" -> "home", "/(tabs)/home" -> "home")
    const routeSegment = route.split("/").filter(Boolean).pop() || "";
    
    // Also check pathname for exact match
    const normalizedPathname = pathname?.replace(/^\//, "").replace(/\/$/, "") || "";
    const normalizedRoute = route.replace(/^\//, "").replace(/\/$/, "").replace(/\(tabs\)\//, "");
    
    return (
      currentSegment === routeSegment ||
      normalizedPathname === normalizedRoute ||
      normalizedPathname?.endsWith("/" + routeSegment) ||
      normalizedPathname?.startsWith(normalizedRoute + "/")
    );
  };

  return (
    <>
      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-end justify-around rounded-3xl px-4 py-3 shadow-lg"
        style={{
          backgroundColor: colors.surface,
          marginHorizontal: 16,
          marginBottom: 20,
          paddingBottom: 8,
          minHeight: 70,
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item.route);
          return (
            <NavItemComponent
              key={item.key}
              item={item}
              active={active}
              colors={colors}
              onCenterPress={item.isCenter ? () => setIsCreateGroupOpen(true) : undefined}
            />
          );
        })}
      </View>

      {/* Create Group Bottom Sheet */}
      <CreateGroupBottomSheet
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />
    </>
  );
};

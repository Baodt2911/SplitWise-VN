import React, {
  useEffect,
  useCallback,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  FlatList,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { GroupCard } from "../components/GroupCard";
import { Icon } from "../../../components/common/Icon";
import {
  getNotifications,
  type Notification,
} from "../../../services/api/notification.api";
import { getGroups } from "../../../services/api/group.api";
import { HomeHeader } from "../components/HomeHeader";
import { HomeTopBar } from "../components/HomeTopBar";

export const HomeScreen = React.memo(() => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = useMemo(() => getThemeColors(theme), [theme]);

  const { data: notificationData, refetch: refetchNotifications } = useQuery({
    queryKey: ["notifications", "summary"],
    queryFn: () => getNotifications(1, 10),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnMount: false,
  });

  const unreadCount =
    notificationData?.notifications?.filter((n: Notification) => !n.isRead)
      .length || 0;

  const [refreshing, setRefreshing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const isInitialLoadRef = useRef(true);
  const queryClient = useQueryClient();



  const containerStyle = useMemo(
    () => ({ backgroundColor: colors.background }),
    [colors.background],
  );

  const contentContainerStyle = useMemo(
    () => ({ paddingBottom: 100, paddingHorizontal: 16 }),
    [],
  );

  // React Query for Groups
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["groups"],
    queryFn: async ({ pageParam = 1 }) => {
      return getGroups({ page: pageParam, pageSize: 15 });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page returned full capacity, assume there is a next page
      return lastPage.groups.length === 15 ? allPages.length + 1 : undefined;
    },
  });

  // Flatten infinite query pages into a single array
  const groups = useMemo(() => {
    return data?.pages.flatMap((page) => page.groups) || [];
  }, [data]);

  const isInitialLoading = isLoading && groups.length === 0;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchNotifications()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchNotifications]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !refreshing) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, refreshing, fetchNextPage]);

  const handleGroupPress = useCallback((groupId: string) => {
    router.push(`/group/${groupId}`);
  }, []);

  useEffect(() => {
    if (!isInitialLoading && groups.length > 0) {
      isInitialLoadRef.current = false;
    }
  }, [isInitialLoading, groups.length]);

  const renderGroupItem = useCallback(
    ({ item, index }: { item: (typeof groups)[0]; index: number }) => {
      const groupCard = (
        <GroupCard group={item} onPress={() => handleGroupPress(item.id)} />
      );

      if (
        isInitialLoadRef.current &&
        !refreshing &&
        !isFetchingNextPage &&
        index < 10
      ) {
        return (
          <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
            {groupCard}
          </Animated.View>
        );
      }

      return groupCard;
    },
    [handleGroupPress, refreshing, isFetchingNextPage],
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [isFetchingNextPage, colors.primary]);

  const emptyComponent = useMemo(
    () => (
      <View className="items-center justify-center px-8 py-12">
        <View
          className="w-24 h-24 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: colors.primaryLight }}
        >
          <Icon name="users" size={40} color={colors.primary} />
        </View>
        <Text
          className="text-xl font-bold mb-3 text-center"
          style={{ color: colors.textPrimary }}
        >
          Chưa có nhóm nào
        </Text>
        <Text
          className="text-base text-center leading-6"
          style={{ color: colors.textSecondary }}
        >
          Tạo nhóm đầu tiên của bạn để bắt đầu quản lý chi phí cùng bạn bè và
          gia đình!
        </Text>
      </View>
    ),
    [
      colors.primaryLight,
      colors.primary,
      colors.textPrimary,
      colors.textSecondary,
    ],
  );

  const renderListHeader = useCallback(() => {
    if (groups.length === 0) return null;
    return <HomeHeader colors={colors} hasGroups={true} />;
  }, [colors, groups.length]);

  const handleNotificationPress = useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push("/notifications");
    setTimeout(() => setIsNavigating(false), 500);
  }, [isNavigating]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        tintColor={colors.primary}
        colors={[colors.primary]}
      />
    ),
    [refreshing, handleRefresh, colors.primary],
  );

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView className="flex-1" style={containerStyle}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />

        <HomeTopBar
          colors={colors}
          unreadCount={unreadCount}
          onNotificationPress={handleNotificationPress}
        />

        {isInitialLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={groups}
            renderItem={renderGroupItem}
            keyExtractor={keyExtractor}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={emptyComponent}
            ListFooterComponent={renderFooter}
            refreshControl={refreshControl}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={contentContainerStyle}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={10}
            windowSize={10}
            getItemLayout={getItemLayout}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
});

const getItemLayout = (_: any, index: number) => ({
  length: 100,
  offset: 100 * index,
  index,
});

const keyExtractor = (item: any) => item.id;

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export default HomeScreen;

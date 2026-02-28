import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Icon } from "../../../components/common/Icon";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { getThemeColors } from "../../../utils/themeColors";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { NotificationItem } from "../components/NotificationItem";
import {
  getRelatedRoute,
  flattenNotifications,
  type NotificationListItem,
} from "../../../utils/notificationUtils";
import {
  getNotifications,
  markRead,
  markReadAll,
} from "../../../services/api/notification.api";
import type { Notification } from "../../../services/api/notification.api";

export const NotificationsScreen: React.FC = () => {
  const { theme } = usePreferencesStore();
  const colors = getThemeColors(theme);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    isLoading,
    isFetchingNextPage: isLoadingMore,
    hasNextPage: hasMore,
    fetchNextPage: loadMoreNotifications,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["notifications", "list"],
    queryFn: async ({ pageParam = 1 }) => await getNotifications(pageParam, 10),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // If exactly 10 items returned on the last page, there could be more
      return lastPage.notifications.length === 10
        ? allPages.length + 1
        : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnMount: false, // Prevent strict mode or cache double-fetches
  });

  const notifications = useMemo(() => {
    return data?.pages.flatMap((page) => page.notifications) || [];
  }, [data]);

  const unreadCount = notifications.filter(
    (n: Notification) => !n.isRead,
  ).length;

  // Handle Mark Read
  const { mutateAsync: markAsRead } = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Handle Mark All Read
  const { mutateAsync: markAllAsRead } = useMutation({
    mutationFn: markReadAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleNotificationPress = useCallback(
    async (
      notificationId: string,
      relatedId?: string,
      relatedType?: string,
    ) => {
      // Mark as read first
      await markAsRead(notificationId);

      // Navigate to related item if available
      if (relatedId && relatedType) {
        const route = getRelatedRoute(relatedType, relatedId);
        if (route) {
          router.push(route as any);
        }
      }
    },
    [markAsRead],
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  // Flatten notifications for FlatList with safety check
  const flatData = useMemo(() => {
    const flattened = flattenNotifications(notifications);

    // Double-check for unique keys to prevent VirtualizedList errors
    const seenKeys = new Set<string>();
    return flattened.filter((item) => {
      const key = item.type === "header" ? item.id : item.data.id;
      if (seenKeys.has(key)) {
        console.warn("Duplicate key detected in FlatList:", key);
        return false;
      }
      seenKeys.add(key);
      return true;
    });
  }, [notifications]);

  // Render item (header or notification)
  const renderItem = useCallback(
    ({ item }: { item: NotificationListItem }) => {
      if (item.type === "header") {
        return (
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 8,
              backgroundColor: colors.background,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.textPrimary,
              }}
            >
              {item.title}
            </Text>
          </View>
        );
      }

      return (
        <View style={{ backgroundColor: colors.surface }}>
          <NotificationItem
            notification={item.data}
            onPress={() =>
              handleNotificationPress(
                item.data.id,
                item.data.relatedId,
                item.data.relatedType,
              )
            }
          />
        </View>
      );
    },
    [colors, handleNotificationPress],
  );

  // Key extractor with fallback
  const keyExtractor = useCallback(
    (item: NotificationListItem, index: number) => {
      if (item.type === "header") {
        return item.id || `header-${index}`;
      }
      return item.data.id || `notification-${index}`;
    },
    [],
  );

  // Handle end reached for pagination
  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMoreNotifications();
    }
  }, [hasMore, isLoadingMore, loadMoreNotifications]);

  // Render list header (mark all read button)
  const renderListHeader = useCallback(() => {
    if (unreadCount === 0) return null;

    return (
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.background,
        }}
      >
        <TouchableOpacity
          onPress={handleMarkAllRead}
          style={{
            backgroundColor: `${colors.primary}15`,
            marginHorizontal: 16,
            padding: 16,
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.primary,
            }}
          >
            Đánh dấu tất cả là đã đọc
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [unreadCount, colors, handleMarkAllRead]);

  // Render footer (loading more indicator)
  const renderFooter = useCallback(() => {
    if (!hasMore) return null;

    return (
      <View
        style={{
          paddingVertical: 20,
          alignItems: "center",
        }}
      >
        {isLoadingMore ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            Kéo xuống để tải thêm
          </Text>
        )}
      </View>
    );
  }, [hasMore, isLoadingMore, colors]);

  // Render empty component
  const renderEmpty = useCallback(() => {
    if (isLoading) return null;

    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          paddingTop: 100,
        }}
      >
        <Icon name="bellOff" size={64} color={colors.textTertiary} />
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.textPrimary,
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          Chưa có thông báo
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: "center",
          }}
        >
          Bạn sẽ nhận được thông báo về hoạt động trong nhóm tại đây
        </Text>
      </View>
    );
  }, [isLoading, colors]);

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        className="border-b"
        style={{
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }}
      >
        <View className="flex-row items-center justify-between px-4 py-4">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Icon name="arrowLeft" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View className="flex-1 items-center px-4">
            <Text
              className="text-lg"
              style={{
                color: colors.textPrimary,
              }}
            >
              Thông báo
            </Text>
          </View>

          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Content */}
      {isLoading && notifications.length === 0 ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          windowSize={10}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true}
          contentContainerStyle={{
            paddingBottom: 20,
            flexGrow: 1,
            paddingTop: 8,
          }}
        />
      )}
    </SafeAreaView>
  );
};

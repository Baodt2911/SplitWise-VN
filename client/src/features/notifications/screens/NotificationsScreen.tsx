import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
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
import { useNotificationStore } from "../../../store/notificationStore";
import { NotificationItem } from "../components/NotificationItem";
import { groupNotificationsByDate, getRelatedRoute } from "../../../utils/notificationUtils";

export const NotificationsScreen: React.FC = () => {
  const { theme } = usePreferencesStore();
  const colors = getThemeColors(theme);
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    isLoadingMore,
    fetchNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (
    notificationId: string,
    relatedId?: string,
    relatedType?: string
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
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
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
      ) : notifications.length === 0 ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}
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
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Mark all read button - scrollable with content */}
          {unreadCount > 0 && (
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
                  className="text-base font-semibold"
                  style={{
                    color: colors.primary,
                  }}
                >
                  Đánh dấu tất cả là đã đọc
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {groupedNotifications.map((group) => (
            <View key={group.date}>
              {/* Date header */}
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
                  {group.date}
                </Text>
              </View>

              {/* Notifications for this date */}
              <View style={{ backgroundColor: colors.surface }}>
                {group.items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onPress={() =>
                      handleNotificationPress(
                        notification.id,
                        notification.relatedId,
                        notification.relatedType
                      )
                    }
                  />
                ))}
              </View>
            </View>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 20,
                backgroundColor: colors.background,
              }}
            >
              <TouchableOpacity
                onPress={loadMoreNotifications}
                disabled={isLoadingMore}
                style={{
                  backgroundColor: colors.surface,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {isLoadingMore ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.primary,
                      fontWeight: "500",
                    }}
                  >
                    Xem thông báo trước đó
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

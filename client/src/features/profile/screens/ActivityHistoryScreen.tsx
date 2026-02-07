import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useUserActivityStore } from "../../../store/userActivityStore";
import { Icon } from "../../../components/common/Icon";
import { ActivityItem } from "../components/ActivityItem";
import { groupActivitiesByDate } from "../../../utils/activityUtils";

export const ActivityHistoryScreen: React.FC = () => {
  const { theme } = usePreferencesStore();
  const colors = getThemeColors(theme);
  const { 
    activities, 
    isLoading, 
    hasMore, 
    isLoadingMore, 
    fetchActivities,
    loadMoreActivities 
  } = useUserActivityStore();
  
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleRefresh = async () => {
    await fetchActivities();
  };

  const groupedActivities = groupActivitiesByDate(activities);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
          position: "relative",
        }}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: "absolute", left: 16 }}
        >
          <Icon name="arrowLeft" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Title */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: colors.textPrimary,
          }}
        >
          Lịch sử hoạt động
        </Text>
      </View>

      {/* Content */}
      {isLoading && activities.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textSecondary }}>
            Đang tải...
          </Text>
        </View>
      ) : activities.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Icon name="calendar" size={64} color={colors.textTertiary} />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              fontWeight: "600",
              color: colors.textPrimary,
              textAlign: "center",
            }}
          >
            Chưa có hoạt động nào
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
            }}
          >
            Các hoạt động của bạn sẽ xuất hiện ở đây
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ marginTop: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {groupedActivities.map((group) => (
            <View key={group.label} style={{ marginBottom: 16 }}>
              {/* Date header */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: colors.background,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    textTransform: "uppercase",
                  }}
                >
                  {group.label}
                </Text>
              </View>

              {/* Activities */}
              <View style={{ backgroundColor: colors.surface }}>
                {group.items.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
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
                onPress={loadMoreActivities}
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
                      fontWeight: "600",
                      color: colors.primary,
                    }}
                  >
                    Xem hoạt động trước đó
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

export default ActivityHistoryScreen;

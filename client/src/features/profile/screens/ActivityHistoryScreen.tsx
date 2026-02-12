import React, { useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  SectionList,
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
import type { Activity } from "../../../services/api/activity.api";

// Section type for SectionList
interface ActivitySection {
  title: string;
  data: Activity[];
}

export const ActivityHistoryScreen: React.FC = () => {
  const { theme } = usePreferencesStore();
  const colors = getThemeColors(theme);
  const {
    activities,
    isLoading,
    hasMore,
    isLoadingMore,
    fetchActivities,
    loadMoreActivities,
  } = useUserActivityStore();

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleRefresh = useCallback(async () => {
    await fetchActivities();
  }, [fetchActivities]);

  // Transform grouped data into SectionList format
  const sections: ActivitySection[] = useMemo(() => {
    const grouped = groupActivitiesByDate(activities);
    return grouped.map((group) => ({
      title: group.label,
      data: group.items,
    }));
  }, [activities]);

  // Render section header
  const renderSectionHeader = useCallback(
    ({ section }: { section: ActivitySection }) => (
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
          {section.title}
        </Text>
      </View>
    ),
    [colors],
  );

  // Render activity item
  const renderItem = useCallback(
    ({ item }: { item: Activity }) => (
      <View style={{ backgroundColor: colors.surface }}>
        <ActivityItem activity={item} />
      </View>
    ),
    [colors],
  );

  // Key extractor
  const keyExtractor = useCallback((item: Activity) => item.id, []);

  // Handle end reached for pagination
  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMoreActivities();
    }
  }, [hasMore, isLoadingMore, loadMoreActivities]);

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
          paddingHorizontal: 32,
          paddingTop: 100,
        }}
      >
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
    );
  }, [isLoading, colors]);

  // Refresh control
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={isLoading && activities.length > 0}
        onRefresh={handleRefresh}
        tintColor={colors.primary}
      />
    ),
    [isLoading, activities.length, handleRefresh, colors],
  );

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
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
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textSecondary }}>
            Đang tải...
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          refreshControl={refreshControl}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 20,
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default ActivityHistoryScreen;

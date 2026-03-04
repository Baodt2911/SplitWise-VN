import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Icon } from "../../../components/common/Icon";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { getThemeColors } from "../../../utils/themeColors";
import {
  getInvites,
  type InviteResponse,
} from "../../../services/api/user.api";
import { acceptInvite, dismissInvite } from "../../../services/api/group.api";
import { useToast } from "../../../hooks/useToast";

export const InvitesScreen: React.FC = () => {
  const { theme } = usePreferencesStore();
  const colors = getThemeColors(theme);
  const { success: showSuccess, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["invites"],
    queryFn: getInvites,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnMount: false, // Prevent double-fetches
  });

  const invites = data?.invites || [];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const { mutate: accept, isPending: isAccepting } = useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => {
      showSuccess("Đã tham gia nhóm thành công", "Thành công");
      queryClient.invalidateQueries({ queryKey: ["invites"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (err: any) => {
      showError(err.message || "Không thể chấp nhận lời mời", "Lỗi");
    },
  });

  const { mutate: dismiss, isPending: isDismissing } = useMutation({
    mutationFn: dismissInvite,
    onSuccess: () => {
      showSuccess("Đã từ chối lời mời", "Thành công");
      queryClient.invalidateQueries({ queryKey: ["invites"] });
    },
    onError: (err: any) => {
      showError(err.message || "Không thể từ chối lời mời", "Lỗi");
    },
  });

  const renderInviteItem = useCallback(
    ({ item }: { item: InviteResponse }) => {
      return (
        <View
          style={{ backgroundColor: colors.surface }}
          className="p-4 mb-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800"
        >
          <View className="flex-row items-center mb-3">
            {item.group.avatarUrl ? (
              <Image
                source={{ uri: item.group.avatarUrl }}
                className="w-12 h-12 rounded-full mr-3"
              />
            ) : (
              <View
                style={{ backgroundColor: colors.primaryLight }}
                className="w-12 h-12 rounded-full mr-3 items-center justify-center"
              >
                <Text
                  style={{ color: colors.primary }}
                  className="text-xl font-bold"
                >
                  {item.group.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View className="flex-1">
              <Text
                style={{ color: colors.textSecondary }}
                className="text-[13px] mb-0.5"
              >
                <Text
                  style={{ color: colors.textPrimary }}
                  className="font-semibold"
                >
                  {item.inviter}
                </Text>{" "}
                đã mời bạn tham gia nhóm:
              </Text>
              <Text
                style={{ color: colors.textPrimary }}
                className="text-base font-bold"
              >
                {item.group.name}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => dismiss(item.inviteToken)}
              disabled={isAccepting || isDismissing}
              style={{
                backgroundColor: colors.background,
                borderColor: colors.border,
              }}
              className="flex-1 py-2.5 items-center rounded-lg border shadow-sm"
            >
              <Text
                style={{ color: colors.textSecondary }}
                className="font-semibold text-sm"
              >
                Bỏ qua
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => accept(item.inviteToken)}
              disabled={isAccepting || isDismissing}
              style={{ backgroundColor: colors.primary }}
              className="flex-1 py-2.5 items-center rounded-lg shadow-sm"
            >
              <Text className="text-white font-semibold text-sm">
                Chấp nhận
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [colors, accept, dismiss, isAccepting, isDismissing],
  );

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 100,
        }}
      >
        <Icon name="mail" size={64} color={colors.textTertiary} />
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.textPrimary,
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          Không có lời mời nào
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: "center",
          }}
        >
          Bạn không có lời mời tham gia nhóm nào đang chờ xử lý.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Icon name="arrowLeft" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View
            style={{ flex: 1, alignItems: "center", paddingHorizontal: 16 }}
          >
            <Text
              style={{
                fontSize: 18,
                color: colors.textPrimary,
                fontWeight: "600",
              }}
            >
              Lời mời
            </Text>
          </View>

          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={invites}
          keyExtractor={(item) => item.id}
          renderItem={renderInviteItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{
            padding: 16,
            flexGrow: 1,
          }}
        />
      )}
    </SafeAreaView>
  );
};

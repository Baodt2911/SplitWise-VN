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
  Modal,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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
import {
  confirmSettlement,
  rejectSettlement,
} from "../../../services/api/settlement.api";
import { acceptInvite, dismissInvite } from "../../../services/api/group.api";
import { useToast } from "../../../hooks/useToast";

export const NotificationsScreen: React.FC = () => {
  const { theme } = usePreferencesStore();
  const colors = getThemeColors(theme);
  const queryClient = useQueryClient();
  const { success, error: errorToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  // ─── Reject Modal State ────────────────────────────────────────────────────
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState<{
    groupId: string;
    settlementId: string;
    notificationId: string;
  } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openRejectModal = useCallback(
    (groupId: string, settlementId: string, notificationId: string) => {
      setRejectTarget({ groupId, settlementId, notificationId });
      setRejectReason("");
      setRejectModalVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    },
    [fadeAnim],
  );

  const closeRejectModal = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setRejectModalVisible(false);
      setRejectTarget(null);
      setRejectReason("");
    });
  }, [fadeAnim]);

  // ─── Notifications Query ──────────────────────────────────────────────────
  const {
    data,
    isLoading,
    isFetchingNextPage: isLoadingMore,
    hasNextPage: hasMore,
    fetchNextPage: loadMoreNotifications,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["notifications", "list"],
    queryFn: async ({ pageParam = 1 }) => await getNotifications(pageParam, 10),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.notifications.length === 10
        ? allPages.length + 1
        : undefined;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
  });

  const notifications = useMemo(() => {
    return data?.pages.flatMap((page) => page.notifications) || [];
  }, [data]);

  const unreadCount = notifications.filter(
    (n: Notification) => !n.isRead,
  ).length;

  // ─── Mark Read ────────────────────────────────────────────────────────────
  const { mutateAsync: markAsRead } = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const { mutateAsync: markAllAsRead } = useMutation({
    mutationFn: markReadAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // ─── Confirm Settlement ───────────────────────────────────────────────────
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const confirmMutation = useMutation({
    mutationFn: ({
      groupId,
      settlementId,
      notificationId,
    }: {
      groupId: string;
      settlementId: string;
      notificationId: string;
    }) => confirmSettlement(groupId, settlementId, notificationId),
    onSuccess: async (_, variables) => {
      await markAsRead(variables.notificationId).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["group"] });
      success("Đã xác nhận nhận tiền thành công!");
      setConfirmingId(null);
    },
    onError: (err: any) => {
      errorToast(
        err.response?.data?.message || "Không thể xác nhận thanh toán",
      );
      setConfirmingId(null);
    },
  });

  // ─── Reject Settlement ────────────────────────────────────────────────────
  const rejectMutation = useMutation({
    mutationFn: ({
      groupId,
      settlementId,
      reason,
      notificationId,
    }: {
      groupId: string;
      settlementId: string;
      reason: string;
      notificationId: string;
    }) => rejectSettlement(groupId, settlementId, reason, notificationId),
    onSuccess: async (_, variables) => {
      await markAsRead(variables.notificationId).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["group"] });
      success("Đã từ chối thanh toán.");
      closeRejectModal();
    },
    onError: (err: any) => {
      errorToast(err.response?.data?.message || "Không thể từ chối thanh toán");
    },
  });

  // ─── Group Invites ────────────────────────────────────────────────────────
  const acceptInviteMutation = useMutation({
    mutationFn: (token: string) => acceptInvite(token),
    onSuccess: async (_, token) => {
      // Find the notification ID for this token to mark as read
      const currentNotifications =
        queryClient.getQueryData<any[]>(["notifications"]) || [];
      const notification = currentNotifications.find(
        (n) => n.relatedId === token && n.type === "MEMBER_INVITED",
      );
      if (notification) {
        await markAsRead(notification.id).catch(() => {});
      }
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] }); // Groups list
      success("Đã chấp nhận lời mời tham gia nhóm!");
    },
    onError: (err: any) => {
      errorToast(err.response?.data?.message || "Không thể chấp nhận lời mời");
    },
  });

  const dismissInviteMutation = useMutation({
    mutationFn: (token: string) => dismissInvite(token),
    onSuccess: async (_, token) => {
      const currentNotifications =
        queryClient.getQueryData<any[]>(["notifications"]) || [];
      const notification = currentNotifications.find(
        (n) => n.relatedId === token && n.type === "MEMBER_INVITED",
      );
      if (notification) {
        await markAsRead(notification.id).catch(() => {});
      }
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      success("Đã bỏ qua lời mời.");
    },
    onError: (err: any) => {
      errorToast(err.response?.data?.message || "Không thể bỏ qua lời mời");
    },
  });

  const handleSubmitReject = useCallback(() => {
    if (!rejectTarget || !rejectReason.trim()) return;
    rejectMutation.mutate({
      ...rejectTarget,
      reason: rejectReason.trim(),
    });
  }, [rejectTarget, rejectReason, rejectMutation]);

  // ─── Handle Notification Press ───────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const isNavigatingRef = useRef(false);

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      const {
        id: notificationId,
        isRead,
        type,
      } = notification;

      // PAYMENT_REQUEST & MEMBER_INVITED: không navigate, chỉ được đọc khi confirm/reject (trừ khi user nhấn vào vùng chung)
      // Tuy nhiên, UX tốt hơn là vẫn cho xem chi tiết nếu có route
      if (isNavigatingRef.current) return;

      try {
        if (!isRead) {
          await markAsRead(notificationId);
        }

        const route = getRelatedRoute(notification);
        if (route) {
          isNavigatingRef.current = true;
          router.push(route as any);
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 500);
        }
      } catch (err) {
        console.error("[ERROR] Notification navigation failed:", err);
        isNavigatingRef.current = false;
      }
    },
    [markAsRead],
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  // ─── Flatten Data ─────────────────────────────────────────────────────────
  const flatData = useMemo(() => {
    const flattened = flattenNotifications(notifications);
    const seenKeys = new Set<string>();
    return flattened.filter((item) => {
      const key = item.type === "header" ? item.id : item.data.id;
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });
  }, [notifications]);

  // ─── Render ───────────────────────────────────────────────────────────────
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

      const notification = item.data;
      const isPaymentActionable = notification.type === "PAYMENT_REQUEST" || notification.type === "PAYMENT_DISPUTED";

      // Extract groupId and settlementId from the notification's relatedId
      // relatedType === "SETTLEMENT", relatedId === settlementId
      // groupId is embedded in the notification metadata (not directly available)
      // We pass the notification to extract needed info for settlement actions
      const settlementId = notification.relatedId;
      const groupId = notification.metadata?.groupId;

      return (
        <View style={{ backgroundColor: colors.surface }}>
          <NotificationItem
            notification={notification}
            onPress={() => handleNotificationPress(notification)}
            onConfirm={
              isPaymentActionable && settlementId && groupId
                ? () => {
                    setConfirmingId(notification.id);
                    confirmMutation.mutate({
                      groupId,
                      settlementId,
                      notificationId: notification.id,
                    });
                  }
                : notification.type === "MEMBER_INVITED" &&
                    notification.relatedId
                  ? () => {
                      setConfirmingId(notification.id);
                      acceptInviteMutation.mutate(notification.relatedId!);
                    }
                  : undefined
            }
            onReject={
              isPaymentActionable && settlementId && groupId
                ? () => openRejectModal(groupId, settlementId, notification.id)
                : notification.type === "MEMBER_INVITED" &&
                    notification.relatedId
                  ? () => {
                      dismissInviteMutation.mutate(notification.relatedId!);
                    }
                  : undefined
            }
            isConfirmLoading={confirmingId === notification.id}
          />
        </View>
      );
    },
    [
      colors,
      handleNotificationPress,
      confirmMutation,
      confirmingId,
      openRejectModal,
      acceptInviteMutation,
      dismissInviteMutation,
    ],
  );

  const keyExtractor = useCallback(
    (item: NotificationListItem, index: number) => {
      if (item.type === "header") return item.id || `header-${index}`;
      return item.data.id || `notification-${index}`;
    },
    [],
  );

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) loadMoreNotifications();
  }, [hasMore, isLoadingMore, loadMoreNotifications]);

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
            style={{ fontSize: 16, fontWeight: "600", color: colors.primary }}
          >
            Đánh dấu tất cả là đã đọc
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [unreadCount, colors, handleMarkAllRead]);

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: "center" }}>
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
            <Text className="text-lg" style={{ color: colors.textPrimary }}>
              Thông báo
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Content */}
      {isLoading && notifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
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

      {/* ─── Reject Reason Modal ─────────────────────── */}
      <Modal
        transparent
        visible={rejectModalVisible}
        animationType="none"
        onRequestClose={closeRejectModal}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.55)",
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 24,
              opacity: fadeAnim,
            }}
          >
            {/* Backdrop tap to close */}
            <TouchableOpacity
              style={{ position: "absolute", inset: 0 } as any}
              activeOpacity={1}
              onPress={closeRejectModal}
            />

            {/* Card */}
            <Animated.View
              style={{
                width: "100%",
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
                elevation: 12,
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.92, 1],
                    }),
                  },
                ],
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: colors.textPrimary,
                  }}
                >
                  Lý do từ chối
                </Text>
                <TouchableOpacity
                  onPress={closeRejectModal}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="x" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: 14,
                }}
              >
                Vui lòng nhập lý do bạn từ chối xác nhận khoản thanh toán này.
              </Text>

              <TextInput
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="VD: Tôi chưa nhận được tiền..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                autoFocus
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 14,
                  color: colors.textPrimary,
                  minHeight: 90,
                  maxHeight: 160,
                  textAlignVertical: "top",
                  marginBottom: 16,
                }}
              />

              <TouchableOpacity
                onPress={handleSubmitReject}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                style={{
                  height: 48,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    !rejectReason.trim() || rejectMutation.isPending
                      ? colors.textTertiary
                      : colors.danger,
                }}
                activeOpacity={0.85}
              >
                {rejectMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                    Xác nhận từ chối
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
};

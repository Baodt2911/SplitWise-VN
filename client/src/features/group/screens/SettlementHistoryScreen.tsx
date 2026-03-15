import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useAuthStore } from "../../../store/authStore";
import { getThemeColors } from "../../../utils/themeColors";
import { Icon } from "../../../components/common/Icon";
import { useToast } from "../../../hooks/useToast";
import {
  getSettlementHistory,
  disputeSettlement,
  type SettlementHistoryItem,
} from "../../../services/api/settlement.api";
import { dayjs } from "../../../utils/dateUtils";

const STATUS_CONFIG = {
  CONFIRMED: { label: "Đã xác nhận", color: "#10B981", bg: "#10B98115" },
  PENDING:   { label: "Chờ xác nhận", color: "#F59E0B", bg: "#F59E0B15" },
  REJECTED:  { label: "Đã từ chối",   color: "#EF4444", bg: "#EF444415" },
  DISPUTED:  { label: "Tranh chấp",   color: "#8B5CF6", bg: "#8B5CF615" },
} as const;

const METHOD_LABEL: Record<string, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  momo: "MoMo",
  zalopay: "ZaloPay",
  vnpay: "VNPay",
};

function formatCurrency(amount: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(parseFloat(amount));
}

function SettlementCard({
  item,
  currentUserId,
  colors,
  onDisputePress,
}: {
  item: SettlementHistoryItem;
  currentUserId: string;
  colors: any;
  onDisputePress?: (settlementId: string) => void;
}) {
  const isIPaid = item.payer.id === currentUserId;
  const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
  const dateStr = dayjs(item.createdAt).format("DD/MM/YYYY");
  const timeStr = dayjs(item.createdAt).format("HH:mm");

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        elevation: 1,
      }}
    >
      {/* Top row: who → who + amount */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isIPaid
              ? "#EF444420"
              : "#10B98120",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
          }}
        >
          <Icon
            name={isIPaid ? "arrowRight" : "arrowLeft"}
            size={18}
            color={isIPaid ? "#EF4444" : "#10B981"}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.textPrimary,
              marginBottom: 2,
            }}
          >
            {isIPaid
              ? `Bạn trả ${item.payee.fullName}`
              : `${item.payer.fullName} trả bạn`}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textTertiary }}>
            {dateStr} · {timeStr}
            {item.paymentMethod
              ? ` · ${METHOD_LABEL[item.paymentMethod] ?? item.paymentMethod}`
              : ""}
          </Text>
        </View>

        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: isIPaid ? "#EF4444" : "#10B981",
          }}
        >
          {isIPaid ? "-" : "+"}
          {formatCurrency(item.amount)}
        </Text>
      </View>

      {/* Status badge */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 20,
            backgroundColor: statusCfg.bg,
          }}
        >
          <Text
            style={{ fontSize: 12, fontWeight: "600", color: statusCfg.color }}
          >
            {statusCfg.label}
          </Text>
        </View>

        {item.status === "CONFIRMED" && item.confirmedAt && (
          <Text style={{ fontSize: 12, color: colors.textTertiary }}>
            Xác nhận lúc {dayjs(item.confirmedAt).format("HH:mm DD/MM")}
          </Text>
        )}
        {item.status === "REJECTED" && item.rejectionReason && (
          <Text
            style={{ fontSize: 12, color: colors.textSecondary, flex: 1 }}
            numberOfLines={1}
          >
            Lý do: {item.rejectionReason}
          </Text>
        )}
        {item.status === "DISPUTED" && item.disputeReason && (
          <Text
            style={{ fontSize: 12, color: colors.textSecondary, flex: 1 }}
            numberOfLines={1}
          >
            Khiếu nại: {item.disputeReason}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      {item.status === "REJECTED" && isIPaid && onDisputePress && (
        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
          <TouchableOpacity
            onPress={() => onDisputePress(item.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 8,
              backgroundColor: colors.surface,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.primary,
            }}
          >
            <Icon name="alertCircle" size={16} color={colors.primary} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>
              Khiếu nại trạng thái
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export const SettlementHistoryScreen = () => {
  const { id: groupId, groupName } = useLocalSearchParams<{
    id: string;
    groupName?: string;
  }>();
  const theme = usePreferencesStore((s) => s.theme);
  const colors = getThemeColors(theme);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { success, error: errorToast } = useToast();

  const [disputeModalVisible, setDisputeModalVisible] = React.useState(false);
  const [disputeReason, setDisputeReason] = React.useState("");
  const [disputeTargetId, setDisputeTargetId] = React.useState<string | null>(null);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["settlementHistory", groupId],
    queryFn: ({ pageParam = 1 }: any) =>
      getSettlementHistory(groupId!, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    enabled: !!groupId,
  });

  const disputeMutation = useMutation({
    mutationFn: ({ settlementId, reason }: { settlementId: string, reason: string }) => 
      disputeSettlement(groupId!, settlementId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlementHistory", groupId] });
      success("Đã gửi khiếu nại thành công.");
      setDisputeModalVisible(false);
      setDisputeReason("");
      setDisputeTargetId(null);
    },
    onError: (err: any) => {
      errorToast(err.response?.data?.message || "Không thể gửi khiếu nại");
    }
  });

  const openDisputeModal = React.useCallback((settlementId: string) => {
    setDisputeTargetId(settlementId);
    setDisputeReason("");
    setDisputeModalVisible(true);
  }, []);

  const handleDisputeSubmit = React.useCallback(() => {
    if (!disputeTargetId || !disputeReason.trim()) return;
    disputeMutation.mutate({
      settlementId: disputeTargetId,
      reason: disputeReason.trim(),
    });
  }, [disputeTargetId, disputeReason, disputeMutation]);

  const settlements = useMemo(
    () => data?.pages.flatMap((p: any) => p.settlements) ?? [],
    [data]
  );

  const renderItem = useCallback(
    ({ item }: { item: SettlementHistoryItem }) => (
      <SettlementCard
        item={item}
        currentUserId={user?.id ?? ""}
        colors={colors}
        onDisputePress={openDisputeModal}
      />
    ),
    [user?.id, colors, openDisputeModal]
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          height: 56,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="arrowLeft" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.textPrimary }}>
            Lịch sử thanh toán
          </Text>
          {groupName ? (
            <Text style={{ fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
              {groupName}
            </Text>
          ) : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* List */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={settlements}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 40,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingTop: 80,
              }}
            >
              <Icon name="receipt" size={56} color={colors.textTertiary} />
              <Text
                style={{
                  marginTop: 16,
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.textPrimary,
                }}
              >
                Chưa có giao dịch
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 14,
                  color: colors.textSecondary,
                  textAlign: "center",
                  paddingHorizontal: 32,
                }}
              >
                Các khoản thanh toán đã thực hiện sẽ xuất hiện tại đây.
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Dispute Modal */}
      <React.Fragment>
        {disputeModalVisible && (
          <View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 24,
            }}
          >
            <TouchableOpacity
              style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
              activeOpacity={1}
              onPress={() => setDisputeModalVisible(false)}
            />
            <View
              style={{
                width: "100%",
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 24,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>
                  Khiếu nại thanh toán
                </Text>
                <TouchableOpacity onPress={() => setDisputeModalVisible(false)}>
                  <Icon name="x" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16 }}>
                Vui lòng cung cấp lý do bạn khiếu nại khoản thanh toán này để người nhận có thể kiểm tra lại.
              </Text>

              <TextInput
                value={disputeReason}
                onChangeText={setDisputeReason}
                placeholder="Ví dụ: Tôi đã chuyển khoản qua ngân hàng..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 14,
                  color: colors.textPrimary,
                  minHeight: 80,
                  textAlignVertical: "top",
                  marginBottom: 16,
                }}
              />

              <TouchableOpacity
                onPress={handleDisputeSubmit}
                disabled={!disputeReason.trim() || disputeMutation.isPending}
                style={{
                  height: 48,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: !disputeReason.trim() || disputeMutation.isPending ? colors.textTertiary : colors.primary,
                }}
              >
                {disputeMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
                    Gửi khiếu nại
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </React.Fragment>

    </SafeAreaView>
  );
};

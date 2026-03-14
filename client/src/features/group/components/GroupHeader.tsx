import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Icon } from "../../../components/common/Icon";
import { MemberAvatarList } from "./MemberAvatarList";
import { BalanceListItem } from "./BalanceListItem";
import type {
  GroupDetail,
  GroupBalance,
} from "../../../services/api/group.api";

interface GroupHeaderProps {
  group: GroupDetail;
  colors: any;
  hasExpenses: boolean;
  currentUserId: string;
  formatCurrency: (amount: string) => string;
  onBalancePress: (balance: GroupBalance) => void;
  onPaymentPress: (balance: GroupBalance) => void;
  pendingSettlementPayeeIds: Set<string>;
}

export const GroupHeader = ({
  group,
  colors,
  hasExpenses,
  currentUserId,
  formatCurrency,
  onBalancePress,
  onPaymentPress,
  pendingSettlementPayeeIds,
}: GroupHeaderProps) => {
  const hasBalances = group.balances && group.balances.length > 0;

  return (
    <View className="w-full pt-6">

      {/* Balance/Payment Section */}
      {hasBalances && (
        <View
          className="rounded-xl shadow-sm mb-6"
          style={{ backgroundColor: colors.surface }}
        >
          {/* Section title + history link */}
          <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
            <View className="flex-row items-center gap-2">
              <Icon name="lightbulb" size={20} color="#F59E0B" />
              <Text
                className="text-xl font-bold"
                style={{ color: colors.textPrimary }}
              >
                Thanh toán
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: `/group/${group.id}/settlement-history` as any,
                  params: { groupName: group.name },
                })
              }
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingVertical: 4,
                paddingHorizontal: 8,
                borderRadius: 20,
                backgroundColor: colors.primary + "15",
              }}
            >
              <Icon name="history" size={14} color={colors.primary} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
                Lịch sử
              </Text>
            </TouchableOpacity>
          </View>

          <View className="px-4 pb-2">
            {group.balances!.map((balance, index) => (
              <BalanceListItem
                key={`${balance.payer.id}-${balance.payee.id}-${index}`}
                balance={balance}
                colors={colors}
                currentUserId={currentUserId}
                formatCurrency={formatCurrency}
                onPress={() => onBalancePress(balance)}
                onPayment={() => onPaymentPress(balance)}
                hasPendingSettlement={
                  currentUserId === balance.payer.id &&
                  pendingSettlementPayeeIds.has(balance.payee.id)
                }
              />
            ))}
          </View>
        </View>
      )}

      {/* Expenses Header */}
      {hasExpenses && (
        <View className="flex-row items-center gap-2 mb-4">
          <Text
            className="text-lg font-bold"
            style={{ color: colors.textPrimary }}
          >
            Chi phí gần đây
          </Text>
        </View>
      )}
    </View>
  );
};

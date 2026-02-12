import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
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
}

export const GroupHeader = ({
  group,
  colors,
  hasExpenses,
  currentUserId,
  formatCurrency,
  onBalancePress,
  onPaymentPress,
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
          <View className="flex-row items-center gap-2 px-4 pt-4 pb-4">
            <Icon name="lightbulb" size={20} color="#F59E0B" />
            <Text
              className="text-xl font-bold"
              style={{ color: colors.textPrimary }}
            >
              Thanh toán
            </Text>
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

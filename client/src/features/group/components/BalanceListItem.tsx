import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Icon } from "../../../components/common/Icon";
import { GroupBalance } from "../../../services/api/group.api";

interface BalanceListItemProps {
  balance: GroupBalance;
  colors: any;
  currentUserId: string;
  formatCurrency: (amount: string) => string;
  onPress: () => void;
  onPayment: () => void;
}

export const BalanceListItem = React.memo<BalanceListItemProps>(({
  balance,
  colors,
  currentUserId,
  formatCurrency,
  onPress,
  onPayment,
}) => {
  const isCurrentUserPayer = balance.payer.id === currentUserId;
  const displayText = `${balance.payer.fullName} trả ${balance.payee.fullName}`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center justify-between py-3 px-4 mb-2 rounded-xl"
      style={{
        backgroundColor: isCurrentUserPayer ? colors.surface : colors.background,
        borderWidth: isCurrentUserPayer ? 1 : 0,
        borderColor: isCurrentUserPayer ? colors.primary : "transparent",
      }}
    >
      <View className="flex-row items-center flex-1">
        {/* Arrow Icon */}
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: colors.primary + "20" }}
        >
          <Icon name="arrowRight" size={16} color={colors.primary} />
        </View>

        {/* Balance Info */}
        <View className="flex-1">
          <Text
            className="text-sm font-medium"
            style={{ color: colors.textPrimary }}
            numberOfLines={1}
          >
            {displayText}
          </Text>
          <Text
            className="text-lg font-bold mt-1"
            style={{ color: isCurrentUserPayer ? colors.error : colors.success }}
          >
            {formatCurrency(balance.amount)}
          </Text>
        </View>
      </View>

      {/* Payment Button */}
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          onPayment();
        }}
        activeOpacity={0.7}
        className="rounded-full items-center justify-center px-2 py-2"
        style={{ backgroundColor: colors.primary }}
      >
      <Text className="text-xs font-medium" style={{ color: "#fff" }}>
       Thanh toán
      </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

BalanceListItem.displayName = "BalanceListItem";

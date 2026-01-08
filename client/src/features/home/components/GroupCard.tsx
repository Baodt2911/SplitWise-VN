import { memo, useMemo } from "react";
import { Text, TouchableOpacity, View, Image } from "react-native";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import type { Group } from "../../../services/api/group.api";

interface GroupCardProps {
  group: Group;
  onPress?: () => void;
}

export const GroupCard = memo(({
  group,
  onPress,
}: GroupCardProps) => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  // Memoize calculations
  const { status, amount, statusText, statusColor, groupIcon, iconBgColor, showStatus } = useMemo(() => {
    const yourDebts = parseFloat(group.yourDebts || "0");
    const totalPeopleOweYou = parseFloat(group.totalPeopleOweYou || "0");
    
    const status = yourDebts > 0 ? "owe" : totalPeopleOweYou > 0 ? "owed" : "paid";
    const amount = yourDebts > 0 ? yourDebts : totalPeopleOweYou;

    // Hide status if no expenses
    const showStatus = group.expenseCount > 0;

    // Get the person who owes the most
    const getPersonOweYouText = () => {
      if (group.peopleOweYou.length === 0) return null;
      
      // Find person with highest debt
      const maxDebtPerson = group.peopleOweYou.reduce((max, person) => {
        const personTotal = parseFloat(person.total || "0");
        const maxTotal = parseFloat(max.total || "0");
        return personTotal > maxTotal ? person : max;
      }, group.peopleOweYou[0]);

      const amount = parseFloat(maxDebtPerson.total || "0");
      const formattedAmount = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(amount);

      return `${maxDebtPerson.fullName} nợ bạn ${formattedAmount}`;
    };

    const getStatusText = () => {
      if (status === "owe") {
        return "Bạn nợ";
      }
      if (status === "owed") {
        const personText = getPersonOweYouText();
        return personText || "nợ bạn";
      }
      return "Đã thanh toán";
    };

    const getStatusColor = () => {
      if (status === "owe") return colors.danger;
      if (status === "owed") return colors.success;
      return colors.success;
    };

    // Generate icon based on group name (simple hash)
    const getGroupIcon = () => {
      const icons = ["🏖️", "🍕", "🏠", "🚗", "🎉", "☕", "🍔", "🎬", "✈️", "🎮"];
      const hash = group.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return icons[hash % icons.length];
    };

    const getIconBgColor = () => {
      const bgColors = ["#E3F2FD", "#FFF3E0", "#EFEBE9", "#F3E5F5", "#E8F5E9", "#FFF9C4", "#FCE4EC", "#E0F2F1", "#F1F8E9", "#EDE7F6"];
      const hash = group.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return bgColors[hash % bgColors.length];
    };

    return {
      status,
      amount,
      statusText: getStatusText(),
      statusColor: getStatusColor(),
      groupIcon: getGroupIcon(),
      iconBgColor: getIconBgColor(),
      showStatus,
    };
  }, [group, colors]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center rounded-2xl p-4 mb-3 shadow-sm"
      style={{
        backgroundColor: colors.surface,
      }}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View
        className="w-12 h-12 rounded-full items-center justify-center mr-4 overflow-hidden"
        style={{ backgroundColor: iconBgColor }}
      >
        {group.avatarUrl ? (
          <Image
            source={{ uri: group.avatarUrl }}
            style={{ width: 48, height: 48 }}
            resizeMode="cover"
          />
        ) : (
          <Text className="text-2xl">{groupIcon}</Text>
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text
          className="text-base font-semibold mb-1"
          style={{
            color: colors.textPrimary,
          }}
          numberOfLines={1}
        >
          {group.name}
        </Text>
        <Text
          className="text-sm mb-1 font-medium"
          style={{
            color: colors.textSecondary,
          }}
        >
          {group.memberCount} thành viên • {group.expenseCount} chi phí
        </Text>
        {showStatus && (
          <View className="flex-row items-center">
            <Text
              className="text-sm font-semibold"
              style={{
                color: statusColor,
              }}
            >
              {statusText}
              {/* Only add amount if status is "owe" (statusText doesn't include amount) */}
              {status === "owe" && ` ${formatAmount(amount)}`}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

GroupCard.displayName = "GroupCard";


import React, { useState, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Icon } from "../../../components/common/Icon";
import { getCategoryIcon } from "../../../constants/category.constants";

interface ExpenseListItemProps {
  item: any;
  colors: any;
  theme: string;
  currentUserId?: string;
  formatDate: (dateString: string) => string;
  formatCurrency: (amount: string) => string;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ExpenseListItem = React.memo<ExpenseListItemProps>(
  ({
    item,
    colors,
    theme,
    currentUserId,
    formatDate,
    formatCurrency,
    onPress,
    onEdit,
    onDelete,
  }: ExpenseListItemProps) => {
    // Check properties safely
    const yourDebts = (item as any).yourDebts;
    const yourCredits = (item as any).yourCredits;
    const hasDebt = yourDebts && yourDebts !== "0";
    const hasCredit = yourCredits && yourCredits !== "0";

    // Get expense icon based on category
    const iconKey = item.subCategory ? item.subCategory.key : item.category;
    const iconName = getCategoryIcon(iconKey);

    let iconBgColor = "#F3F4F6";
    let iconColor = "#6B7280";

    switch (item.category) {
      case "FOOD":
        iconBgColor = "#FFF7ED";
        iconColor = "#F97316";
        break;
      case "TRANSPORT":
        iconBgColor = "#EFF6FF";
        iconColor = "#3B82F6";
        break;
      case "ENTERTAINMENT":
        iconBgColor = "#FAF5FF";
        iconColor = "#A855F7";
        break;
      case "HOUSING":
        iconBgColor = "#F0FDF4";
        iconColor = "#22C55E";
        break;
      case "TRAVEL":
        iconBgColor = "#FEF2F2";
        iconColor = "#EF4444";
        break;
      case "SHOPPING":
        iconBgColor = "#FDF2F8";
        iconColor = "#EC4899";
        break;
      case "HEALTH":
        iconBgColor = "#ECFEFF";
        iconColor = "#06B6D4";
        break;
      case "EDUCATION":
        iconBgColor = "#FFFBEB";
        iconColor = "#F59E0B";
        break;
      case "PETS":
        iconBgColor = "#F5F3FF";
        iconColor = "#8B5CF6";
        break;
      case "GIFTS":
        iconBgColor = "#FFF1F2";
        iconColor = "#F43F5E";
        break;
      case "OTHER":
        iconBgColor = "#F3F4F6";
        iconColor = "#6B7280";
        break;
      default:
        break;
    }

    // Calculate split count
    let splitCount = 1;
    if (item.splits && item.splits.length > 0) {
      const totalSplitAmount = item.splits.reduce(
        (sum: number, split: any) => sum + parseFloat(split.amount || "0"),
        0,
      );
      const expenseAmount = parseFloat(item.amount || "0");
      if (Math.abs(totalSplitAmount - expenseAmount) < 0.01) {
        splitCount = item.splits.length;
      } else {
        splitCount = item.splits.length + 1;
      }
    } else {
      splitCount = hasDebt || hasCredit ? 2 : 2;
    }

    // Prevent multiple rapid clicks
    const [isNavigating, setIsNavigating] = useState(false);

    const handlePress = useCallback(() => {
      if (isNavigating || !onPress) return;

      setIsNavigating(true);
      onPress();

      setTimeout(() => {
        setIsNavigating(false);
      }, 500);
    }, [isNavigating, onPress]);

    const handleEdit = useCallback(() => {
      if (isNavigating || !onEdit) return;

      setIsNavigating(true);
      onEdit();

      setTimeout(() => {
        setIsNavigating(false);
      }, 500);
    }, [isNavigating, onEdit]);

    const handleDelete = useCallback(() => {
      if (isNavigating || !onDelete) return;

      setIsNavigating(true);
      onDelete();

      setTimeout(() => {
        setIsNavigating(false);
      }, 500);
    }, [isNavigating, onDelete]);

    // Key to force remount and close swipeable
    const [closeKey, setCloseKey] = useState(0);

    // Swipeable ref to control programmatically
    const swipeableRef = useRef<React.ElementRef<typeof Swipeable>>(null);

    // Wrap handlers to close swipeable after action
    const handleEditWithClose = useCallback(() => {
      handleEdit();
      // Force close by remounting
      setCloseKey((prev) => prev + 1);
    }, [handleEdit]);

    const handleDeleteWithClose = useCallback(() => {
      handleDelete();
      // Force close by remounting
      setCloseKey((prev) => prev + 1);
    }, [handleDelete]);

    const renderRightActions = () => {
      return (
        <View className="flex-row mb-3 ml-2">
          <TouchableOpacity
            className="w-20 items-center justify-center rounded-l-xl"
            style={{ backgroundColor: colors.primary }}
            onPress={handleEditWithClose}
            disabled={isNavigating}
          >
            <Icon name="edit" size={18} color="#FFFFFF" />
            <Text className="text-white text-xs font-medium mt-1">Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-20 items-center justify-center rounded-r-xl"
            style={{ backgroundColor: "#EF4444" }}
            onPress={handleDeleteWithClose}
            disabled={isNavigating}
          >
            <Icon name="trash" size={18} color="#FFFFFF" />
            <Text className="text-white text-xs font-medium mt-1">Xóa</Text>
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <Swipeable
        key={closeKey}
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        overshootLeft={false}
        friction={2}
        enableTrackpadTwoFingerGesture
        containerStyle={{ overflow: "visible" }}
      >
        <TouchableOpacity
          className="flex-col gap-3 rounded-xl p-4 mb-3 shadow-sm"
          style={{
            backgroundColor: colors.surface,
            opacity: isNavigating ? 0.6 : 1,
          }}
          activeOpacity={0.7}
          onPress={handlePress}
          disabled={isNavigating}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-row items-center gap-3">
              {/* Icon Box */}
              <View
                className="flex items-center justify-center rounded-full w-12 h-12 shrink-0"
                style={{ backgroundColor: iconBgColor }}
              >
                <Icon name={iconName as any} size={20} color={iconColor} />
              </View>

              {/* Content */}
              <View className="flex-col">
                <Text
                  className="text-base font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  {item.description}
                </Text>
                <Text
                  className="text-sm font-normal mt-0.5"
                  style={{ color: colors.textSecondary }}
                >
                  {formatCurrency(item.amount)} ·{" "}
                  {item.paidById === currentUserId
                    ? "Bạn trả"
                    : `${item.paidBy} trả`}
                </Text>
              </View>
            </View>

            {/* Date */}
            <View className="text-right flex-col items-end">
              <View
                className="rounded px-1.5 py-0.5 mb-1"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
              >
                <Text
                  className="text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  {formatDate(item.expenseDate)}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer (Split info) */}
          <View
            className="flex-row items-center justify-between text-sm pt-3 border-t border-dashed"
            style={{ borderColor: colors.border + "60" }}
          >
            <View
              className="px-2 py-1 rounded"
              style={{ backgroundColor: theme === "dark" ? "#333" : "#F3F4F6" }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: colors.textSecondary }}
              >
                Chia {splitCount} người
              </Text>
            </View>

            {(hasDebt || hasCredit) && (
              <Text
                className="font-bold text-sm"
                style={{ color: hasCredit ? "#22C55E" : "#EF4444" }}
              >
                Bạn:{" "}
                {formatCurrency(hasCredit ? item.yourCredits : item.yourDebts)}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  },
);

ExpenseListItem.displayName = "ExpenseListItem";

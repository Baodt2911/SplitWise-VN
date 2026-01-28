import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Icon } from "../../../components/common/Icon";
import { MemberAvatarList } from "./MemberAvatarList";
import type { GroupDetail } from "../../../services/api/group.api";

interface GroupHeaderProps {
  group: GroupDetail;
  colors: any;
  hasExpenses: boolean;
}

export const GroupHeader = ({ group, colors, hasExpenses }: GroupHeaderProps) => {
  return (
    <View className="w-full px-4 pt-6">
      {/* Members Section */}
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
            {group.members.length} thành viên
          </Text>
          <TouchableOpacity>
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>Quản lý</Text>
          </TouchableOpacity>
        </View>
        
        <MemberAvatarList members={group.members} colors={colors} />
      </View>

      {/* Payment Section Placeholder */}
      {hasExpenses && (
        <View className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mb-6" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className="flex-row items-center gap-2 px-4 pt-4 pb-2">
            <Icon name="lightbulb" size={20} color="#F59E0B" />
            <Text className="text-base font-bold" style={{ color: colors.textPrimary }}>Thanh toán</Text>
          </View>
        </View>
      )}

      {/* Expenses Header */}
      {hasExpenses && (
        <View className="flex-row items-center gap-2 mb-4">
          <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
            Chi phí gần đây
          </Text>
        </View>
      )}
    </View>
  );
};

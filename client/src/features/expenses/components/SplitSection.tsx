import React from "react";
import { View, Text, TouchableOpacity, TextInput as RNTextInput, Image } from "react-native";
import { Icon } from "../../../components/common/Icon";
import { getMemberAvatarColor, getMemberInitials, getMemberTextColor } from "../../../utils/memberUtils";
import { GroupMember } from "../../../services/api/group.api";

const SPLIT_TYPES = [
  { value: "equal", label: "Chia đều" },
  { value: "exact", label: "Theo số tiền" },
  { value: "percentage", label: "Theo %" },
  { value: "shares", label: "Theo phần" },
] as const;

interface SplitSectionProps {
  splitType: string;
  onSplitTypeChange: (type: any) => void;
  members: GroupMember[];
  selectedMembers: string[];
  onToggleMember: (userId: string) => void;
  onSelectAll: () => void;
  exactAmounts: Record<string, string>;
  percentages: Record<string, string>;
  shares: Record<string, string>;
  onSplitValueChange: (userId: string, value: string, type: "exact" | "percentage" | "shares") => void;
  calculatedSplits: Array<{ userId: string; amount?: string; percentage?: string; shares?: string }>;
  colors: any;
  currentUserId?: string;
  formatCurrency: (value: string | number) => string;
}

export const SplitSection = ({
  splitType,
  onSplitTypeChange,
  members,
  selectedMembers,
  onToggleMember,
  onSelectAll,
  exactAmounts,
  percentages,
  shares,
  onSplitValueChange,
  calculatedSplits,
  colors,
  currentUserId,
  formatCurrency,
}: SplitSectionProps) => {
  return (
    <>
      {/* Split among */}
      <View className="mb-5">
        <View className="flex-row items-center justify-between mb-3">
          <Text
            className="text-base font-semibold"
            style={{
              color: colors.textPrimary,
            }}
          >
            Chia cho
          </Text>
          <TouchableOpacity onPress={onSelectAll} activeOpacity={0.7}>
            <Text
              className="text-sm font-semibold"
              style={{
                color: colors.primary,
              }}
            >
              Chọn tất cả
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Member Checkbox List */}
        <View 
          className="rounded-lg border-2 flex-col gap-y-4 p-4"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          {members.map((member) => {
            const isSelected = selectedMembers.includes(member.userId);
            const split = calculatedSplits.find((s) => s.userId === member.userId);
            const splitAmount = split?.amount ? formatCurrency(split.amount) : "0 đ";
            const isCurrentUser = member.userId === currentUserId;

            return (
              <View key={member.userId} className="flex-col gap-y-2">
                {/* Member Row with Checkbox */}
                <TouchableOpacity
                  className="flex-row items-center justify-between"
                  onPress={() => onToggleMember(member.userId)}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <View
                      className="w-5 h-5 rounded border-2 items-center justify-center"
                      style={{
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : "transparent",
                      }}
                    >
                      {isSelected && (
                        <Icon name="check" size={12} color="#FFFFFF" />
                      )}
                    </View>

                    <View className="flex-row items-center gap-3 flex-1">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: getMemberAvatarColor(member.userId) }}
                      >
                        {member.avatarUrl ? (
                          <Image
                            source={{ uri: member.avatarUrl }}
                            style={{ width: 40, height: 40, borderRadius: 20 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text
                            className="font-bold"
                            style={{
                              fontSize: 16,
                              color: getMemberTextColor(member.userId),
                            }}
                          >
                            {getMemberInitials(member.fullName)}
                          </Text>
                        )}
                      </View>

                      <Text className="font-medium flex-1" style={{ color: colors.textPrimary }}>
                        {isCurrentUser ? "Bạn" : member.fullName}
                      </Text>
                    </View>
                  </View>

                  {/* Show amount for equal split or when not selected */}
                  {(splitType === "equal" || !isSelected) && (
                    <Text
                      className="text-sm"
                      style={{
                        color: isSelected ? colors.textSecondary : colors.textTertiary,
                        opacity: isSelected ? 1 : 0.5,
                      }}
                    >
                      {splitAmount}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Input Field for Non-Equal Splits (only for selected members) */}
                {isSelected && splitType !== "equal" && (
                  <View className="flex-row items-center justify-between pl-8">
                    <Text className="text-sm" style={{ color: colors.textSecondary }}>
                      {splitType === "exact" && "Số tiền:"}
                      {splitType === "percentage" && "Phần trăm:"}
                      {splitType === "shares" && "Số phần:"}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <RNTextInput
                        value={
                          splitType === "exact" 
                            ? (exactAmounts[member.userId] 
                                ? new Intl.NumberFormat('vi-VN').format(parseFloat(exactAmounts[member.userId].replace(/\./g, '') || '0'))
                                : ""
                              )
                            : splitType === "percentage" 
                              ? percentages[member.userId] || "" 
                              : shares[member.userId] || ""
                        }
                        onChangeText={(val) => {
                          if (splitType === "exact") {
                            // Remove all dots and keep only numbers
                            const cleanValue = val.replace(/\./g, '');
                            onSplitValueChange(member.userId, cleanValue, "exact");
                          } else if (splitType === "percentage") {
                            onSplitValueChange(member.userId, val, "percentage");
                          } else if (splitType === "shares") {
                            onSplitValueChange(member.userId, val, "shares");
                          }
                        }}
                        placeholder={
                          splitType === "exact" ? "0" :
                          splitType === "percentage" ? "0" :
                          "1"
                        }
                        keyboardType="numeric"
                        className="h-10 px-3 rounded-lg border text-right"
                        style={{
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                          width: 100,
                        }}
                      />
                      {splitType === "exact" && (
                        <Text style={{ color: colors.textSecondary }}>đ</Text>
                      )}
                      {splitType === "percentage" && (
                        <>
                          <Text style={{ color: colors.textSecondary }}>%</Text>
                          <Text className="text-sm" style={{ color: colors.textSecondary }}>
                            = {splitAmount}
                          </Text>
                        </>
                      )}
                      {splitType === "shares" && (
                        <Text className="text-sm" style={{ color: colors.textSecondary }}>
                          = {splitAmount}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Split Type */}
      <View className="mb-5">
        <Text
          className="text-base mb-3 font-semibold"
          style={{
            color: colors.textPrimary,
          }}
        >
          Cách chia
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {SPLIT_TYPES.map((type) => {
            const isSelected = splitType === type.value;
            return (
              <TouchableOpacity
                key={type.value}
                className="flex-1 min-w-[45%] px-4 py-4 rounded-2xl border-2"
                style={{
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  shadowColor: isSelected ? colors.primary : "transparent",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isSelected ? 0.2 : 0,
                  shadowRadius: 4,
                  elevation: isSelected ? 3 : 0,
                }}
                onPress={() => onSplitTypeChange(type.value)}
                activeOpacity={0.7}
              >
                <Text
                  className="font-semibold"
                  style={{
                    fontSize: 14,
                    color: isSelected ? "#FFFFFF" : colors.textPrimary,
                    textAlign: "center",
                  }}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );
};

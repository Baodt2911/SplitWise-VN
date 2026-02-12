import React, { memo } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Icon } from "../../../components/common/Icon";

interface MemberListItemProps {
  member: {
    id: string;
    userId: string;
    fullName: string;
    avatarUrl?: string | null;
    role: string;
  };
  isCurrentUser: boolean;
  isAdmin: boolean;
  colors: {
    textPrimary: string;
    textSecondary: string;
    primary: string;
    danger: string;
    border: string;
  };
  initials: string;
  avatarColor: string;
  textColor: string;
  onRemove: () => void;
}

export const MemberListItem: React.FC<MemberListItemProps> = memo(
  ({
    member,
    isCurrentUser,
    isAdmin,
    colors,
    initials,
    avatarColor,
    textColor,
    onRemove,
  }) => {
    return (
      <View
        className="flex-row items-center justify-between py-3"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View className="flex-row items-center flex-1">
          {member.avatarUrl ? (
            <Image
              source={{ uri: member.avatarUrl }}
              style={{ width: 48, height: 48, borderRadius: 24 }}
              resizeMode="cover"
            />
          ) : (
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: avatarColor }}
            >
              <Text
                className="text-base font-bold"
                style={{
                  color: textColor,
                }}
              >
                {initials}
              </Text>
            </View>
          )}
          <View className="flex-1 ml-3">
            <Text
              className="text-base font-bold"
              style={{
                color: colors.textPrimary,
              }}
            >
              {isCurrentUser ? "Bạn" : member.fullName}
            </Text>
            <Text
              className="text-sm font-normal"
              style={{
                color:
                  member.role === "ADMIN"
                    ? colors.primary
                    : colors.textSecondary,
              }}
            >
              {member.role === "ADMIN" ? "Admin" : "Thành viên"}
            </Text>
          </View>
        </View>

        {!isCurrentUser && isAdmin && (
          <TouchableOpacity activeOpacity={0.7} onPress={onRemove}>
            <Icon name="trash" size={20} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    );
  },
);

MemberListItem.displayName = "MemberListItem";

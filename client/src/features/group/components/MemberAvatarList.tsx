import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Icon } from "../../../components/common/Icon";
import { getMemberInitials, getMemberAvatarColor, getMemberTextColor } from "../../../utils/memberUtils";
import type { GroupMember } from "../../../services/api/group.api";

interface MemberAvatarListProps {
  members: GroupMember[];
  colors: any;
  onAddMember?: () => void;
}

export const MemberAvatarList = ({ members, colors, onAddMember }: MemberAvatarListProps) => {
  return (
    <View className="flex-row items-center">
      <View className="flex-row" style={{ marginLeft: 8 }}> 
        {members.map((member, index) => {
          const initials = getMemberInitials(member.fullName);
          const avatarColor = getMemberAvatarColor(member.id);
          const textColor = getMemberTextColor(member.id);
          return (
            <View
              key={member.id}
              className="w-10 h-10 rounded-full items-center justify-center border-2"
              style={{
                backgroundColor: avatarColor,
                borderColor: colors.background,
                marginLeft: -8,
                zIndex: index,
              }}
            >
              {member.avatarUrl ? (
                <Image
                  source={{ uri: member.avatarUrl }}
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                  resizeMode="cover"
                />
              ) : (
                <Text
                  className="text-sm font-bold"
                  style={{ color: textColor }}
                >
                  {initials}
                </Text>
              )}
            </View>
          );
        })}
        {/* Add member button */}
        <TouchableOpacity
          className="w-10 h-10 rounded-full items-center justify-center border-2 border-dashed ml-2"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            zIndex: 100
          }}
          activeOpacity={0.7}
          onPress={onAddMember}
        >
          <Icon name="plus" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

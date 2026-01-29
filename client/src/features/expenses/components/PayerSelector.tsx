import React from "react";
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView, Image } from "react-native";
import { Icon } from "../../../components/common/Icon";
import { getMemberAvatarColor, getMemberInitials, getMemberTextColor } from "../../../utils/memberUtils";
import { GroupMember } from "../../../services/api/group.api";

interface PayerSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (userId: string) => void;
  selectedPayerId: string;
  members: GroupMember[];
  colors: any;
  currentUserId?: string;
}

// Memoized payer member item for better performance
interface PayerMemberItemProps {
  member: GroupMember;
  isSelected: boolean;
  isCurrentUser: boolean;
  colors: any;
  onSelect: () => void;
}

const PayerMemberItem = React.memo<PayerMemberItemProps>(({
  member,
  isSelected,
  isCurrentUser,
  colors,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      className="py-4 px-4 rounded-xl border mb-2 flex-row items-center"
      style={{
        backgroundColor: isSelected ? colors.primary : colors.surface,
        borderColor: isSelected ? colors.primary : colors.border,
      }}
      onPress={onSelect}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{
          backgroundColor: isSelected ? "#FFFFFF" : getMemberAvatarColor(member.userId),
        }}
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
              color: isSelected ? getMemberTextColor(member.userId) : getMemberTextColor(member.userId),
            }}
          >
            {getMemberInitials(member.fullName)}
          </Text>
        )}
      </View>
      <Text
        className="flex-1 font-medium"
        style={{
          fontSize: 14,
          color: isSelected ? "#FFFFFF" : colors.textPrimary,
        }}
      >
        {isCurrentUser ? "Bạn" : member.fullName}
      </Text>
      {isSelected && (
        <Icon name="check" size={20} color="#FFFFFF" />
      )}
    </TouchableOpacity>
  );
});

PayerMemberItem.displayName = "PayerMemberItem";

export const PayerSelector = ({
  visible,
  onClose,
  onSelect,
  selectedPayerId,
  members,
  colors,
  currentUserId,
}: PayerSelectorProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        className="flex-1 justify-end" 
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onPress={onClose}
      >
        <Pressable
          className="rounded-t-3xl p-6 max-h-[80%]"
          style={{ backgroundColor: colors.background }}
          onPress={(e: any) => e.stopPropagation()}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="text-lg font-semibold"
              style={{
                color: colors.textPrimary,
              }}
            >
              Chọn người trả
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="x" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {members.map((member) => {
              const isSelected = selectedPayerId === member.userId;
              const isCurrentUser = member.userId === currentUserId;
              return (
                <PayerMemberItem
                  key={member.userId}
                  member={member}
                  isSelected={isSelected}
                  isCurrentUser={isCurrentUser}
                  colors={colors}
                  onSelect={() => {
                    onSelect(member.userId);
                    onClose();
                  }}
                />
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

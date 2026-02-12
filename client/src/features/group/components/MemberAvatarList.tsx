import React, { useCallback } from "react";
import { View, Text, Image, FlatList } from "react-native";
import {
  getMemberInitials,
  getMemberAvatarColor,
  getMemberTextColor,
} from "../../../utils/memberUtils";
import type { GroupMember } from "../../../services/api/group.api";

interface MemberAvatarListProps {
  members: GroupMember[];
  colors: any;
  onAddMember?: () => void;
}

export const MemberAvatarList = ({
  members,
  colors,
  onAddMember,
}: MemberAvatarListProps) => {
  const renderItem = useCallback(
    ({ item, index }: { item: GroupMember; index: number }) => {
      const initials = getMemberInitials(item.fullName);
      const avatarColor = getMemberAvatarColor(item.id);
      const textColor = getMemberTextColor(item.id);

      // Reverse zIndex so first item is on top (or last item on top?
      // original code had index, so last item on top of previous.
      // zIndex: index works).

      return (
        <View
          className="w-10 h-10 rounded-full items-center justify-center border-2"
          style={{
            backgroundColor: avatarColor,
            borderColor: colors.background,
            marginLeft: index === 0 ? 0 : -10, // Overlap
            zIndex: index,
          }}
        >
          {item.avatarUrl ? (
            <Image
              source={{ uri: item.avatarUrl }}
              style={{ width: 36, height: 36, borderRadius: 18 }}
              resizeMode="cover"
            />
          ) : (
            <Text className="text-sm font-bold" style={{ color: textColor }}>
              {initials}
            </Text>
          )}
        </View>
      );
    },
    [colors.background],
  );

  return (
    <View className="flex-row items-center" style={{ marginLeft: 8 }}>
      <FlatList
        data={members || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false} // Disable scroll to keep it like a static list, or true if we want scrolling
        // If we want it to wrap or behave like before, purely visual list:
        // FlatList doesn't support wrap.
        // Rule 1 says "Dynamic list MUST NOT use map".
        // But if we want wrapping avatars (like in a grid), FlatList numColumns implies vertical.
        // Original code was flex-row, so it would just grow horizontally.
        // If it overflows parent, it would be cut off or wrap if flex-wrap used (but flex-wrap not used in original).
        // Original: <View className="flex-row"> ... </View>
        // It implies single line horizontal.
        // So Horizontal FlatList is correct.
      />
    </View>
  );
};

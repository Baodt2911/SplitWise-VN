import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import "dayjs/locale/vi";

import { Icon } from "../../../components/common/Icon";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { getThemeColors } from "../../../utils/themeColors";
import { useAuthStore } from "../../../store/authStore";
import { getExpenseDetail } from "../../../services/api/expense.api";
import { getGroupDetail } from "../../../services/api/group.api";
import { useQuery } from "@tanstack/react-query";
import { getCategoryIcon } from "../../../constants/category.constants";
import {
  getMemberInitials,
  getMemberAvatarColor,
  getMemberTextColor,
} from "../../../utils/memberUtils";
import {
  getComments,
  createComment,
  CommentResponse,
} from "../../../services/api/comment.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Helper function to build a 2-level comment tree (Facebook style)
export interface FlatCommentWithReplies extends CommentResponse {
  replyingToName?: string;
  replies: FlatCommentWithReplies[];
}

const buildCommentTree = (
  flatComments: CommentResponse[],
): FlatCommentWithReplies[] => {
  const commentMap = new Map<string, FlatCommentWithReplies>();
  const rootComments: FlatCommentWithReplies[] = [];

  // Initialize the map with deep copies to add custom `children` property
  // and maintain a way to find the root parent
  flatComments.forEach((c) => {
    commentMap.set(c.id, { ...c, replies: [] });
  });

  // Helper to find the absolute root parent of a comment
  const getRootParentId = (commentId: string): string | null => {
    const comment = commentMap.get(commentId);
    if (!comment) return null;
    if (!comment.parent?.id) return comment.id; // It is the root
    return getRootParentId(comment.parent.id);
  };

  flatComments.forEach((c) => {
    const comment = commentMap.get(c.id);
    if (!comment) return;

    if (c.parent?.id) {
      // It's a reply. Find the top-level root comment it belongs to.
      const rootParentId = getRootParentId(c.id);
      if (rootParentId && rootParentId !== c.id) {
        const rootComment = commentMap.get(rootParentId);
        if (rootComment) {
          // If the reply is targeting another reply, tag the immediate parent user.
          // In a flat array, we look up the immediate parent's name.
          const immediateParent = commentMap.get(c.parent.id);
          // Only tag if replying to someone else, not to yourself
          if (
            immediateParent &&
            immediateParent.id !== rootParentId &&
            immediateParent.userId !== c.userId
          ) {
            comment.replyingToName = immediateParent.fullName;
          }
          rootComment.replies.push(comment);
        }
      }
    } else {
      // It's a root comment
      rootComments.push(comment);
    }
  });

  return rootComments;
};

// Component to render Comments (Max 2 levels)
const CommentItem = ({
  comment,
  isChild = false,
  onReply,
  colors,
  getMemberInfo,
}: {
  comment: FlatCommentWithReplies;
  isChild?: boolean;
  onReply: (comment: FlatCommentWithReplies) => void;
  colors: ReturnType<typeof getThemeColors>;
  getMemberInfo: (userId: string) => any;
}) => {
  const memberInfo = getMemberInfo(comment.userId);
  // Fallback to comment's own data if memberInfo isn't fully populated
  const avatarUrl = memberInfo?.avatarUrl || comment.avatarUrl;
  const fullName = memberInfo?.fullName || comment.fullName;
  const [showReplies, setShowReplies] = useState(false);
  return (
    <View className={`mb-3 ${isChild ? "ml-10" : ""}`}>
      <View className="flex-row items-start gap-2">
        {/* Avatar */}
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} className="w-8 h-8 rounded-full" />
        ) : (
          <View
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: getMemberAvatarColor(comment.userId) }}
          >
            <Text
              className="font-bold text-xs"
              style={{ color: getMemberTextColor(comment.userId) }}
            >
              {getMemberInitials(fullName)}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <View
            className="rounded-2xl px-3 py-2 self-start"
            style={{ backgroundColor: colors.surface }}
          >
            <Text
              className="text-sm font-bold"
              style={{ color: colors.textPrimary }}
            >
              {fullName}
            </Text>
            <Text
              className="text-sm mt-0.5"
              style={{ color: colors.textPrimary, lineHeight: 20 }}
            >
              {comment.replyingToName && (
                <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                  {comment.replyingToName}{" "}
                </Text>
              )}
              {comment.content}
            </Text>
          </View>
          <View className="flex-row items-center gap-4 mt-1 ml-2">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              {dayjs(comment.createdAt).locale("vi").fromNow(true)}
            </Text>
            <TouchableOpacity onPress={() => onReply(comment)}>
              <Text
                className="text-xs font-bold"
                style={{ color: colors.textSecondary }}
              >
                Trả lời
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Render children (flattened, no more recursion) */}
      {!isChild && comment.replies && comment.replies.length > 0 && (
        <View className="mt-2">
          {!showReplies ? (
            <TouchableOpacity
              onPress={() => setShowReplies(true)}
              className="ml-10 flex-row items-center gap-2 py-1"
            >
              <View
                className="w-8 h-[1px]"
                style={{ backgroundColor: colors.border }}
              />
              <Text
                className="text-sm font-medium"
                style={{ color: colors.textSecondary }}
              >
                Xem {comment.replies.length} câu trả lời
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              {comment.replies.map((child) => (
                <CommentItem
                  key={child.id}
                  comment={child}
                  isChild={true}
                  onReply={onReply}
                  colors={colors}
                  getMemberInfo={getMemberInfo}
                />
              ))}
              <TouchableOpacity
                onPress={() => setShowReplies(false)}
                className="ml-10 flex-row items-center gap-2 py-1 mt-1 mb-2"
              >
                <View
                  className="w-8 h-[1px]"
                  style={{ backgroundColor: colors.border }}
                />
                <Text
                  className="text-sm font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Ẩn câu trả lời
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
};

export const ExpenseDetailScreen = () => {
  const params = useLocalSearchParams<{ id: string; expenseId: string }>();
  const { t } = useTranslation();
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  const user = useAuthStore((state) => state.user);

  const { data: groupData } = useQuery({
    queryKey: ["group", params.id],
    queryFn: () => getGroupDetail(params.id!),
    enabled: !!params.id,
  });

  const group = groupData?.group;

  const { data: expense, isLoading } = useQuery({
    queryKey: ["expense", params.id, params.expenseId],
    queryFn: async () => {
      const res = await getExpenseDetail(params.id!, params.expenseId!);
      // Server wraps response as { expense: {...} }, check for error first
      if ("message" in res && !("expense" in (res as any))) {
        throw new Error((res as any).message);
      }
      // Unwrap the expense from the server response
      return (res as any).expense ?? (res as any);
    },
    enabled: !!params.id && !!params.expenseId,
  });

  const { data: commentsData } = useQuery({
    queryKey: ["comments", params.id, params.expenseId],
    queryFn: () => getComments(params.id!, params.expenseId!),
    enabled: !!params.id && !!params.expenseId,
  });

  const commentTree = useMemo(() => {
    return buildCommentTree(commentsData || []);
  }, [commentsData]);

  const [comment, setComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<CommentResponse | null>(null);

  const queryClient = useQueryClient();
  const createCommentMutation = useMutation({
    mutationFn: (newComment: { content: string; parentId?: string }) =>
      createComment(
        params.id!,
        params.expenseId!,
        newComment.content,
        newComment.parentId,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", params.id, params.expenseId],
      });
      setComment("");
      setReplyingTo(null);
    },
  });

  const handlePostComment = () => {
    if (!comment.trim()) return;
    createCommentMutation.mutate({
      content: comment.trim(),
      parentId: replyingTo?.id,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!expense) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: colors.textSecondary }}>
            Không tìm thấy chi phí
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Format currency
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseFloat(amount));
  };

  // Get category colors
  const getCategoryColors = (category: string) => {
    switch (category) {
      case "FOOD":
        return { bg: "#FFF7ED", text: "#F97316" };
      case "TRANSPORT":
        return { bg: "#EFF6FF", text: "#3B82F6" };
      case "HOUSING":
        return { bg: "#F0FDF4", text: "#22C55E" };
      case "ENTERTAINMENT":
        return { bg: "#FAF5FF", text: "#A855F7" };
      case "TRAVEL":
        return { bg: "#FEF2F2", text: "#EF4444" };
      case "SHOPPING":
        return { bg: "#FDF2F8", text: "#EC4899" };
      case "HEALTH":
        return { bg: "#ECFEFF", text: "#06B6D4" };
      case "EDUCATION":
        return { bg: "#FFFBEB", text: "#F59E0B" };
      case "PETS":
        return { bg: "#F5F3FF", text: "#8B5CF6" };
      case "GIFTS":
        return { bg: "#FFF1F2", text: "#F43F5E" };
      case "OTHER":
        return { bg: "#F3F4F6", text: "#6B7280" };
      default:
        return { bg: "#F3F4F6", text: "#6B7280" };
    }
  };

  const categoryColors = getCategoryColors(expense.category);
  const iconKey = expense.subCategory
    ? expense.subCategory.key
    : expense.category;
  const iconName = getCategoryIcon(iconKey);

  // Get member info helper
  const getMemberInfo = (userId: string) => {
    if (!userId) {
      return { fullName: "Unknown User ID", avatarUrl: null };
    }

    if (userId === user?.id) {
      return { fullName: user?.fullName || "Bạn", avatarUrl: user?.avatarUrl };
    }
    const member = group?.members.find((m) => m.userId === userId);
    return member || { fullName: "Unknown", avatarUrl: null };
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: colors.border }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full"
        >
          <Icon name="arrowLeft" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text
          className="text-lg font-bold"
          style={{ color: colors.textPrimary }}
        >
          Chi tiết chi phí
        </Text>
        <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-full">
          <Icon name="moreVertical" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 p-4" style={{ paddingBottom: 20 }}>
            {/* Main Info Card */}
            <View
              className="rounded-xl p-5 mb-4 shadow-sm"
              style={{ backgroundColor: colors.surface }}
            >
              <View className="flex-row items-center gap-4">
                <View
                  className="w-14 h-14 rounded-full items-center justify-center"
                  style={{ backgroundColor: categoryColors.bg }}
                >
                  <Icon
                    name={iconName as any}
                    size={28}
                    color={categoryColors.text}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm font-medium mb-1"
                    style={{ color: colors.textSecondary }}
                  >
                    {t(`categories.${expense.category}`)}
                    {expense.subCategory &&
                      ` - ${t(`categories.${expense.subCategory.key}`)}`}
                  </Text>
                  <Text
                    className="text-xl font-bold"
                    style={{ color: colors.textPrimary }}
                  >
                    {expense.description}
                  </Text>
                </View>
              </View>

              <View
                className="mt-4 pt-4 flex-row items-end justify-between border-t"
                style={{ borderColor: colors.border }}
              >
                <View>
                  <Text
                    className="text-2xl font-extrabold"
                    style={{ color: colors.primary }}
                  >
                    {formatCurrency(expense.amount)}
                  </Text>
                  <Text
                    className="mt-1 text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    {dayjs(expense.expenseDate).format("dddd, DD/MM/YYYY")}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    {expense.paidById === user?.id
                      ? "Bạn"
                      : getMemberInfo(expense.paidById).fullName}{" "}
                    trả
                  </Text>
                  {getMemberInfo(expense.paidById).avatarUrl ? (
                    <Image
                      source={{
                        uri: getMemberInfo(expense.paidById).avatarUrl!,
                      }}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: getMemberAvatarColor(expense.paidById),
                      }}
                    >
                      <Text
                        className="font-bold text-xs"
                        style={{ color: getMemberTextColor(expense.paidById) }}
                      >
                        {getMemberInitials(expense.paidBy || "Unknown")}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Split Details Card — only show when there are actual splits */}
            {expense.splits?.length > 0 && (
              <View
                className="rounded-xl p-5 mb-4 shadow-sm"
                style={{ backgroundColor: colors.surface }}
              >
                <View className="flex-row items-center gap-2 mb-4">
                  <Icon
                    name="pieChart"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text
                    className="text-base font-bold"
                    style={{ color: colors.textPrimary }}
                  >
                    Chia cho {expense.splits.length} người (
                    {expense.splitType === "EQUAL" ? "đều" : "khác"})
                  </Text>
                </View>

                <View className="gap-3">
                  {expense.splits.map((split: any) => {
                    const memberInfo = getMemberInfo(split.userId);
                    return (
                      <View
                        key={split.id}
                        className="flex-row items-center justify-between"
                      >
                        <View className="flex-row items-center gap-3">
                          {memberInfo.avatarUrl ? (
                            <Image
                              source={{ uri: memberInfo.avatarUrl }}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <View
                              className="w-10 h-10 rounded-full items-center justify-center"
                              style={{
                                backgroundColor: getMemberAvatarColor(
                                  split.userId,
                                ),
                              }}
                            >
                              <Text
                                className="font-bold"
                                style={{
                                  color: getMemberTextColor(split.userId),
                                }}
                              >
                                {getMemberInitials(memberInfo.fullName)}
                              </Text>
                            </View>
                          )}
                          <Text
                            className="font-medium"
                            style={{ color: colors.textPrimary }}
                          >
                            {memberInfo.fullName}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Text
                            className="font-semibold"
                            style={{ color: colors.textPrimary }}
                          >
                            {formatCurrency(split.amount)}
                          </Text>
                          {/* Assuming everyone is included/checked for now */}
                          <Icon name="check" size={20} color="#22C55E" />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Receipt Card */}
            {expense.receiptUrl && (
              <View
                className="rounded-xl p-5 mb-4 shadow-sm"
                style={{ backgroundColor: colors.surface }}
              >
                <View className="flex-row items-center gap-2 mb-4">
                  <Icon name="receipt" size={20} color={colors.textSecondary} />
                  <Text
                    className="text-base font-bold"
                    style={{ color: colors.textPrimary }}
                  >
                    Hóa đơn
                  </Text>
                </View>
                <Image
                  source={{ uri: expense.receiptUrl }}
                  className="w-full h-48 rounded-lg bg-gray-100 dark:bg-gray-800"
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Note Card */}
            {expense.notes && (
              <View
                className="rounded-xl p-5 mb-4 shadow-sm"
                style={{ backgroundColor: colors.surface }}
              >
                <View className="flex-row items-center gap-2 mb-3">
                  <Icon name="edit" size={20} color={colors.textSecondary} />
                  <Text
                    className="text-base font-bold"
                    style={{ color: colors.textPrimary }}
                  >
                    Ghi chú
                  </Text>
                </View>
                <Text style={{ color: colors.textSecondary }}>
                  {expense.notes}
                </Text>
              </View>
            )}

            {/* Comments Section */}
            <View className="mb-4">
              <Text
                className="text-base font-bold mb-4 px-1"
                style={{ color: colors.textPrimary }}
              >
                Bình luận ({commentsData?.length || 0})
              </Text>

              {commentTree.length > 0 ? (
                <View className="px-1">
                  {commentTree.map((c) => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      onReply={(commentObj) => setReplyingTo(commentObj)}
                      colors={colors}
                      getMemberInfo={getMemberInfo}
                    />
                  ))}
                </View>
              ) : (
                <Text
                  className="text-center italic mt-4"
                  style={{ color: colors.textSecondary }}
                >
                  Chưa có bình luận nào.
                </Text>
              )}
            </View>
          </View>
        </ScrollView>

        <View className="px-4 pb-4 bg-background">
          {replyingTo && (
            <View className="flex-row items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-t-xl">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Đang trả lời{" "}
                <Text className="font-bold">{replyingTo.fullName}</Text>
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Icon name="x" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
          <View className="relative flex-row items-center">
            <TextInput
              className={`flex-1 py-3 pl-5 pr-12 text-sm ${replyingTo ? "rounded-b-2xl rounded-t-none" : "rounded-full"}`}
              style={{
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                borderColor: colors.border,
                borderWidth: 1,
              }}
              placeholder="Thêm bình luận..."
              placeholderTextColor={colors.textTertiary}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handlePostComment}
              disabled={createCommentMutation.isPending || !comment.trim()}
              className="absolute right-2 w-9 h-9 items-center justify-center rounded-full"
              style={{
                backgroundColor:
                  !comment.trim() || createCommentMutation.isPending
                    ? colors.border
                    : colors.primary,
              }}
            >
              {createCommentMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name="arrowRight" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

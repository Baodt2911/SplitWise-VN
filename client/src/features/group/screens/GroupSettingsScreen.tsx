import { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, Text, TouchableOpacity, View, Image, Switch, TextInput, Clipboard } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useAuthStore } from "../../../store/authStore";
import { Icon } from "../../../components/common/Icon";
import { getGroupDetail, type GroupDetail } from "../../../services/api/group.api";
import { useToast } from "../../../hooks/useToast";
import { useAlert } from "../../../hooks/useAlert";
import { useGroupStore } from "../../../store/groupStore";

export const GroupSettingsScreen = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const theme = usePreferencesStore((state) => state.theme);
  const language = usePreferencesStore((state) => state.language);
  const colors = getThemeColors(theme);
  const currentUser = useAuthStore((state) => state.user);
  const { error: showError, success: showSuccess } = useToast();
  const { alert } = useAlert();
  const getGroupDetailFromStore = useGroupStore((state) => state.getGroupDetail);
  const setGroupDetail = useGroupStore((state) => state.setGroupDetail);
  const groupFromStore = useGroupStore((state) => params.id ? state.groupDetails[params.id] : undefined);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [allowMemberEdit, setAllowMemberEdit] = useState(false);
  const [requirePaymentConfirmation, setRequirePaymentConfirmation] = useState(false);
  const [autoReminderEnabled, setAutoReminderEnabled] = useState(false);

  // Use refs to avoid dependency issues
  const showErrorRef = useRef(showError);
  const showSuccessRef = useRef(showSuccess);
  const languageRef = useRef(language);
  
  useEffect(() => {
    showErrorRef.current = showError;
    showSuccessRef.current = showSuccess;
    languageRef.current = language;
  }, [showError, showSuccess, language]);

  // Load group detail - check store first, only call API if forceRefresh or not in store
  const loadGroupDetail = useCallback(async (forceRefresh = false) => {
    if (!params.id) {
      showErrorRef.current("Không tìm thấy ID nhóm", "Lỗi");
      router.back();
      return;
    }

    // Check store first if not forcing refresh
    if (!forceRefresh) {
      const storedGroup = getGroupDetailFromStore(params.id);
      if (storedGroup) {
        // Use data from store, no API call needed
        setGroup(storedGroup);
        setIsPublic(storedGroup.isPublic);
        setAllowMemberEdit(storedGroup.allowMemberEdit);
        setRequirePaymentConfirmation(storedGroup.requirePaymentConfirmation);
        setAutoReminderEnabled(storedGroup.autoReminderEnabled);
        setIsLoading(false);
        return; // Exit early, no API call
      }
    }

    // Not in store or force refresh, load from API
    try {
      setIsLoading(true);
      const response = await getGroupDetail(params.id);
      setGroup(response.group);
      setIsPublic(response.group.isPublic);
      setAllowMemberEdit(response.group.allowMemberEdit);
      setRequirePaymentConfirmation(response.group.requirePaymentConfirmation);
      setAutoReminderEnabled(response.group.autoReminderEnabled);
      // Save to store
      setGroupDetail(params.id, response.group);
    } catch (err: any) {
      const errorMessage = err.message || (languageRef.current === "vi" ? "Không thể tải thông tin nhóm" : "Failed to load group");
      showErrorRef.current(errorMessage, languageRef.current === "vi" ? "Lỗi" : "Error");
    } finally {
      setIsLoading(false);
    }
  }, [params.id, setGroupDetail, getGroupDetailFromStore]);

  // Initial load - check store first, only call API if not in store
  useEffect(() => {
    if (params.id) {
      const storedGroup = getGroupDetailFromStore(params.id);
      if (storedGroup) {
        // Use data from store, no API call needed
        setGroup(storedGroup);
        setIsPublic(storedGroup.isPublic);
        setAllowMemberEdit(storedGroup.allowMemberEdit);
        setRequirePaymentConfirmation(storedGroup.requirePaymentConfirmation);
        setAutoReminderEnabled(storedGroup.autoReminderEnabled);
        setIsLoading(false);
      } else {
        // Not in store, load from API
        loadGroupDetail();
      }
    }
  }, [params.id, getGroupDetailFromStore, loadGroupDetail]);

  // Update when store changes
  useEffect(() => {
    if (groupFromStore) {
      setGroup(groupFromStore);
      setIsPublic(groupFromStore.isPublic);
      setAllowMemberEdit(groupFromStore.allowMemberEdit);
      setRequirePaymentConfirmation(groupFromStore.requirePaymentConfirmation);
      setAutoReminderEnabled(groupFromStore.autoReminderEnabled);
    }
  }, [groupFromStore]);

  // Get member initials - only first letter
  // Get member initials - first letter of last word
  const getMemberInitials = useCallback((name: string) => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) return "?";
    const words = trimmedName.split(/\s+/).filter(word => word.length > 0);
    if (words.length === 0) return "?";
    // Get first letter of last word
    const lastWord = words[words.length - 1];
    return lastWord[0].toUpperCase();
  }, []);

  // Get member avatar color
  const getMemberAvatarColor = useCallback((id: string) => {
    const colors = [
      "#E1BEE7", "#C8E6C9", "#BBDEFB", "#FFE0B2",
      "#F8BBD0", "#B2DFDB", "#D1C4E9", "#FFCCBC",
    ];
    const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, []);

  // Get member text color
  const getMemberTextColor = useCallback((id: string) => {
    const colors = [
      "#7B1FA2", "#388E3C", "#1976D2", "#F57C00",
      "#C2185B", "#00796B", "#512DA8", "#E64A19",
    ];
    const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, []);

  // Copy invite link
  const handleCopyLink = useCallback(async () => {
    if (!group) return;
    const inviteLink = `splitwise.vn/join/${group.inviteCode}`;
    Clipboard.setString(inviteLink);
    showSuccessRef.current(
      languageRef.current === "vi" ? "Đã sao chép link" : "Link copied",
      languageRef.current === "vi" ? "Thành công" : "Success"
    );
  }, [group]);

  // Get current user role
  const getCurrentUserRole = () => {
    if (!group || !currentUser) return null;
    const member = group.members.find((m) => m.userId === currentUser.id);
    return member?.role || "MEMBER";
  };

  const isAdmin = getCurrentUserRole() === "ADMIN";

  const translations = {
    vi: {
      title: "Cài đặt nhóm",
      groupInfo: "Thông tin nhóm",
      members: "Thành viên",
      addMember: "Thêm thành viên",
      privacy: "Quyền riêng tư",
      public: "Công khai",
      publicDesc: "Bất kỳ ai có link đều có thể tham gia",
      private: "Riêng tư",
      privateDesc: "Chỉ admin mới có thể mời thành viên",
      newLink: "Link mới",
      copy: "Sao chép",
      createNew: "Tạo mới",
      qrCode: "Mã QR",
      options: "Tùy chọn",
      allowMemberEdit: "Cho phép thành viên sửa/xóa",
      requirePaymentConfirmation: "Yêu cầu xác nhận thanh toán",
      autoNotifications: "Thông báo tự động",
      data: "Dữ liệu",
      exportData: "Xuất dữ liệu nhóm",
      archiveGroup: "Lưu trữ nhóm",
      dangerZone: "Vùng nguy hiểm",
      leaveGroup: "Rời nhóm",
      deleteGroup: "Xóa nhóm",
      admin: "Admin",
      member: "Thành viên",
    },
    en: {
      title: "Group Settings",
      groupInfo: "Group Information",
      members: "Members",
      addMember: "Add member",
      privacy: "Privacy",
      public: "Public",
      publicDesc: "Anyone with a link can join",
      private: "Private",
      privateDesc: "Only admin can invite members",
      newLink: "New Link",
      copy: "Copy",
      createNew: "Create New",
      qrCode: "QR Code",
      options: "Options",
      allowMemberEdit: "Allow members to edit/delete",
      requirePaymentConfirmation: "Require payment confirmation",
      autoNotifications: "Automatic notifications",
      data: "Data",
      exportData: "Export group data",
      archiveGroup: "Archive group",
      dangerZone: "Danger Zone",
      leaveGroup: "Leave group",
      deleteGroup: "Delete group",
      admin: "Admin",
      member: "Member",
    },
  };

  const t = translations[language];

  if (isLoading || !group) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        className="border-b"
        style={{
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        }}
      >
        <View className="flex-row items-center justify-between px-4 py-4">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Icon name="arrowLeft" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View className="flex-1 items-center px-4">
            <Text
              className="text-lg"
              style={{
                color: colors.textPrimary,
              }}
            >
              {t.title}
            </Text>
          </View>

          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Information Section */}
        <View
          className="rounded-2xl mx-4 mt-4 p-6"
          style={{ backgroundColor: colors.surface }}
        >
          <View className="items-center mb-4">
            <View className="relative">
              {group.avatarUrl ? (
                <Image
                  source={{ uri: group.avatarUrl }}
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  className="w-24 h-24 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primaryLight }}
                >
                  <Text
                    className="text-3xl"
                    style={{
                      color: colors.primary,
                    }}
                  >
                    {getMemberInitials(group.name)}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Icon name="edit" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <Text
            className="text-xl text-center mb-2 font-bold"
            style={{
              color: colors.textPrimary,
            }}
          >
            {group.name}
          </Text>

          {group.description && (
            <Text
              className="text-sm text-center font-normal"
              style={{
                color: colors.textSecondary,
              }}
            >
              {group.description}
            </Text>
          )}
        </View>

        {/* Members Section */}
        <View
          className="rounded-2xl mx-4 mt-4 p-4"
          style={{ backgroundColor: colors.surface }}
        >
          <View className="flex-row items-center mb-4">
            <Icon name="users" size={20} color={colors.textPrimary} />
            <Text
              className="text-base ml-2"
              style={{
                color: colors.textPrimary,
              }}
            >
              {t.members} ({group.members.length})
            </Text>
          </View>

          {group.members.map((member) => {
            const initials = getMemberInitials(member.fullName);
            const avatarColor = getMemberAvatarColor(member.id);
            const textColor = getMemberTextColor(member.id);
            const isCurrentUser = currentUser && member.userId === currentUser.id;

            return (
              <View
                key={member.id}
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
                      {isCurrentUser ? (language === "vi" ? "Bạn" : "You") : member.fullName}
                    </Text>
                    <Text
                      className="text-sm font-normal"
                      style={{
                        color: member.role === "ADMIN" ? colors.primary : colors.textSecondary,
                      }}
                    >
                      {member.role === "ADMIN" ? t.admin : t.member}
                    </Text>
                  </View>
                </View>

                {!isCurrentUser && isAdmin && (
                  <TouchableOpacity activeOpacity={0.7}>
                    <Icon name="trash" size={20} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {isAdmin && (
            <TouchableOpacity
              className="flex-row items-center justify-center py-3 mt-2 rounded-xl"
              style={{ backgroundColor: colors.primary }}
              activeOpacity={0.8}
            >
              <Icon name="userPlus" size={20} color="#FFFFFF" />
              <Text
                className="text-base ml-2"
                style={{
                  color: "#FFFFFF",
                }}
              >
                {t.addMember}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Privacy Settings Section */}
        <View
          className="rounded-2xl mx-4 mt-4 p-4"
          style={{ backgroundColor: colors.surface }}
        >
          <View className="flex-row items-center mb-4">
            <Icon name="lock" size={20} color={colors.textPrimary} />
            <Text
              className="text-base ml-2"
              style={{
                color: colors.textPrimary,
              }}
            >
              {t.privacy}
            </Text>
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-between py-3"
            activeOpacity={0.7}
            onPress={() => setIsPublic(true)}
          >
            <View className="flex-1">
              <Text
                className="text-base"
                style={{
                  color: colors.textPrimary,
                }}
              >
                {t.public}
              </Text>
              <Text
                className="text-sm mt-1"
                style={{
                  color: colors.textSecondary,
                }}
              >
                {t.publicDesc}
              </Text>
            </View>
            <View
              className="w-5 h-5 rounded-full items-center justify-center"
              style={{
                borderWidth: 2,
                borderColor: isPublic ? colors.primary : colors.border,
                backgroundColor: isPublic ? colors.primary : "transparent",
              }}
            >
              {isPublic && (
                <View
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: "#FFFFFF" }}
                />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-3"
            activeOpacity={0.7}
            onPress={() => setIsPublic(false)}
          >
            <View className="flex-1">
              <Text
                className="text-base"
                style={{
                  color: colors.textPrimary,
                }}
              >
                {t.private}
              </Text>
              <Text
                className="text-sm mt-1"
                style={{
                  color: colors.textSecondary,
                }}
              >
                {t.privateDesc}
              </Text>
            </View>
            <View
              className="w-5 h-5 rounded-full items-center justify-center"
              style={{
                borderWidth: 2,
                borderColor: !isPublic ? colors.primary : colors.border,
                backgroundColor: !isPublic ? colors.primary : "transparent",
              }}
            >
              {!isPublic && (
                <View
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: "#FFFFFF" }}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* New Link Section */}
        <View
          className="rounded-2xl mx-4 mt-4 p-4"
          style={{ backgroundColor: colors.surface }}
        >
          <View className="flex-row items-center mb-4">
            <Icon name="link" size={20} color={colors.textPrimary} />
            <Text
              className="text-base ml-2"
              style={{
                color: colors.textPrimary,
              }}
            >
              {t.newLink}
            </Text>
          </View>

          <View className="flex-row items-center mb-3">
            <TextInput
              className="flex-1 rounded-xl px-4 py-3 mr-2"
              style={{
                backgroundColor: colors.background,
                color: colors.textPrimary,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              value={`splitwise.vn/join/${group.inviteCode}`}
              editable={false}
            />
            <TouchableOpacity
              className="px-4 py-3 rounded-xl"
              style={{ backgroundColor: colors.primary }}
              activeOpacity={0.8}
              onPress={handleCopyLink}
            >
              <Text
                className="text-base"
                style={{
                  color: "#FFFFFF",
                }}
              >
                {t.copy}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 py-3 rounded-xl"
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              activeOpacity={0.7}
            >
              <Text
                className="text-center text-base"
                style={{
                  color: colors.primary,
                }}
              >
                {t.createNew}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 py-3 rounded-xl flex-row items-center justify-center"
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              activeOpacity={0.7}
            >
              <Icon name="qrcode" size={20} color={colors.primary} />
              <Text
                className="text-base ml-2"
                style={{
                  color: colors.primary,
                }}
              >
                {t.qrCode}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Options Section */}
        <View
          className="rounded-2xl mx-4 mt-4 p-4"
          style={{ backgroundColor: colors.surface }}
        >
          <View className="flex-row items-center mb-4">
            <Icon name="settings" size={20} color={colors.textPrimary} />
            <Text
              className="text-base ml-2"
              style={{
                color: colors.textPrimary,
              }}
            >
              {t.options}
            </Text>
          </View>

          <View className="flex-row items-center justify-between ">
            <Text
              className="flex-1 text-base"
              style={{
                color: colors.textPrimary,
              }}
            >
              {t.allowMemberEdit}
            </Text>
            <Switch
              value={allowMemberEdit}
              onValueChange={setAllowMemberEdit}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={allowMemberEdit ? colors.primary : colors.textSecondary}
            />
          </View>

          <View className="flex-row items-center justify-between ">
            <Text
              className="flex-1 text-base"
              style={{
                color: colors.textPrimary,
              }}
            >
              {t.requirePaymentConfirmation}
            </Text>
            <Switch
              value={requirePaymentConfirmation}
              onValueChange={setRequirePaymentConfirmation}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={requirePaymentConfirmation ? colors.primary : colors.textSecondary}
            />
          </View>

          <View className="flex-row items-center justify-between ">
            <Text
              className="flex-1 text-base"
              style={{
                color: colors.textPrimary,
              }}
            >
              {t.autoNotifications}
            </Text>
            <Switch
              value={autoReminderEnabled}
              onValueChange={setAutoReminderEnabled}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={autoReminderEnabled ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Data Section */}
        <View
          className="rounded-2xl mx-4 mt-4 p-4"
          style={{ backgroundColor: colors.surface }}
        >
          <View className="flex-row items-center mb-4">
            <Icon name="database" size={20} color={colors.textPrimary} />
            <Text
              className="text-base ml-2"
              style={{
                color: colors.textPrimary,
              }}
            >
              {t.data}
            </Text>
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-between py-3"
            activeOpacity={0.7}
          >
            <Text
              className="text-base"
              style={{
                color: colors.textPrimary,
              }}
            >
              {t.exportData}
            </Text>
            <Icon name="chevronRight" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-3"
            activeOpacity={0.7}
          >
            <Text
              className="text-base"
              style={{
                color: colors.textPrimary,
              }}
            >
              {t.archiveGroup}
            </Text>
            <Icon name="chevronRight" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View
          className="rounded-2xl mx-4 mt-4 p-4 mb-6"
          style={{
            backgroundColor: colors.surface,
          }}
        >
          <TouchableOpacity
            className="py-3 rounded-xl mb-3"
            style={{
              backgroundColor: colors.danger + "20",
              borderWidth: 1,
              borderColor: colors.danger,
            }}
            activeOpacity={0.7}
          >
            <Text
              className="text-center text-base"
              style={{
                color: colors.danger,
              }}
            >
              {t.leaveGroup}
            </Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              className="py-3 rounded-xl"
              style={{ backgroundColor: colors.danger }}
              activeOpacity={0.8}
            >
              <Text
                className="text-center text-base"
                style={{
                  color: "#FFFFFF",
                }}
              >
                {t.deleteGroup}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


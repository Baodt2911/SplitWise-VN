import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useAuthStore } from "../../../store/authStore";
import { Icon } from "../../../components/common/Icon";
import { logout } from "../../../services/api/auth.api";
import { useToast } from "../../../hooks/useToast";
import { useAlert } from "../../../hooks/useAlert";
import { ThemeModal } from "../components/ThemeModal";
import { unregisterPushTokenApi } from "../../../services/notifications";
import { uploadImage, deleteImage } from "../../../services/api/upload.api";
import { updateProfile } from "../../../services/api/user.api";

export const ProfileScreen = () => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { success, error } = useToast();
  const { alert } = useAlert();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Mock data - will be replaced with real API calls later
  const bankAccount = {
    bankName: "Vietcombank",
    accountNumber: "1234567890",
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number: +84 987 654 321
    if (phone.startsWith("+84")) {
      return phone.replace(/(\+84)(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4");
    }
    if (phone.startsWith("84")) {
      return `+${phone.replace(/(84)(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4")}`;
    }
    return phone;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handlePickAvatar = async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        error("Bạn cần cấp quyền truy cập ảnh để đổi ảnh đại diện");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleUploadAvatar(result.assets[0].uri);
      }
    } catch (err) {
      error("Không thể mở thư viện ảnh");
    }
  };

  const handleUploadAvatar = async (uri: string) => {
    setIsUploadingAvatar(true);
    try {
      const filename = uri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename || "");
      const type = match ? `image/${match[1]}` : `image`;

      const currentUser = useAuthStore.getState().user;

      // Delete old avatar from Cloudinary if exists
      const oldAvatarUrl = currentUser?.avatarUrl;
      if (oldAvatarUrl && oldAvatarUrl.includes("cloudinary")) {
        // Extract public_id: everything after /upload/v{version}/ up to the extension
        const match = oldAvatarUrl.match(
          /\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/,
        );
        if (match?.[1]) {
          deleteImage(match[1], "avatar").catch(() => {
            // Ignore deletion errors — image may already be gone
          });
        }
      }

      // Upload to cloudinary
      const uploadResult = await uploadImage(
        { uri, name: filename, type },
        "avatar",
      );

      const newAvatarUrl = uploadResult.secure_url;

      if (currentUser) {
        useAuthStore.setState({
          user: { ...currentUser, avatarUrl: newAvatarUrl },
        });
      }

      // Sync with server in background
      updateProfile({ avatarUrl: newAvatarUrl }).catch(() => {
        // Rollback on failure
        if (currentUser) {
          useAuthStore.setState({ user: currentUser });
        }
        error("Không thể lưu ảnh đại diện lên server");
      });

      success("Cập nhật ảnh đại diện thành công");
    } catch (err: any) {
      error(err.message || "Lỗi khi tải ảnh lên");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      try {
        const SecureStore = require("expo-secure-store");
        const pushToken = await SecureStore.getItemAsync("expoPushToken");
        console.log("Push token:", pushToken);

        if (pushToken) {
          await unregisterPushTokenApi(pushToken);
          await SecureStore.deleteItemAsync("expoPushToken");
        }
      } catch (pushError) {
        console.warn("Failed to unregister push token:", pushError);
        // Continue with logout even if push token unregister fails
      }

      const result = await logout();
      if ("message" in result && result.message) {
        // Logout successful - success toast TRƯỚC khi navigate
        success("Đăng xuất thành công", "Đăng xuất");
        await clearAuth();
        router.replace("/auth/login");
      } else if ("field" in result) {
        // Server error
        const errorResult = result as { field?: string; message?: string };
        error(errorResult.message || "Đăng xuất thất bại");
      }
    } catch (err: any) {
      error(err.message || "Không thể kết nối đến server");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    alert("Bạn có chắc chắn muốn đăng xuất không?", "Xác nhận đăng xuất", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: performLogout,
      },
    ]);
  };

  const handleSettingPress = (key: string) => {
    // Prevent double navigation
    if (isNavigating) return;

    switch (key) {
      case "theme":
        setThemeModalVisible(true);
        break;
      case "notifications":
      case "activityHistory":
        setIsNavigating(true);
        const route =
          key === "notifications" ? "/notifications" : "/activity-history";
        router.push(route);
        // Reset after a short delay
        setTimeout(() => setIsNavigating(false), 500);
        break;
      case "security":
      case "about":
        // Handle other settings later
        break;
      default:
        break;
    }
  };

  const settingsItems = [
    { key: "notifications", label: "Thông báo", icon: "bell" as const },
    {
      key: "activityHistory",
      label: "Lịch sử hoạt động",
      icon: "clock" as const,
    },
    { key: "security", label: "Bảo mật", icon: "lock" as const },
    { key: "theme", label: "Giao diện", icon: "settings" as const },
    { key: "about", label: "Về ứng dụng", icon: "info" as const },
  ];

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* User Profile Section */}
        <View className="items-center py-8 px-4">
          {/* Avatar with edit button */}
          <View className="relative mb-4">
            <View
              className="w-24 h-24 rounded-full items-center justify-center overflow-hidden"
              style={{ backgroundColor: colors.imageBackground }}
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Icon name="user" size={40} color={colors.textSecondary} />
              )}
            </View>
            <TouchableOpacity
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              onPress={handlePickAvatar}
              disabled={isUploadingAvatar}
            >
              <Icon name="edit" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Name */}
          <Text
            className="text-2xl font-bold mb-1"
            style={{
              color: colors.textPrimary,
            }}
          >
            {user?.fullName || "Nguyễn Văn An"}
          </Text>

          {/* Phone */}
          <Text
            className="text-base font-normal"
            style={{
              color: colors.textSecondary,
            }}
          >
            {user?.phone ? formatPhoneNumber(user.phone) : "+84 987 654 321"}
          </Text>
        </View>

        {/* Main Content Card */}
        <View
          className="mx-4 mb-4 rounded-3xl px-4 py-6"
          style={{
            backgroundColor: colors.card,
          }}
        >
          {/* Bank Account Section */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Text
                className="text-xl font-extrabold "
                style={{
                  color: colors.textPrimary,
                }}
              >
                Tài khoản ngân hàng
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 px-4">
                <Text
                  className="text-sm mb-1 font-normal"
                  style={{
                    color: colors.textSecondary,
                  }}
                >
                  {bankAccount.bankName} STK:
                </Text>
                <Text
                  className="text-base font-normal"
                  style={{
                    color: colors.textPrimary,
                  }}
                >
                  {bankAccount.accountNumber}
                </Text>
              </View>
              <TouchableOpacity
                className="px-4 py-2 rounded-xl"
                style={{ backgroundColor: colors.primary }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: colors.primaryText,
                  }}
                >
                  Sửa
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Settings Section */}
          <View>
            {settingsItems.map((item, index) => (
              <TouchableOpacity
                key={item.key}
                className="flex-row items-center justify-between py-3"
                style={{
                  borderBottomWidth: index < settingsItems.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
                onPress={() => handleSettingPress(item.key)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center flex-1">
                  <Icon
                    name={item.icon}
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text
                    className="text-base ml-3 font-normal"
                    style={{
                      color: colors.textPrimary,
                    }}
                  >
                    {item.label}
                  </Text>
                </View>
                <Icon
                  name="chevronRight"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View className="mx-4 mb-4">
          <TouchableOpacity
            className="rounded-xl py-4 items-center"
            style={{ backgroundColor: colors.danger }}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                className="text-base font-bold"
                style={{
                  color: "#FFFFFF",
                }}
              >
                Đăng xuất
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <ThemeModal
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
      />
    </SafeAreaView>
  );
};

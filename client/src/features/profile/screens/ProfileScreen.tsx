import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useAuthStore } from "../../../store/authStore";
import { Icon } from "../../../components/common/Icon";
import { BottomNavBar } from "../../home/components/BottomNavBar";
import { logout } from "../../../services/api/auth.api";
import { useToast } from "../../../hooks/useToast";
import { useAlert } from "../../../hooks/useAlert";
import { ThemeModal } from "../components/ThemeModal";
import { LanguageModal } from "../components/LanguageModal";

export const ProfileScreen = () => {
  const theme = usePreferencesStore((state) => state.theme);
  const language = usePreferencesStore((state) => state.language);
  const colors = getThemeColors(theme);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { success, error } = useToast();
  const { alert } = useAlert();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // Mock data - will be replaced with real API calls later
  const bankAccount = {
    bankName: "Vietcombank",
    accountNumber: "1234567890",
  };

  const statistics = {
    totalSpent: 2450000,
    totalReceived: 1820000,
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

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await logout();
      if ("message" in result) {
        // Logout successful
        await clearAuth();
        success("Đăng xuất thành công");
        // Khi logout trong app, redirect đến login (không reset onboarding)
        // Onboarding sẽ được reset khi app khởi động lại và không có auth
        router.replace("/auth/login");
      } else {
        // Server error
        error(result.message || "Đăng xuất thất bại");
      }
    } catch (err: any) {
      // Network error or other errors
      error(err.message || "Không thể kết nối đến server");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    alert(
      language === "vi" 
        ? "Bạn có chắc chắn muốn đăng xuất không?" 
        : "Are you sure you want to logout?",
      language === "vi" ? "Xác nhận đăng xuất" : "Confirm Logout",
      [
        {
          text: language === "vi" ? "Hủy" : "Cancel",
          style: "cancel",
        },
        {
          text: language === "vi" ? "Đăng xuất" : "Logout",
          style: "destructive",
          onPress: performLogout,
        },
      ]
    );
  };

  const handleSettingPress = (key: string) => {
    switch (key) {
      case "theme":
        setThemeModalVisible(true);
        break;
      case "language":
        setLanguageModalVisible(true);
        break;
      case "notifications":
      case "security":
      case "about":
        // Handle other settings later
        break;
      default:
        break;
    }
  };

  const settingsItems = [
    { key: "notifications", label: { vi: "Thông báo", en: "Notifications" }, icon: "bell" as const },
    { key: "security", label: { vi: "Bảo mật", en: "Security" }, icon: "lock" as const },
    { key: "theme", label: { vi: "Giao diện", en: "Interface" }, icon: "settings" as const },
    { key: "language", label: { vi: "Ngôn ngữ", en: "Language" }, icon: "globe" as const },
    { key: "about", label: { vi: "Về ứng dụng", en: "About app" }, icon: "info" as const },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
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
              className="w-24 h-24 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.imageBackground }}
            >
              <Text className="text-4xl">👤</Text>
            </View>
            <TouchableOpacity
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary }}
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
            backgroundColor: colors.surface,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {/* Bank Account Section */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Icon name="building" size={20} color="#F39C12" />
              <Text
                className="text-lg font-bold ml-2"
                style={{
                  color: colors.textPrimary,
                }}
              >
                {language === "vi" ? "Tài khoản ngân hàng" : "Bank Account"}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  className="text-sm mb-1 font-normal"
                  style={{
                    color: colors.textSecondary,
                  }}
                >
                  {bankAccount.bankName} {language === "vi" ? "STK:" : "Account:"}
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
                  {language === "vi" ? "Sửa" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Statistics Section */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Icon name="barChart" size={20} color="#F39C12" />
              <Text
                className="text-lg font-bold ml-2"
                style={{
                  color: colors.textPrimary,
                }}
              >
                {language === "vi" ? "Thống kê" : "Statistics"}
              </Text>
            </View>
            <View className="flex-row gap-3">
              {/* Total Spent Card */}
              <View
                className="flex-1 rounded-2xl px-4 py-4"
                style={{
                  backgroundColor: colors.background,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text
                  className="text-xs mb-2 font-normal"
                  style={{
                    color: colors.textSecondary,
                  }}
                >
                  {language === "vi" ? "Tổng chi" : "Total Spent"}
                </Text>
                <Text
                  className="text-lg font-bold"
                  style={{
                    color: colors.textPrimary,
                  }}
                >
                  {formatCurrency(statistics.totalSpent)}
                </Text>
              </View>

              {/* Total Received Card */}
              <View
                className="flex-1 rounded-2xl px-4 py-4"
                style={{
                  backgroundColor: colors.background,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text
                  className="text-xs mb-2 font-normal"
                  style={{
                    color: colors.textSecondary,
                  }}
                >
                  {language === "vi" ? "Tổng nhận" : "Total Received"}
                </Text>
                <Text
                  className="text-lg font-bold"
                  style={{
                    color: colors.textPrimary,
                  }}
                >
                  {formatCurrency(statistics.totalReceived)}
                </Text>
              </View>
            </View>
          </View>

          {/* Settings Section */}
          <View>
            <View className="flex-row items-center mb-3">
              <Icon name="settings" size={20} color="#F39C12" />
              <Text
                className="text-lg font-bold ml-2"
                style={{
                  color: colors.textPrimary,
                }}
              >
                {language === "vi" ? "Cài đặt" : "Settings"}
              </Text>
            </View>
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
                  <Icon name={item.icon} size={20} color={colors.textSecondary} />
                  <Text
                    className="text-base ml-3 font-normal"
                    style={{
                      color: colors.textPrimary,
                    }}
                  >
                    {item.label[language]}
                  </Text>
                </View>
                <Icon name="chevronRight" size={20} color={colors.textSecondary} />
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
                {language === "vi" ? "Đăng xuất" : "Logout"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNavBar />

      {/* Modals */}
      <ThemeModal
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
      />
      <LanguageModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
      />
    </SafeAreaView>
  );
};


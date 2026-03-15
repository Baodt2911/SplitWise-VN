import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePreferencesStore } from "../../src/store/preferencesStore";
import { getThemeColors } from "../../src/utils/themeColors";
import {
  verifyInvite,
  verifyInviteCode,
  acceptInvite,
  dismissInvite,
  joinGroup,
  type VerifyInviteResponse,
} from "../../src/services/api/group.api";
import { Icon } from "../../src/components/common/Icon";
import { StatusBar } from "expo-status-bar";
import { useAlert } from "../../src/hooks/useAlert";

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  const { alert } = useAlert();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<VerifyInviteResponse["data"] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isCode = token?.length === 6;

  useEffect(() => {
    if (!token) {
      setError("Token lời mời không hợp lệ.");
      setIsLoading(false);
      return;
    }

    const checkToken = async () => {
      try {
        const response = isCode 
          ? await verifyInviteCode(token)
          : await verifyInvite(token);

        if ("message" in response && !("data" in response)) {
          // It's an error
          setError(response.message || "Lời mời không hợp lệ hoặc đã hết hạn.");
        } else if ("data" in response) {
          const data = (response as VerifyInviteResponse).data;
          setInviteData(data);
          
          if (data?.isMember && data.groupId) {
            alert("Bạn đã là thành viên của nhóm này rồi.", "Thông báo", [
              {
                text: "Vào nhóm",
                onPress: () => router.replace(`/group/${data.groupId}`),
              }
            ]);
            // Still setting inviteData so the UI draws something underneath the modal,
            // rather than returning early and bypassing the finally block.
          }
        }
      } catch (err: any) {
        setError(err.message || "Lỗi cập nhật lời mời.");
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, [token, isCode]);

  const handleAccept = async () => {
    if (!token || isProcessing) return;
    try {
      setIsProcessing(true);
      const res = isCode 
        ? await joinGroup({ code: token })
        : await acceptInvite(token);

      if ("message" in res && !res.message.toLowerCase().includes("lỗi")) {
        alert("Bạn đã tham gia nhóm thành công!", "Thành công", [
          { text: "OK", onPress: () => router.replace("/") },
        ]);
      } else {
        const msg = ("message" in res) ? res.message : "Không thể tham gia nhóm.";
        alert(msg, "Lỗi");
      }
    } catch (err: any) {
      alert("Đã xảy ra lỗi khi tham gia nhóm.", "Lỗi");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!token || isProcessing) return;
    
    // Nếu là mã công khai, chỉ cần quay lại trang chủ
    if (isCode) {
      router.replace("/");
      return;
    }

    try {
      setIsProcessing(true);
      const res = await dismissInvite(token);
      if ("message" in res && !res.message.toLowerCase().includes("lỗi")) {
        alert("Đã từ chối lời mời.", "Thành công", [
          { text: "OK", onPress: () => router.replace("/") },
        ]);
      } else {
        const msg = ("message" in res) ? res.message : "Không thể từ chối lời mời.";
        alert(msg, "Lỗi");
      }
    } catch (err: any) {
      alert("Đã xảy ra lỗi khi từ chối.", "Lỗi");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>Đang kiểm tra lời mời...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <View className="flex-1 justify-center items-center px-6">
        {error ? (
          <View className="items-center w-full">
            <View className="w-20 h-20 rounded-full items-center justify-center mb-6" style={{ backgroundColor: colors.danger + "20" }}>
              <Icon name="alertCircle" size={40} color={colors.danger} />
            </View>
            <Text className="text-xl font-bold text-center mb-2" style={{ color: colors.textPrimary }}>Ôi không!</Text>
            <Text className="text-base text-center mb-8" style={{ color: colors.textSecondary }}>{error}</Text>
            <TouchableOpacity
              onPress={() => router.replace("/")}
              className="w-full py-4 rounded-2xl items-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-base font-bold text-white">Về trang chủ</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="items-center w-full">
            <View className="w-24 h-24 rounded-3xl items-center justify-center mb-6 shadow-sm" style={{ backgroundColor: colors.primary + "20" }}>
              <Icon name="users" size={48} color={colors.primary} />
            </View>
            <Text className="text-2xl font-bold text-center mb-2" style={{ color: colors.textPrimary }}>
              Lời mời tham gia nhóm
            </Text>
            <Text className="text-base text-center mb-8" style={{ color: colors.textSecondary }}>
              <Text className="font-bold" style={{ color: colors.textPrimary }}>{inviteData?.inviterName}</Text> đã mời bạn tham gia nhóm <Text className="font-bold" style={{ color: colors.textPrimary }}>{inviteData?.groupName}</Text>.
            </Text>

            <View className="w-full gap-3">
              <TouchableOpacity
                onPress={handleAccept}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl items-center flex-row justify-center"
                style={{ backgroundColor: colors.primary, opacity: isProcessing ? 0.7 : 1 }}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-base font-bold text-white">Tham gia ngay</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleDecline}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl items-center"
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, opacity: isProcessing ? 0.7 : 1 }}
              >
                <Text className="text-base font-bold" style={{ color: colors.textSecondary }}>Từ chối</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

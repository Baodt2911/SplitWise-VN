import { KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { Button } from "../components/Button";
import { OTPInput } from "../components/OTPInput";
import { createOtpSchema, type OtpFormData } from "../schemas/auth.schema";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useToast } from "../../../hooks/useToast";
import { verifyOtpRegister, sendOtpRegister } from "../../../services/api/otp.api";

const OTPVerifyScreen = () => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  const params = useLocalSearchParams<{ email?: string; type?: "register" | "forgot-password" }>();
  const { success, error } = useToast();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<OtpFormData>({
    resolver: zodResolver(createOtpSchema()),
    mode: "onBlur",
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = async (data: OtpFormData) => {
    try {
      if (!params.email) {
        error("Thiếu email.", "Lỗi");
        return;
      }

      if (params.type === "register") {
        // Verify OTP for registration
        await verifyOtpRegister({ email: params.email, otp: data.otp });
        success("Xác minh OTP thành công! Vui lòng đăng nhập.", "Thành công");
        router.replace("/auth/login");
      } else if (params.type === "forgot-password") {
        // TODO: Implement verify OTP for forgot password
        success("Xác minh OTP thành công!", "Thành công");
        router.push({
          pathname: "/auth/reset-password",
          params: { email: params.email, otp: data.otp }
        });
      } else {
        error("Loại xác minh không hợp lệ.", "Lỗi");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Mã OTP không đúng. Vui lòng thử lại.";
      error(errorMessage, "Lỗi");
    }
  };

  const handleResend = async () => {
    if (!params.email) {
      error("Thiếu email để gửi lại mã.", "Lỗi");
      return;
    }
    try {
      await sendOtpRegister(params.email);
      success("Mã OTP đã được gửi lại!", "Thành công");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Gửi lại mã OTP thất bại.";
      error(errorMessage, "Lỗi");
    }
  };

  const t = {
    title: "Xác thực",
    instruction: "Nhập mã OTP",
    sentTo: "Mã xác thực đã được gửi đến email",
    didntReceive: "Không nhận được mã?",
    resend: "Gửi lại mã",
    confirmButton: "Xác nhận",
  };

  const isDark = theme === "dark";
  
  // Gradient colors based on theme
  const gradientColors = isDark
    ? [colors.primaryLight, colors.background, colors.surface] as const
    : [colors.primaryLight, "#E8F5F0", "#F0FBF8", colors.background] as const;

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1" style={{ backgroundColor: "transparent" }}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <View
            className="flex-1 px-5 pt-4 pb-4"
            style={{ justifyContent: "center" }}
          >
            {/* Form Container */}
            <View
              className="rounded-3xl px-5 pt-6 pb-5"
              style={{
                backgroundColor: colors.card,       
              }}
            >
              {/* Header */}
              <View className="items-center mb-8">
                <Text
                  className="text-3xl text-center mb-1.5 font-extrabold"
                  style={{
                    color: colors.textPrimary,
                  }}
                >
                  {t.title}
                </Text>
                <Text
                  className="text-base text-center mb-2 font-medium"
                  style={{
                    color: colors.textPrimary,
                  }}
                >
                  {t.instruction}
                </Text>
                <Text
                  className="text-sm text-center font-medium"
                  style={{
                    color: colors.textSecondary,
                  }}
                >
                  {t.sentTo + "\n" + (params.email || "")}
                </Text>
              </View>

              {/* OTP Input */}
              <View className="mb-6">
                <OTPInput control={control} name="otp" />
              </View>

              {/* Resend Link */}
              <View className="mb-6 flex-row items-center justify-center">
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: colors.textSecondary,
                  }}
                >
                  {t.didntReceive}{" "}
                </Text>
                <TouchableOpacity onPress={handleResend}>
                  <Text
                    className="text-sm font-semibold"
                    style={{
                      color: colors.primary,
                    }}
                  >
                    {t.resend}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Confirm Button */}
              <Button
                title={t.confirmButton}
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default OTPVerifyScreen;


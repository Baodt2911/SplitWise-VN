import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { createLoginSchema, type LoginFormData } from "../schemas/auth.schema";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useToast } from "../../../hooks/useToast";
import {
  login,
  type ApiError,
  type LoginResponse,
} from "../../../services/api/auth.api";
import { useAuthStore } from "../../../store/authStore";
import { verifyGoogleToken } from "../../../services/api/googleAuth.api";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { setupPushNotifications } from "../../../services/notifications";
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
});
const LoginScreen = () => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  const { success, error: showError } = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(createLoginSchema()),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login({
        email: data.email,
        password: data.password,
      });

      // Check if result is an error response (has field property)
      if ("field" in result) {
        const apiError = result as ApiError;

        // Show toast with error message
        showError(apiError.message, "Lỗi");

        // Set error to form field to highlight with red border
        if (apiError.field === "email") {
          setError("email", {
            type: "server",
            message: apiError.message,
          });
        } else if (apiError.field === "password") {
          setError("password", {
            type: "server",
            message: apiError.message,
          });
        }

        return;
      }

      // Success - TypeScript now knows result is LoginResponse
      const loginResponse = result as LoginResponse;
      await setAuth({
        user: loginResponse.user,
        accessToken: loginResponse.accessToken,
        refreshToken: loginResponse.refreshToken,
        sessionId: loginResponse.sessionId,
      });

      // Đăng ký push notification sau khi đăng nhập thành công
      setupPushNotifications();

      success("Đăng nhập thành công!", "Đăng nhập");
      // Navigate to home after successful login
      router.replace("/(tabs)/home");
    } catch (err: any) {
      // Network error or other unexpected errors
      const errorMessage =
        err.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      showError(errorMessage, "Lỗi");
    }
  };

  const isDark = theme === "dark";

  // Gradient colors based on theme
  const gradientColors = isDark
    ? ([colors.primaryLight, colors.background, colors.surface] as const)
    : ([colors.primaryLight, "#E8F5F0", "#F0FBF8", colors.background] as const);

  const handleLoginGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      const idToken = tokens.idToken;
      if (idToken) {
        const authResult = await verifyGoogleToken(idToken);

        // Store auth data - same as regular login
        await setAuth({
          user: authResult.user,
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken,
          sessionId: authResult.sessionId,
        });

        // Đăng ký push notification sau khi đăng nhập thành công
        setupPushNotifications();

        success("Đăng nhập thành công!", "Đăng nhập");
        // Navigate to home after successful login
        router.replace("/(tabs)/home");
      }
    } catch (error: any) {
      // Handle different types of errors
      const errorMessage = error.message || "Đăng nhập Google thất bại";
      showError(errorMessage, "Lỗi");
      console.error("Google Sign-In Error:", error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: "transparent" }}
      >
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
              className="rounded-3xl px-5 pt-6 pb-5 "
              style={{
                backgroundColor: colors.card,
              }}
            >
              {/* Header */}
              <View className="items-center mb-8 ">
                <Text
                  className="text-3xl text-center mb-1.5 font-extrabold"
                  style={{
                    color: colors.textPrimary,
                  }}
                >
                  Chào mừng trở lại
                </Text>
                <Text
                  className="text-base text-center font-medium"
                  style={{
                    color: colors.textSecondary,
                  }}
                >
                  Nhập email và mật khẩu để đăng nhập
                </Text>
              </View>

              {/* Form */}
              <TextInput
                label="Email"
                placeholder="Nhập địa chỉ email"
                control={control}
                name="email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                label="Mật khẩu"
                placeholder="Nhập mật khẩu"
                control={control}
                name="password"
                secureTextEntry
                showPasswordToggle
              />

              {/* Forgot Password */}
              <TouchableOpacity
                onPress={() => router.push("/auth/forgot-password")}
                className="self-end mb-4"
              >
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: colors.primary,
                  }}
                >
                  Quên mật khẩu?
                </Text>
              </TouchableOpacity>

              <Button
                title="Đăng nhập"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
              />

              {/* Divider */}
              <View className="flex-row items-center my-5">
                <View
                  className="flex-1 h-px"
                  style={{ backgroundColor: colors.border }}
                />
                <Text
                  className="px-3 text-sm font-medium"
                  style={{
                    color: colors.textSecondary,
                  }}
                >
                  Hoặc đăng nhập bằng
                </Text>
                <View
                  className="flex-1 h-px"
                  style={{ backgroundColor: colors.border }}
                />
              </View>

              {/* Social Login Buttons */}
              <View className="flex-row justify-center gap-3 mb-4">
                <TouchableOpacity
                  onPress={handleLoginGoogle}
                  disabled={isGoogleLoading}
                  className="w-full rounded-xl shadow-lg overflow-hidden"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: isGoogleLoading ? 0.6 : 1,
                  }}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center justify-center py-3.5 px-4">
                    {isGoogleLoading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Image
                          source={require("../../../../assets/icons/google.png")}
                          style={{ width: 20, height: 20 }}
                          resizeMode="contain"
                        />
                        <Text
                          className="ml-3 text-base font-semibold"
                          style={{ color: colors.textPrimary }}
                        >
                          Đăng nhập với Google
                        </Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Link */}
            <View className="mt-8 flex-row justify-center items-center">
              <Text
                className="text-sm font-medium"
                style={{
                  color: colors.textSecondary,
                }}
              >
                Chưa có tài khoản?
              </Text>
              <TouchableOpacity onPress={() => router.push("/auth/register")}>
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: colors.primary,
                  }}
                >
                  Đăng ký
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default LoginScreen;

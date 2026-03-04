import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Switch,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { User } from "../../../types/models";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { getThemeColors } from "../../../utils/themeColors";
import { Icon } from "../../../components/common/Icon";

interface EditPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (data: {
    language?: string;
    timezone?: string;
    currency?: string;
    allowDirectAdd?: boolean;
  }) => Promise<void>;
  isSaving: boolean;
}

export const EditPreferencesModal: React.FC<EditPreferencesModalProps> = ({
  visible,
  onClose,
  user,
  onSave,
  isSaving,
}) => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const [language, setLanguage] = useState(user?.language || "vi");
  const [timezone, setTimezone] = useState(
    user?.timezone || "Asia/Ho_Chi_Minh",
  );
  const [currency, setCurrency] = useState(user?.currency || "VND");
  const [allowDirectAdd, setAllowDirectAdd] = useState(
    user?.allowDirectAdd ?? false,
  );
  const [error, setError] = useState<string | null>(null);

  // Reset state when opened
  React.useEffect(() => {
    if (visible && user) {
      setLanguage(user.language || "vi");
      setTimezone(user.timezone || "Asia/Ho_Chi_Minh");
      setCurrency(user.currency || "VND");
      setAllowDirectAdd(user.allowDirectAdd ?? false);
      setError(null);
    }
  }, [visible, user]);

  const handleSave = async () => {
    try {
      if (currency.trim().length !== 3) {
        setError("Mã tiền tệ phải có đúng 3 ký tự (VD: VND, USD)");
        return;
      }
      setError(null);
      await onSave({
        language: language.trim(),
        timezone: timezone.trim(),
        currency: currency.trim().toUpperCase(),
        allowDirectAdd,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          className="rounded-t-3xl pt-6 pb-8 px-6"
          style={{ backgroundColor: colors.background }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text
              className="text-xl font-bold"
              style={{ color: colors.textPrimary }}
            >
              Tùy chọn hệ thống
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Icon name="x" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error && (
            <Text className="text-red-500 text-sm mb-4 text-center">
              {error}
            </Text>
          )}

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.textSecondary }}
              >
                Ngôn ngữ (Mã)
              </Text>
              <TextInput
                value={language}
                onChangeText={setLanguage}
                placeholder="VD: vi, en"
                className="p-4 rounded-xl text-base"
                style={{
                  backgroundColor: colors.card,
                  color: colors.textPrimary,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View>
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.textSecondary }}
              >
                Múi giờ
              </Text>
              <TextInput
                value={timezone}
                onChangeText={setTimezone}
                placeholder="VD: Asia/Ho_Chi_Minh"
                className="p-4 rounded-xl text-base"
                style={{
                  backgroundColor: colors.card,
                  color: colors.textPrimary,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View>
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.textSecondary }}
              >
                Tiền tệ (3 ký tự)
              </Text>
              <TextInput
                value={currency}
                onChangeText={setCurrency}
                placeholder="VD: VND, USD"
                autoCapitalize="characters"
                maxLength={3}
                className="p-4 rounded-xl text-base"
                style={{
                  backgroundColor: colors.card,
                  color: colors.textPrimary,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View
              className="flex-row items-center justify-between p-4 rounded-xl"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View className="flex-1 mr-4">
                <Text
                  className="text-base font-medium"
                  style={{ color: colors.textPrimary }}
                >
                  Cho phép thêm trực tiếp
                </Text>
                <Text
                  className="text-sm mt-1"
                  style={{ color: colors.textSecondary }}
                >
                  Người khác có thể thêm bạn vào nhóm mà không cần hỏi ý kiến.
                </Text>
              </View>
              <Switch
                value={allowDirectAdd}
                onValueChange={setAllowDirectAdd}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={Platform.OS === "android" ? "white" : undefined}
              />
            </View>
          </View>

          {/* Action */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className="mt-8 p-4 rounded-xl flex-row items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-bold">
                Lưu thay đổi
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </Modal>
  );
};

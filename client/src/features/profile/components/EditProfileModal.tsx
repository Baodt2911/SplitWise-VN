import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { User } from "../../../types/models";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { getThemeColors } from "../../../utils/themeColors";
import { Icon } from "../../../components/common/Icon";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (data: { fullName?: string; phone?: string | null }) => Promise<void>;
  isSaving: boolean;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  user,
  onSave,
  isSaving,
}) => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [error, setError] = useState<string | null>(null);

  // Reset state when opened
  React.useEffect(() => {
    if (visible && user) {
      setFullName(user.fullName);
      setPhone(user.phone || "");
      setError(null);
    }
  }, [visible, user]);

  const handleSave = async () => {
    try {
      if (!fullName.trim()) {
        setError("Họ tên không được để trống");
        return;
      }
      setError(null);
      await onSave({
        fullName: fullName.trim(),
        phone: phone.trim() ? phone.trim() : null,
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
              Thông tin cá nhân
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
                Họ và Tên
              </Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nhập họ và tên..."
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
                Số điện thoại
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Nhập số điện thoại..."
                keyboardType="phone-pad"
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
                Email
              </Text>
              <TextInput
                value={user?.email || ""}
                editable={false}
                className="p-4 rounded-xl text-base opacity-60"
                style={{
                  backgroundColor: colors.card,
                  color: colors.textPrimary,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
              <Text
                className="text-xs mt-1"
                style={{ color: colors.textSecondary }}
              >
                Email không thể thay đổi
              </Text>
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

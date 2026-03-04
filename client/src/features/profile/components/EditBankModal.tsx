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

interface EditBankModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (data: {
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
  }) => Promise<void>;
  isSaving: boolean;
}

export const EditBankModal: React.FC<EditBankModalProps> = ({
  visible,
  onClose,
  user,
  onSave,
  isSaving,
}) => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const [bankName, setBankName] = useState(user?.bankName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(
    user?.bankAccountNumber || "",
  );
  const [bankAccountName, setBankAccountName] = useState(
    user?.bankAccountName || "",
  );
  const [error, setError] = useState<string | null>(null);

  // Reset state when opened
  React.useEffect(() => {
    if (visible && user) {
      setBankName(user.bankName || "");
      setBankAccountNumber(user.bankAccountNumber || "");
      setBankAccountName(user.bankAccountName || "");
      setError(null);
    }
  }, [visible, user]);

  const handleSave = async () => {
    try {
      setError(null);
      await onSave({
        bankName: bankName.trim() ? bankName.trim() : null,
        bankAccountNumber: bankAccountNumber.trim()
          ? bankAccountNumber.trim()
          : null,
        bankAccountName: bankAccountName.trim() ? bankAccountName.trim() : null,
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
              Tài khoản ngân hàng
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
                Tên Ngân hàng
              </Text>
              <TextInput
                value={bankName}
                onChangeText={setBankName}
                placeholder="VD: Vietcombank, Techcombank..."
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
                Số tài khoản
              </Text>
              <TextInput
                value={bankAccountNumber}
                onChangeText={setBankAccountNumber}
                placeholder="Nhập số tài khoản..."
                keyboardType="number-pad"
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
                Tên chủ tài khoản
              </Text>
              <TextInput
                value={bankAccountName}
                onChangeText={setBankAccountName}
                placeholder="VD: NGUYEN VAN A. (Không dấu)"
                autoCapitalize="characters"
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

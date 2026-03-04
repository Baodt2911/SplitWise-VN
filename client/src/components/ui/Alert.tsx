import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { useAlertStore } from "../../store/alertStore";
import { getThemeColors } from "../../utils/themeColors";
import { usePreferencesStore } from "../../store/preferencesStore";

export const Alert = () => {
  const { visible, title, message, buttons, hide } = useAlertStore();
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const handleDismiss = () => {
    hide();
  };

  const getAlertType = () => {
    if (title?.toLowerCase().includes("success")) return "success";
    if (title?.toLowerCase().includes("error")) return "error";
    if (title?.toLowerCase().includes("warning")) return "warning";
    return "info";
  };

  const alertType = getAlertType();
  const headerColor =
    alertType === "success"
      ? colors.success
      : alertType === "error"
        ? colors.danger
        : alertType === "warning"
          ? colors.warning
          : colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <Pressable
        className="flex-1 justify-center items-center p-5"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onPress={handleDismiss}
      >
        <Pressable
          className="rounded-3xl w-full max-w-sm overflow-hidden shadow-lg"
          style={{ backgroundColor: colors.surface }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Colored top bar */}
          <View
            className="h-1 w-full"
            style={{ backgroundColor: headerColor }}
          />

          <View className="p-6">
            {/* Title — wraps freely */}
            {title && (
              <Text
                className="text-xl mb-3 font-semibold"
                style={{ color: colors.textPrimary }}
              >
                {title}
              </Text>
            )}

            {/* Message — no numberOfLines, wraps naturally */}
            <Text
              className="text-base mb-6 leading-6 font-medium"
              style={{ color: colors.textSecondary }}
            >
              {message}
            </Text>

            {/* Buttons: horizontal side-by-side */}
            <View className="flex-row justify-end gap-3">
              {buttons?.map((button, index) => {
                const isDestructive = button.style === "destructive";
                const isCancel = button.style === "cancel";
                const isPrimary = !isDestructive && !isCancel;

                const buttonColor =
                  isPrimary && alertType === "success"
                    ? colors.success
                    : isPrimary
                      ? colors.primary
                      : undefined;

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      hide();
                      button.onPress?.();
                    }}
                    className="rounded-2xl py-3 px-5 items-center justify-center flex-1"
                    style={{
                      backgroundColor: isPrimary
                        ? buttonColor || colors.primary
                        : isCancel
                          ? "transparent"
                          : colors.danger,
                      borderWidth: isCancel ? 1 : 0,
                      borderColor: isCancel ? colors.border : undefined,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      className="text-base font-semibold text-center"
                      style={{
                        color: isPrimary
                          ? colors.primaryText
                          : isCancel
                            ? colors.textPrimary
                            : colors.primaryText,
                      }}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

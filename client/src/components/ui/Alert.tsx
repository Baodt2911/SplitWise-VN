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
    // Determine alert type based on title
    if (title?.toLowerCase().includes("thành công") || title?.toLowerCase().includes("success")) {
      return "success";
    }
    if (title?.toLowerCase().includes("lỗi") || title?.toLowerCase().includes("error")) {
      return "error";
    }
    if (title?.toLowerCase().includes("cảnh báo") || title?.toLowerCase().includes("warning")) {
      return "warning";
    }
    return "info";
  };

  const alertType = getAlertType();
  const headerColor = 
    alertType === "success" ? colors.success :
    alertType === "error" ? colors.danger :
    alertType === "warning" ? colors.warning :
    colors.primary;

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
          className="rounded-3xl w-full max-w-sm overflow-hidden"
          style={{
            backgroundColor: colors.surface,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header with colored bar */}
          <View
            className="h-1 w-full"
            style={{ backgroundColor: headerColor }}
          />

          <View className="p-6">
            {title && (
              <Text
                className="text-xl mb-3 font-semibold"
                style={{
                  color: colors.textPrimary,
                }}
                numberOfLines={2}
              >
                {title}
              </Text>
            )}
            <Text
              className="text-base mb-6 leading-6 font-medium"
              style={{
                color: colors.textSecondary,
              }}
              numberOfLines={10}
            >
              {message}
            </Text>
            <View className="flex-row justify-end gap-3">
              {buttons?.map((button, index) => {
                const isDestructive = button.style === "destructive";
                const isCancel = button.style === "cancel";
                const isPrimary = !isDestructive && !isCancel;
                
                // Use success color for primary button in success alert
                const buttonColor = isPrimary && alertType === "success" 
                  ? colors.success 
                  : isPrimary 
                    ? colors.primary 
                    : undefined;
                
                return (
                  <View key={index} className={buttons.length > 1 ? "flex-1" : ""} style={{ minWidth: buttons.length === 1 ? undefined : 100 }}>
                    <TouchableOpacity
                      onPress={() => {
                        // Always hide alert first
                        hide();
                        // Then execute button's onPress if provided
                        button.onPress?.();
                      }}
                      className={`rounded-2xl py-3 px-6 items-center justify-center ${buttons.length === 1 ? "w-full" : ""}`}
                      style={{
                        backgroundColor: isPrimary 
                          ? (buttonColor || colors.primary)
                          : isCancel 
                            ? "transparent"
                            : colors.danger,
                        borderWidth: isCancel ? 1 : 0,
                        borderColor: isCancel ? colors.border : undefined,
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        className="text-base font-semibold"
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
                  </View>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};


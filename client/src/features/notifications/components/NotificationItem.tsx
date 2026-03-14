import React from "react";
import { TouchableOpacity, View, Text, ActivityIndicator } from "react-native";
import { Icon } from "../../../components/common/Icon";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { getThemeColors } from "../../../utils/themeColors";
import {
  getNotificationStyle,
  formatNotificationTime,
} from "../../../utils/notificationUtils";
import type { Notification } from "../../../services/api/notification.api";

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
  onConfirm?: () => void;
  onReject?: () => void;
  isConfirmLoading?: boolean;
}

export const NotificationItemComponent: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onConfirm,
  onReject,
  isConfirmLoading,
}) => {
  const { theme } = usePreferencesStore();
  const colors = getThemeColors(theme);
  const isPaymentRequest = notification.type === "PAYMENT_REQUEST";

  // Priority: if metadata already has a conclusive status, show it.
  const status = notification.metadata?.status;
  const isProcessed = status && status !== "PENDING";

  const { icon, color } = getNotificationStyle(notification.type);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        padding: 16,
        backgroundColor: notification.isRead
          ? colors.background
          : colors.primary + "05",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row" }}>
        {/* Left Icon */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: color + "15",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon as any} size={24} color={color} />
        </View>

        {/* Content */}
        <View style={{ flex: 1, marginLeft: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: notification.isRead ? "500" : "700",
                color: colors.textPrimary,
                flex: 1,
              }}
            >
              {notification.title}
            </Text>
            {!notification.isRead && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.primary,
                  marginTop: 6,
                }}
              />
            )}
          </View>

          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginTop: 4,
              lineHeight: 20,
            }}
          >
            {notification.body}
          </Text>

          <Text
            style={{
              fontSize: 12,
              color: colors.textTertiary,
              marginTop: 8,
            }}
          >
            {formatNotificationTime(notification.createdAt)}
          </Text>

          {/* Action buttons or status label — only for relevant types */}
          {(isPaymentRequest ||
            notification.type === "MEMBER_INVITED" ||
            notification.type === "PAYMENT_CONFIRMED" ||
            notification.type === "PAYMENT_REJECTED") && (
            <View style={{ marginTop: 12 }}>
              {isProcessed ? (
                /* Status Label */
                <View style={{ gap: 6 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 6,
                      backgroundColor:
                        status === "CONFIRMED" || status === "ACCEPTED"
                          ? "#10B98115"
                          : "#EF444415",
                      alignSelf: "flex-start",
                    }}
                  >
                    <Icon
                      name={
                        status === "CONFIRMED" || status === "ACCEPTED"
                          ? "checkCircle"
                          : "alertCircle"
                      }
                      size={14}
                      color={
                        status === "CONFIRMED" || status === "ACCEPTED"
                          ? "#10B981"
                          : "#EF4444"
                      }
                    />
                    <Text
                      style={{
                        marginLeft: 6,
                        fontSize: 13,
                        fontWeight: "600",
                        color:
                          status === "CONFIRMED" || status === "ACCEPTED"
                            ? "#10B981"
                            : "#EF4444",
                      }}
                    >
                      {status === "CONFIRMED"
                        ? "Bạn đã xác nhận"
                        : status === "ACCEPTED"
                          ? "Bạn đã tham gia"
                          : status === "REJECTED"
                            ? "Đã từ chối"
                            : "Đã xử lý"}
                    </Text>
                  </View>

                  {/* Rejection Reason if available */}
                  {status === "REJECTED" &&
                    notification.metadata?.rejectionReason && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.danger,
                          fontStyle: "italic",
                          paddingLeft: 4,
                        }}
                      >
                        Lý do: {notification.metadata.rejectionReason}
                      </Text>
                    )}
                </View>
              ) : onConfirm && onReject ? (
                /* Action Buttons */
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  <TouchableOpacity
                    onPress={onConfirm}
                    disabled={isConfirmLoading}
                    style={{
                      flex: 1,
                      height: 36,
                      borderRadius: 8,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.primary,
                      opacity: isConfirmLoading ? 0.7 : 1,
                    }}
                    activeOpacity={0.8}
                  >
                    {isConfirmLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        {notification.type === "MEMBER_INVITED"
                          ? "Chấp nhận"
                          : "Xác nhận nhận tiền"}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={onReject}
                    disabled={isConfirmLoading}
                    style={{
                      flex: 1,
                      height: 36,
                      borderRadius: 8,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: colors.danger,
                      backgroundColor: "transparent",
                      opacity: isConfirmLoading ? 0.5 : 1,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{
                        color: colors.danger,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      {notification.type === "MEMBER_INVITED"
                        ? "Bỏ qua"
                        : "Từ chối"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const NotificationItem = React.memo(NotificationItemComponent);

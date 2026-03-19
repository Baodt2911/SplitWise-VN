import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useDynamicIslandStore,
  NotificationType,
} from "../../store/dynamicIslandStore";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

const { width } = Dimensions.get("window");
const ISLAND_WIDTH = 300;

const getNotificationConfig = (type: NotificationType) => {
  switch (type) {
    case "EXPENSE_ADDED":
      return { icon: "receipt", color: "#4CAF50" };
    case "EXPENSE_UPDATED":
      return { icon: "pencil", color: "#FF9800" };
    case "EXPENSE_DELETED":
      return { icon: "trash", color: "#F44336" };
    case "PAYMENT_REQUEST":
    case "PAYMENT_DISPUTED":
      return { icon: "cash-outline", color: "#2196F3" };
    case "PAYMENT_CONFIRMED":
      return { icon: "checkmark-circle", color: "#4CAF50" };
    case "PAYMENT_REJECTED":
      return { icon: "close-circle", color: "#F44336" };
    case "MEMBER_ADDED":
    case "MEMBER_JOINED":
    case "MEMBER_SELF_JOINED":
      return { icon: "person-add", color: "#9C27B0" };
    case "MEMBER_LEFT":
      return { icon: "person-remove", color: "#607D8B" };
    case "COMMENT_ADDED":
      return { icon: "chatbubble", color: "#00BCD4" };
    case "REMINDER":
      return { icon: "notifications", color: "#FFC107" };
    default:
      return { icon: "information-circle", color: "#9E9E9E" };
  }
};

const getNotificationMessage = (
  type: NotificationType,
  groupName?: string,
  backupBody?: string,
) => {
  const gName = groupName || "Nhóm";

  switch (type) {
    case "EXPENSE_ADDED":
      return `Nhóm "${gName}" có chi phí mới`;
    case "EXPENSE_UPDATED":
      return `Chi phí trong "${gName}" vừa được sửa`;
    case "EXPENSE_DELETED":
      return `Chi phí trong "${gName}" đã bị xóa`;
    case "PAYMENT_REQUEST":
      return `Bạn có yêu cầu thanh toán từ "${gName}"`;
    case "PAYMENT_CONFIRMED":
      return `Thanh toán trong "${gName}" đã được xác nhận`;
    case "PAYMENT_REJECTED":
      return `Thanh toán trong "${gName}" đã bị từ chối`;
    case "PAYMENT_DISPUTED":
      return `Có khiếu nại về thanh toán trong "${gName}"`;
    case "MEMBER_ADDED":
    case "MEMBER_JOINED":
    case "MEMBER_SELF_JOINED":
      return `Nhóm "${gName}" có thành viên mới`;
    case "MEMBER_LEFT":
      return `Thành viên đã rời khỏi nhóm "${gName}"`;
    default:
      return backupBody || "Bạn có cập nhật mới";
  }
};

export const DynamicIsland = () => {
  const { visible, data, hide } = useDynamicIslandStore();

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible && data) {
      translateY.value = withSpring(40, { damping: 20, stiffness: 90 });
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withSpring(1, { damping: 20, stiffness: 90 });

      const timeout = setTimeout(() => {
        handleHide();
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [visible, data]);

  const handleHide = () => {
    "worklet";
    translateY.value = withTiming(-100, { duration: 400 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(hide)();
    });
    scale.value = withTiming(0.9, { duration: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const onPress = () => {
    if (!data) return;

    if (data.relatedType === "EXPENSE" && data.relatedId) {
      router.push(`/expenses/${data.relatedId}`);
    } else if (data.relatedType === "SETTLEMENT") {
      router.push("/notifications");
    } else if (
      data.relatedType === "GROUP" ||
      (data.groupName && data.relatedId)
    ) {
      if (data.relatedId) {
        router.push(`/groups/${data.relatedId}`);
      }
    } else {
      router.push("/notifications");
    }

    handleHide();
  };

  if (!visible || !data) return null;

  const config = getNotificationConfig(data.type);
  const message = getNotificationMessage(data.type, data.groupName, data.body);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        style={styles.content}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
          <Ionicons name={config.icon as any} size={18} color="white" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: (width - ISLAND_WIDTH) / 2,
    width: ISLAND_WIDTH,
    backgroundColor: "#1C1C1E",
    borderRadius: 30,
    zIndex: 10000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
});

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Icon } from "../../../components/common/Icon";

interface DateRangePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (fromDate: Date | undefined, toDate: Date | undefined) => void;
  initialFromDate?: Date;
  initialToDate?: Date;
  colors: any;
}

export const DateRangePickerModal: React.FC<DateRangePickerModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFromDate,
  initialToDate,
  colors,
}) => {
  const [fromDate, setFromDate] = useState<Date | undefined>(initialFromDate);
  const [toDate, setToDate] = useState<Date | undefined>(initialToDate);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // Reset state when modal opens
  React.useEffect(() => {
    if (visible) {
      setFromDate(initialFromDate);
      setToDate(initialToDate);
    }
  }, [visible, initialFromDate, initialToDate]);

  const formatDate = useCallback((date: Date | undefined) => {
    if (!date) return "Chọn ngày";
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }, []);

  const handleFromChange = useCallback((_: any, selectedDate?: Date) => {
    setShowFromPicker(Platform.OS === "ios");
    if (selectedDate) {
      setFromDate(selectedDate);
    }
  }, []);

  const handleToChange = useCallback((_: any, selectedDate?: Date) => {
    setShowToPicker(Platform.OS === "ios");
    if (selectedDate) {
      setToDate(selectedDate);
    }
  }, []);

  const quickSelects = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    return [
      {
        label: "Hôm nay",
        from: startOfToday,
        to: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1),
      },
      {
        label: "Tuần này",
        from: (() => {
          const d = new Date(startOfToday);
          const day = d.getDay() || 7;
          d.setDate(d.getDate() - day + 1);
          return d;
        })(),
        to: startOfToday,
      },
      {
        label: "Tháng này",
        from: new Date(today.getFullYear(), today.getMonth(), 1),
        to: startOfToday,
      },
      {
        label: "30 ngày qua",
        from: new Date(startOfToday.getTime() - 29 * 24 * 60 * 60 * 1000),
        to: startOfToday,
      },
      {
        label: "Tháng trước",
        from: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        to: new Date(today.getFullYear(), today.getMonth(), 0),
      },
    ];
  }, []);

  const handleApply = useCallback(() => {
    onApply(fromDate, toDate);
    onClose();
  }, [fromDate, toDate, onApply, onClose]);

  const handleClear = useCallback(() => {
    setFromDate(undefined);
    setToDate(undefined);
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onPress={onClose}
      >
        <Pressable
          className="rounded-t-3xl px-4 pt-4 pb-8"
          style={{ backgroundColor: colors.card }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

          {/* Title */}
          <Text
            className="text-lg font-bold mb-4 text-center"
            style={{ color: colors.textPrimary }}
          >
            Chọn khoảng thời gian
          </Text>

          {/* Quick select buttons */}
          <View className="flex-row flex-wrap gap-2 mb-4">
            {quickSelects.map((item) => (
              <TouchableOpacity
                key={item.label}
                className="px-3 py-2 rounded-full"
                style={{
                  backgroundColor:
                    fromDate?.getTime() === item.from.getTime() &&
                    toDate?.getTime() === item.to.getTime()
                      ? colors.primaryLight
                      : colors.surface,
                }}
                onPress={() => {
                  setFromDate(item.from);
                  setToDate(item.to);
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{
                    color:
                      fromDate?.getTime() === item.from.getTime() &&
                      toDate?.getTime() === item.to.getTime()
                        ? colors.primary
                        : colors.textSecondary,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom date pickers */}
          <View className="mb-4">
            <Text
              className="text-sm font-medium mb-2"
              style={{ color: colors.textSecondary }}
            >
              Hoặc chọn tùy chỉnh
            </Text>
            <View className="flex-row gap-3">
              {/* From date */}
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-between p-3 rounded-xl"
                style={{ backgroundColor: colors.surface }}
                onPress={() => setShowFromPicker(true)}
              >
                <View className="flex-row items-center">
                  <Icon
                    name="calendar"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text className="ml-2" style={{ color: colors.textPrimary }}>
                    Từ: {formatDate(fromDate)}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* To date */}
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-between p-3 rounded-xl"
                style={{ backgroundColor: colors.surface }}
                onPress={() => setShowToPicker(true)}
              >
                <View className="flex-row items-center">
                  <Icon
                    name="calendar"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text className="ml-2" style={{ color: colors.textPrimary }}>
                    Đến: {formatDate(toDate)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date pickers (Android) */}
          {showFromPicker && (
            <DateTimePicker
              value={fromDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleFromChange}
              maximumDate={toDate || new Date()}
            />
          )}
          {showToPicker && (
            <DateTimePicker
              value={toDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleToChange}
              minimumDate={fromDate}
              maximumDate={new Date()}
            />
          )}

          {/* Action buttons */}
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              className="flex-1 py-3 rounded-xl items-center"
              style={{ backgroundColor: colors.surface }}
              onPress={handleClear}
            >
              <Text style={{ color: colors.textSecondary }}>Xóa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3 rounded-xl items-center"
              style={{ backgroundColor: colors.primary }}
              onPress={handleApply}
            >
              <Text className="font-bold" style={{ color: "#FFFFFF" }}>
                Áp dụng
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

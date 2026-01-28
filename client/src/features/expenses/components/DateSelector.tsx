import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable, Platform } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Icon } from "../../../components/common/Icon";

interface DateSelectorProps {
  date: Date;
  onDateChange: (date: Date) => void;
  colors: any;
  formatDate: (date: Date) => string;
}

export const DateSelector = ({
  date,
  onDateChange,
  colors,
  formatDate,
}: DateSelectorProps) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      onDateChange(selectedDate);
    }
  };

  return (
    <View className="mb-5">
      <Text
        className="text-base mb-3 font-semibold"
        style={{
          color: colors.textPrimary,
        }}
      >
        Ngày
      </Text>
      
      <TouchableOpacity
        className="rounded-xl border px-4 py-3 flex-row items-center justify-between"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
        }}
        onPress={() => setShowDatePicker(true)}
      >
        <Text
          className="font-medium"
          style={{
            fontSize: 16,
            color: colors.textPrimary,
          }}
        >
          {date ? formatDate(date) : ""}
        </Text>
        <Icon name="calendar" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Date Picker */}
      {showDatePicker && (
        Platform.OS === 'android' ? (
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        ) : (
          <Modal
            visible={showDatePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <Pressable 
              className="flex-1 justify-center items-center" 
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              onPress={() => setShowDatePicker(false)}
            >
              <Pressable
                className="rounded-3xl p-6 w-11/12"
                style={{ backgroundColor: colors.background }}
                onPress={(e: any) => e.stopPropagation()}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <Text
                    className="text-lg font-semibold"
                    style={{
                      color: colors.textPrimary,
                    }}
                  >
                    Chọn ngày
                  </Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Icon name="x" size={24} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
                
                <DateTimePicker
                  value={date || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  textColor={colors.textPrimary}
                  style={{ width: '100%' }}
                />

                <TouchableOpacity
                  className="mt-4 py-3 rounded-xl items-center"
                  style={{ backgroundColor: colors.primary }}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text className="font-semibold" style={{ color: '#FFFFFF', fontSize: 16 }}>
                    Xác nhận
                  </Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>
        )
      )}
    </View>
  );
};

import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Icon } from "../../../components/common/Icon";

interface ReceiptPickerProps {
  imageUri: string | null;
  onPickImage: () => void;
  onRemoveImage: () => void;
  colors: any;
}

export const ReceiptPicker = ({
  imageUri,
  onPickImage,
  onRemoveImage,
  colors,
}: ReceiptPickerProps) => {
  return (
    <View className="mb-5">
      <Text
        className="text-base mb-3 font-semibold"
        style={{
          color: colors.textPrimary,
        }}
      >
        Thêm ảnh hóa đơn
      </Text>
      {imageUri ? (
        <View className="relative">
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: 200, borderRadius: 12 }}
            resizeMode="cover"
          />
          <TouchableOpacity
            className="absolute top-2 right-2 w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onPress={onRemoveImage}
          >
            <Icon name="x" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          className="border-2 border-dashed rounded-2xl p-12 items-center justify-center"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
          onPress={onPickImage}
          activeOpacity={0.7}
        >
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-3"
            style={{
              backgroundColor: colors.primary + "20",
            }}
          >
            <Icon name="receipt" size={32} color={colors.primary} />
          </View>
          <Text
            className="text-center font-medium"
            style={{
              fontSize: 15,
              color: colors.textPrimary,
              marginBottom: 4,
            }}
          >
            Thêm ảnh hóa đơn
          </Text>
          <Text
            className="text-center font-normal"
            style={{
              fontSize: 13,
              color: colors.textTertiary,
            }}
          >
            Chạm để chọn ảnh
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

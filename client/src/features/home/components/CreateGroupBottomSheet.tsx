import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { Text, View, TouchableOpacity, Image, ScrollView, Switch, ActivityIndicator } from "react-native";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { TextInput } from "../../auth/components/TextInput";
import { Icon } from "../../../components/common/Icon";
import { createGroupSchema, type CreateGroupFormData } from "../schemas/group.schema";
import { createGroup, type ApiError } from "../../../services/api/group.api";
import { useToast } from "../../../hooks/useToast";

interface CreateGroupBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup?: (data: CreateGroupFormData) => void | Promise<void>;
  onSuccess?: () => void;
}

export const CreateGroupBottomSheet = ({
  isOpen,
  onClose,
  onCreateGroup,
  onSuccess,
}: CreateGroupBottomSheetProps) => {
  const theme = usePreferencesStore((state) => state.theme);
  const language = usePreferencesStore((state) => state.language);
  const colors = getThemeColors(theme);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const snapPoints = useMemo(() => ["75%", "90%"], []);

  const gradientColors: [string, string] = [colors.primary, colors.primaryDark];

  const methods = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema(language)),
    defaultValues: {
      name: "",
      description: "",
      avatarUrl: undefined,
      isPublic: false,
    },
    mode: "onBlur",
  });

  const { handleSubmit, watch, setValue, setError, reset: resetForm, formState: { isSubmitting } } = methods;
  const isPublic = watch("isPublic");

  // Reset form when sheet closes
  useEffect(() => {
    if (!isOpen) {
      methods.reset();
      setImageUri(null);
    }
  }, [isOpen, methods]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  // Open/close sheet based on isOpen prop
  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        enableTouchThrough={false}
      />
    ),
    []
  );

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      setValue("avatarUrl", uri);
    }
  };


  const onSubmit = async (data: CreateGroupFormData) => {
    try {
      // Call custom handler if provided
      if (onCreateGroup) {
        await onCreateGroup(data);
        return;
      }

      // Default: Call API
      const result = await createGroup({
        name: data.name,
        description: data.description || undefined,
        avatarUrl: data.avatarUrl || undefined,
        isPublic: data.isPublic ?? false,
      });

      // Check if result is an error
      if ("field" in result) {
        const apiError = result as ApiError;
        showError(
          apiError.message,
          language === "vi" ? "Lỗi" : "Error"
        );
        
        // Set error to form field if field is specified
        if (apiError.field) {
          setError(apiError.field as keyof CreateGroupFormData, {
            type: "server",
            message: apiError.message,
          });
        }
        return;
      }

      // Success
      success(
        language === "vi" ? "Tạo nhóm thành công!" : "Group created successfully!",
        language === "vi" ? "Thành công" : "Success"
      );
      
      // Reset form and close
      resetForm();
      setImageUri(null);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      // Network error or other unexpected errors
      const errorMessage = err.message || (language === "vi" ? "Không thể kết nối đến server" : "Cannot connect to server");
      showError(errorMessage, language === "vi" ? "Lỗi" : "Error");
    }
  };

  const translations = {
    vi: {
      title: "Tạo nhóm mới",
      groupName: "Tên nhóm",
      groupNamePlaceholder: "Nhập tên nhóm",
      description: "Mô tả",
      descriptionPlaceholder: "Nhập mô tả (tùy chọn)",
      avatar: "Ảnh đại diện",
      avatarHint: "Chọn ảnh đại diện cho nhóm",
      isPublic: "Công khai",
      isPublicHint: "Cho phép mọi người tìm thấy nhóm này",
      createButton: "Tạo nhóm",
      cancel: "Hủy",
      selectImage: "Chọn ảnh",
      removeImage: "Xóa ảnh",
    },
    en: {
      title: "Create new group",
      groupName: "Group name",
      groupNamePlaceholder: "Enter group name",
      description: "Description",
      descriptionPlaceholder: "Enter description (optional)",
      avatar: "Avatar",
      avatarHint: "Select avatar for the group",
      isPublic: "Public",
      isPublicHint: "Allow others to find this group",
      createButton: "Create group",
      cancel: "Cancel",
      selectImage: "Select image",
      removeImage: "Remove image",
    },
  };

  const t = translations[language];

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
      animateOnMount={true}
      enableDynamicSizing={false}
      enableOverDrag={false}
      android_keyboardInputMode="adjustResize"
    >
      <FormProvider {...methods}>
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View className="mb-6">
            <Text
              className="text-2xl font-extrabold"
              style={{
                color: colors.textPrimary,
              }}
            >
              {t.title}
            </Text>
          </View>

          {/* Avatar Section */}
          <View className="mb-6 items-center">
            <Text
              className="text-sm mb-3 font-semibold"
              style={{
                color: colors.textPrimary,
              }}
            >
              {t.avatar}
            </Text>
            {imageUri ? (
                <View
                  className="w-20 h-20 rounded-full overflow-hidden"
                  style={{
                    backgroundColor: colors.background,
                  }}
                >
                  <TouchableOpacity onPress={pickImage}>
                  <Image
                    source={{ uri: imageUri }}
                    className="w-full h-full rounded-full"
                    resizeMode="cover"
                  />
                  </TouchableOpacity>
                </View>
            ) : (
              <TouchableOpacity
                onPress={pickImage}
                className="w-20 h-20 rounded-full items-center justify-center border-2 border-dashed"
              >
                <Icon name="plus" size={32} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            <Text
              className="text-xs mt-2 text-center"
              style={{
                color: colors.textTertiary,
              }}
            >
              {t.avatarHint}
            </Text>
          </View>

          {/* Form Fields */}
          <TextInput
            name="name"
            label={t.groupName}
            placeholder={t.groupNamePlaceholder}
            autoCapitalize="words"
          />

          <TextInput
            name="description"
            label={t.description}
            placeholder={t.descriptionPlaceholder}
            autoCapitalize="sentences"
          />

          {/* Public Toggle */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1 mr-4">
                <Text
                  className="text-sm mb-1"
                  style={{
                    color: colors.textPrimary,
                  }}
                >
                  {t.isPublic}
                </Text>
                <Text
                  className="text-xs"
                  style={{
                    color: colors.textTertiary,
                  }}
                >
                  {t.isPublicHint}
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={(value) => setValue("isPublic", value)}
                trackColor={{
                  false: colors.border,
                  true: colors.primaryLight,
                }}
                thumbColor={isPublic ? colors.primary : colors.textSecondary}
              />
            </View>
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3 mt-4 mb-6">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 rounded-2xl py-4 items-center justify-center"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              disabled={isSubmitting}
            >
              <Text
                className="text-base font-semibold"
                style={{
                  color: colors.textPrimary,
                }}
              >
                {t.cancel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              className="flex-1"
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 items-center justify-center"
                style={{
                  borderRadius: 16,
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.primaryText} />
                ) : (
                  <Text
                    className="text-base font-semibold"
                    style={{
                      color: colors.primaryText,
                    }}
                  >
                    {t.createButton}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </FormProvider>
    </BottomSheet>
  );
};


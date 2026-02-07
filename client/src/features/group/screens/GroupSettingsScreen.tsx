import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View, Image, Switch, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Pressable } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useAuthStore } from "../../../store/authStore";
import { Icon } from "../../../components/common/Icon";
import { getGroupDetail, updateGroup, leaveGroup, deleteGroup, addMember, removeMember, type GroupDetail } from "../../../services/api/group.api";
import { useToast } from "../../../hooks/useToast";
import { useAlert } from "../../../hooks/useAlert";
import { useGroupStore } from "../../../store/groupStore";
import * as Clipboard from "expo-clipboard";
import { uploadImage, deleteImage } from "../../../services/api/upload.api";

export const GroupSettingsScreen = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  const currentUser = useAuthStore((state) => state.user);
  const { error: showError, success: showSuccess } = useToast();
  const { alert } = useAlert();
  const getGroupDetailFromStore = useGroupStore((state) => state.getGroupDetail);
  const setGroupDetail = useGroupStore((state) => state.setGroupDetail);
  const groupFromStore = useGroupStore((state) => params.id ? state.groupDetails[params.id] : undefined);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [allowMemberEdit, setAllowMemberEdit] = useState(false);
  const [requirePaymentConfirmation, setRequirePaymentConfirmation] = useState(false);
  const [autoReminderEnabled, setAutoReminderEnabled] = useState(false);
  
  // New settings
  const [allowMemberDirectAdd, setAllowMemberDirectAdd] = useState(false);
  const [reminderDays, setReminderDays] = useState(3);
  const [tempReminderDays, setTempReminderDays] = useState("3");

  // Edit states
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoState, setInfoState] = useState({ name: "", description: "", avatarUrl: "" });

  // Add member states
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [inputType, setInputType] = useState<'email' | 'phone'>('email');
  const [inputValue, setInputValue] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const addMemberSheetRef = useRef<BottomSheet>(null);

  // Use refs to avoid dependency issues
  const showErrorRef = useRef(showError);
  const showSuccessRef = useRef(showSuccess);
  
  useEffect(() => {
    showErrorRef.current = showError;
    showSuccessRef.current = showSuccess;
  }, [showError, showSuccess]);

  // Load group detail - check store first, only call API if forceRefresh or not in store
  const loadGroupDetail = useCallback(async (forceRefresh = false) => {
    if (!params.id) {
      showErrorRef.current("Không tìm thấy ID nhóm", "Lỗi");
      router.back();
      return;
    }

    // Check store first if not forcing refresh
    if (!forceRefresh) {
      const storedGroup = getGroupDetailFromStore(params.id);
      if (storedGroup) {
        // Use data from store, no API call needed
        const safeStored = {
          ...storedGroup,
          members: Array.isArray(storedGroup.members) ? storedGroup.members : [],
        };
        setGroup(safeStored);
        setIsPublic(safeStored.isPublic);
        setAllowMemberEdit(safeStored.allowMemberEdit);
        setRequirePaymentConfirmation(safeStored.requirePaymentConfirmation);
        setAutoReminderEnabled(safeStored.autoReminderEnabled);
        setIsLoading(false);
        return; // Exit early, no API call
      }
    }

    // Not in store or force refresh, load from API
    try {
      setIsLoading(true);
      const response = await getGroupDetail(params.id);
      const safeGroup = {
        ...response.group,
        members: Array.isArray(response.group.members) ? response.group.members : [],
      };
      setGroup(safeGroup);
      setIsPublic(safeGroup.isPublic);
      setAllowMemberEdit(response.group.allowMemberEdit);
      setRequirePaymentConfirmation(response.group.requirePaymentConfirmation);
      setAutoReminderEnabled(response.group.autoReminderEnabled);
      setAllowMemberDirectAdd(response.group.allowMemberDirectAdd);
      setReminderDays(response.group.reminderDays);
      setTempReminderDays(String(response.group.reminderDays));
      // Save to store
      setGroupDetail(params.id, safeGroup);
    } catch (err: any) {
      const errorMessage = err.message || "Không thể tải thông tin nhóm";
      showErrorRef.current(errorMessage, "Lỗi");
    } finally {
      setIsLoading(false);
    }
  }, [params.id, setGroupDetail, getGroupDetailFromStore]);

  // Initial load - check store first, only call API if not in store
  useEffect(() => {
    if (params.id) {
      const storedGroup = getGroupDetailFromStore(params.id);
      if (storedGroup) {
        // Use data from store, no API call needed
        const safeStored = {
          ...storedGroup,
          members: Array.isArray(storedGroup.members) ? storedGroup.members : [],
        };
        setGroup(safeStored);
        setIsPublic(safeStored.isPublic);
        setAllowMemberEdit(safeStored.allowMemberEdit);
        setRequirePaymentConfirmation(safeStored.requirePaymentConfirmation);
        setAutoReminderEnabled(safeStored.autoReminderEnabled);
        setAllowMemberDirectAdd(safeStored.allowMemberDirectAdd);
        setReminderDays(safeStored.reminderDays);
        setTempReminderDays(String(safeStored.reminderDays));
        setIsLoading(false);
      } else {
        // Not in store, load from API
        loadGroupDetail();
      }
    }
  }, [params.id, getGroupDetailFromStore, loadGroupDetail]);

  // Update when store changes
  useEffect(() => {
    if (groupFromStore) {
      const safeStored = {
        ...groupFromStore,
        members: Array.isArray(groupFromStore.members) ? groupFromStore.members : [],
      };
      setGroup(safeStored);
      setIsPublic(safeStored.isPublic);
      setAllowMemberEdit(groupFromStore.allowMemberEdit);
      setRequirePaymentConfirmation(groupFromStore.requirePaymentConfirmation);
      setAutoReminderEnabled(groupFromStore.autoReminderEnabled);
      setAllowMemberDirectAdd(groupFromStore.allowMemberDirectAdd);
      setReminderDays(groupFromStore.reminderDays);
      setTempReminderDays(String(groupFromStore.reminderDays));
    }
  }, [groupFromStore]);

  // Get member initials - only first letter
  // Get member initials - first letter of last word
  const getMemberInitials = useCallback((name: string) => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) return "?";
    const words = trimmedName.split(/\s+/).filter(word => word.length > 0);
    if (words.length === 0) return "?";
    // Get first letter of last word
    const lastWord = words[words.length - 1];
    return lastWord[0].toUpperCase();
  }, []);

  // Get member avatar color
  const getMemberAvatarColor = useCallback((id: string) => {
    const colors = [
      "#E1BEE7", "#C8E6C9", "#BBDEFB", "#FFE0B2",
      "#F8BBD0", "#B2DFDB", "#D1C4E9", "#FFCCBC",
    ];
    const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, []);

  // Get member text color
  const getMemberTextColor = useCallback((id: string) => {
    const colors = [
      "#7B1FA2", "#388E3C", "#1976D2", "#F57C00",
      "#C2185B", "#00796B", "#512DA8", "#E64A19",
    ];
    const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, []);


  // Pick image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setInfoState(prev => ({ ...prev, avatarUrl: result.assets[0].uri }));
    }
  };

  const startEditing = () => {
    if (!group) return;
    setInfoState({
       name: group.name,
       description: group.description || "",
       avatarUrl: group.avatarUrl || ""
    });
    setIsEditingInfo(true);
  };

  const saveGroupInfo = async () => {
     if (!group) return;
     if (!infoState.name.trim()) {
        showErrorRef.current("Tên nhóm không được để trống", "Lỗi");
        return;
     }
     
     try {
       let oldPublicId: string | null = null;
       let newAvatarUrl: string | undefined = undefined;
       
       // 1. Upload avatar if it's a local file
       if (infoState.avatarUrl && infoState.avatarUrl !== (group.avatarUrl || "") && infoState.avatarUrl.startsWith('file://')) {
         console.log("=== Starting avatar upload ===");
         console.log("Image URI:", infoState.avatarUrl);
         console.log("Group ID:", group.id);
         
         const uploadResult = await uploadImage(
           { 
             uri: infoState.avatarUrl,
             name: `group_${group.id}_avatar.jpg`,
             type: 'image/jpeg'
           },
           group.id,
           'avatar'
         );
         
         console.log("=== Upload result ===");
         console.log("Full result:", JSON.stringify(uploadResult, null, 2));
         console.log("Has secure_url?", !!uploadResult?.secure_url);
         
         if (uploadResult?.secure_url) {
           newAvatarUrl = uploadResult.secure_url;
           console.log("Upload successful! URL:", newAvatarUrl);
           
           // Extract new public_id for comparison
           const newPublicId = uploadResult.public_id;
           console.log("New public_id:", newPublicId);
           
           // Extract old public_id for cleanup
           if (group.avatarUrl && group.avatarUrl.includes('cloudinary.com')) {
             const urlParts = group.avatarUrl.split('/');
             const fileWithExt = urlParts[urlParts.length - 1];
             const publicIdParts = urlParts.slice(urlParts.indexOf('upload') + 2, -1);
             const fileName = fileWithExt.split('.')[0];
             const extractedOldId = [...publicIdParts, fileName].join('/');
             
             console.log("Old public_id (extracted):", extractedOldId);
             
             // Only delete if old and new are different
             // If they're the same, Cloudinary already overwrote it
             if (extractedOldId !== newPublicId) {
               oldPublicId = extractedOldId;
               console.log("Will delete old image after update");
             } else {
               console.log("Old and new public_id are the same - no need to delete");
             }
           }
         } else {
           // Upload failed - don't continue
           console.error("Upload failed - no secure_url in result");
           throw new Error("Upload không trả về URL");
         }
       }
       
       // 2. Build changes object
       const changes: any = {};
       if (infoState.name !== group.name) changes.name = infoState.name;
       if (infoState.description !== (group.description || "")) changes.description = infoState.description;
       
       // Only update avatarUrl if we have a cloud URL
       if (newAvatarUrl) {
         changes.avatarUrl = newAvatarUrl;
       } else if (infoState.avatarUrl !== (group.avatarUrl || "") && !infoState.avatarUrl.startsWith('file://')) {
         // Allow updating with HTTP URLs, but never local file paths
         changes.avatarUrl = infoState.avatarUrl;
       }

       // 3. Update group
       if (Object.keys(changes).length > 0) {
         console.log("=== Updating group with changes ===");
         console.log("Changes:", JSON.stringify(changes, null, 2));
         
         const result = await updateGroup(group.id, changes);
         
         console.log("=== Update result ===");
         console.log("Result:", JSON.stringify(result, null, 2));
         
         if ("data" in result) {
           const mergedGroup = { 
             ...group, 
             ...result.data, 
             members: group.members
           };
           console.log("Update successful! Setting group detail...");
           setGroupDetail(group.id, mergedGroup);
           
           // 4. Delete old image after successful update
           if (oldPublicId) {
             console.log("Deleting old image, public_id:", oldPublicId);
             try {
               await deleteImage(oldPublicId, group.id, 'avatar');
               console.log("Old image deleted successfully");
             } catch (deleteError) {
               console.error("Failed to delete old avatar:", deleteError);
             }
           }
         } else if ("message" in result) {
           console.error("Update failed:", result.message);
           showErrorRef.current(result.message, "Lỗi");
           return;
         }
       } else {
         console.log("No changes to update");
       }
       
       setIsEditingInfo(false);
     } catch (err: any) {
       console.error("Save group info error:", err);
       showErrorRef.current(err.message || "Lỗi", "Lỗi");
     }
  };

  // Handle update settings
  const handleUpdateSettings = async (field: string, value: any) => {
    if (!group) return;

    try {
      const result = await updateGroup(group.id, { [field]: value });
      // Check if result has data (success)
      if ("data" in result) {
        // Update store with merged data (preserve members/expenses as API might not return them)
        const mergedGroup = {
           ...group,
           ...result.data,
           members: group.members // Explicitly preserve members
        };
        setGroupDetail(group.id, mergedGroup);
      } else if ("message" in result) {
         // Error case
         showErrorRef.current(result.message, "Lỗi");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Không thể cập nhật nhóm";
      showErrorRef.current(errorMessage, "Lỗi");
    }
  };

  // Copy invite link
  const handleCopyLink = useCallback(async () => {
    if (!group) return;
    const inviteLink = `splitwise.vn/join/${group.inviteCode}`;
    await Clipboard.setStringAsync(inviteLink);
    showSuccessRef.current(
      "Đã sao chép link",
      "Thành công"
    );
  }, [group]);

  // Get current user role
  const getCurrentUserRole = () => {
    if (!group || !currentUser) return null;
    const member = group.members.find((m) => m.userId === currentUser.id);
    return member?.role || "MEMBER";
  };

  const isAdmin = getCurrentUserRole() === "ADMIN";

  // Handle Leave Group
  const handleLeaveGroup = async () => {
    if (!group) return;

    alert(
      "Rời nhóm",
      "Bạn có chắc chắn muốn rời khỏi nhóm này không? Các khoản nợ/thu chưa thanh toán sẽ cần được xử lý.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Rời nhóm",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              const result = await leaveGroup(group.id);
              if ("message" in result && !("field" in result)) {
                 showSuccessRef.current("Đã rời nhóm thành công", "Thành công");
                 useGroupStore.getState().removeGroup(group.id);
                 router.replace("/(tabs)/home");
              } else {
                 throw new Error((result as any).message || "Không thể rời nhóm");
              }
            } catch (err: any) {
              showErrorRef.current(err.message || "Không thể rời nhóm", "Lỗi");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle Delete Group
  const handleDeleteGroup = async () => {
    if (!group) return;

    alert(
      "Xóa nhóm",
      "Hành động này không thể hoàn tác. Tất cả dữ liệu của nhóm sẽ bị xóa vĩnh viễn.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa vĩnh viễn",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              const result = await deleteGroup(group.id);
              if ("message" in result && !("field" in result)) {
                 showSuccessRef.current("Đã xóa nhóm thành công", "Thành công");
                 useGroupStore.getState().removeGroup(group.id);
                 router.replace("/(tabs)/home");
              } else {
                 throw new Error((result as any).message || "Không thể xóa nhóm");
              }
            } catch (err: any) {
              showErrorRef.current(err.message || "Không thể xóa nhóm", "Lỗi");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };


  // Validate email format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone format (Vietnamese phone numbers)
  const isValidPhone = (phone: string) => {
    const phoneRegex = /^(0|\+84)(\d{9,10})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // Handle add member
  const handleAddMember = async () => {
    if (!group || !inputValue.trim()) {
      showErrorRef.current("Vui lòng nhập thông tin", "Lỗi");
      return;
    }

    // Validate input based on type
    if (inputType === 'email' && !isValidEmail(inputValue)) {
      showErrorRef.current("Email không hợp lệ", "Lỗi");
      return;
    }

    if (inputType === 'phone' && !isValidPhone(inputValue)) {
      showErrorRef.current("Số điện thoại không hợp lệ", "Lỗi");
      return;
    }

    try {
      setIsAddingMember(true);
      const data = inputType === 'email' ? { email: inputValue } : { phone: inputValue };
      const result = await addMember(group.id, data);

      if ("message" in result && !("field" in result)) {
        showSuccessRef.current("Đã thêm thành viên thành công", "Thành công");
        setInputValue("");
        setShowAddMemberModal(false);
        addMemberSheetRef.current?.close();
        // Refresh group details
        await loadGroupDetail(true);
      } else {
        throw new Error((result as any).message || "Không thể thêm thành viên");
      }
    } catch (err: any) {
      showErrorRef.current(err.message || "Không thể thêm thành viên", "Lỗi");
    } finally {
      setIsAddingMember(false);
    }
  };

  // Handle remove member
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!group) return;

    alert(
      "Xóa thành viên",
      `Bạn có chắc chắn muốn xóa ${memberName} khỏi nhóm không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              const result = await removeMember(group.id, memberId);
              if ("message" in result && !("field" in result)) {
                showSuccessRef.current("Đã xóa thành viên thành công", "Thành công");
                // Refresh group details
                await loadGroupDetail(true);
              } else {
                throw new Error((result as any).message || "Không thể xóa thành viên");
              }
            } catch (err: any) {
              showErrorRef.current(err.message || "Không thể xóa thành viên", "Lỗi");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Open add member modal
  const openAddMemberModal = () => {
    setInputValue("");
    setInputType('email');
    setShowAddMemberModal(true);
    addMemberSheetRef.current?.expand();
  };

  // Close add member modal
  const closeAddMemberModal = () => {
    setShowAddMemberModal(false);
    setInputValue("");
    addMemberSheetRef.current?.close();
  };

  const addMemberSnapPoints = useMemo(() => ["45%"], []);

  const renderAddMemberBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );


  if (isLoading || !group) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        className="border-b"
        style={{
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }}
      >
        <View className="flex-row items-center justify-between px-4 py-4">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Icon name="arrowLeft" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View className="flex-1 items-center px-4">
            <Text
              className="text-lg"
              style={{
                color: colors.textPrimary,
              }}
            >
              Cài đặt nhóm
            </Text>
          </View>

          <View style={{ width: 24 }} />
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Information Section */}
        <View
          className="rounded-2xl mx-4 mt-4 p-6 relative"
          style={{ backgroundColor: colors.surface }}
        >
          {/* Edit Actions - Absolute Top Right */}
          {isAdmin && (
             <View className="absolute top-4 right-4 z-10">
                {!isEditingInfo ? (
                   <TouchableOpacity onPress={startEditing} className="p-2">
                      <Icon name="edit" size={20} color={colors.primary} />
                   </TouchableOpacity>
                ) : (
                   <View className="flex-row gap-2">
                       <TouchableOpacity onPress={saveGroupInfo} className="p-2 bg-primary rounded-full" style={{ backgroundColor: colors.primary }}>
                          <Icon name="check" size={16} color="#FFF" />
                       </TouchableOpacity>
                       <TouchableOpacity onPress={() => setIsEditingInfo(false)} className="p-2 bg-gray-200 rounded-full" style={{ backgroundColor: colors.textSecondary }}>
                          <Icon name="x" size={16} color="#FFF" />
                       </TouchableOpacity>
                   </View>
                )}
             </View>
          )}

          <View className="items-center mb-4">
            <View className="relative">
              {/* Show Avatar - Use infoState avatarUrl if isEditingInfo, else group.avatarUrl */}
              {(isEditingInfo ? infoState.avatarUrl : group.avatarUrl) ? (
                <Image
                  source={{ uri: (isEditingInfo ? infoState.avatarUrl : group.avatarUrl) || undefined }}
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  className="w-24 h-24 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primaryLight }}
                >
                  <Text
                    className="text-3xl"
                    style={{
                      color: colors.primary,
                    }}
                  >
                    {getMemberInitials(group.name)}
                  </Text>
                </View>
              )}
              
              {/* Camera Icon Overlay in Edit Mode */}
              {isEditingInfo && (
                <TouchableOpacity
                  onPress={pickImage}
                  className="absolute inset-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                >
                  <Icon name="camera" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {isEditingInfo ? (
             <View className="w-full">
                 <Text className="text-xs mb-1 text-center" style={{ color: colors.textSecondary }}>Tên nhóm</Text>
                 <TextInput
                   value={infoState.name}
                   onChangeText={(text) => setInfoState(prev => ({...prev, name: text}))}
                   className="text-xl text-center font-bold px-4 py-2 rounded-lg border mb-4"
                   style={{ 
                      color: colors.textPrimary,
                      borderColor: colors.primary,
                      backgroundColor: colors.background
                   }}
                 />
                 
                 <Text className="text-xs mb-1 text-center" style={{ color: colors.textSecondary }}>Mô tả</Text>
                 <TextInput
                   value={infoState.description}
                   onChangeText={(text) => setInfoState(prev => ({...prev, description: text}))}
                   className="text-sm text-center font-normal px-4 py-2 rounded-lg border"
                   style={{ 
                      color: colors.textPrimary,
                      borderColor: colors.primary,
                      backgroundColor: colors.background
                   }}
                   multiline
                   numberOfLines={3}
                 />
             </View>
          ) : (
             <View className="items-center">
                <Text
                    className="text-xl text-center mb-2 font-bold"
                    style={{
                    color: colors.textPrimary,
                    }}
                >
                    {group.name}
                </Text>

                {group.description ? (
                    <Text
                    className="text-sm text-center font-normal"
                    style={{
                        color: colors.textSecondary,
                    }}
                    >
                    {group.description}
                    </Text>
                ) : (
                    <Text
                        className="text-sm text-center font-italic"
                        style={{
                        color: colors.textSecondary,
                        fontStyle: 'italic'
                        }}
                    >
                        Chưa có mô tả
                    </Text>
                )}
             </View>
          )}
        </View>

        {/* Members Section */}
        <View
          className="rounded-2xl mx-4 mt-4 p-4"
          style={{ backgroundColor: colors.surface }}
        >
          <View className="flex-row items-center mb-4">
            <Icon name="users" size={20} color={colors.textPrimary} />
            <Text
              className="text-base ml-2"
              style={{
                color: colors.textPrimary,
              }}
            >
              Thành viên ({group.members.length})
            </Text>
          </View>

          {group.members.map((member) => {
            const initials = getMemberInitials(member.fullName);
            const avatarColor = getMemberAvatarColor(member.id);
            const textColor = getMemberTextColor(member.id);
            const isCurrentUser = currentUser && member.userId === currentUser.id;

            return (
              <View
                key={member.id}
                className="flex-row items-center justify-between py-3"
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View className="flex-row items-center flex-1">
                  {member.avatarUrl ? (
                    <Image
                      source={{ uri: member.avatarUrl }}
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{ backgroundColor: avatarColor }}
                    >
                      <Text
                        className="text-base font-bold"
                        style={{
                          color: textColor,
                        }}
                      >
                        {initials}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1 ml-3">
                    <Text
                      className="text-base font-bold"
                      style={{
                        color: colors.textPrimary,
                      }}
                    >
                      {isCurrentUser ? "Bạn" : member.fullName}
                    </Text>
                    <Text
                      className="text-sm font-normal"
                      style={{
                        color: member.role === "ADMIN" ? colors.primary : colors.textSecondary,
                      }}
                    >
                      {member.role === "ADMIN" ? "Admin" : "Thành viên"}
                    </Text>
                  </View>
                </View>

                {!isCurrentUser && isAdmin && (
                  <TouchableOpacity 
                    activeOpacity={0.7}
                    onPress={() => handleRemoveMember(member.id, member.fullName)}
                  >
                    <Icon name="trash" size={20} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {isAdmin && (
            <TouchableOpacity
              className="flex-row items-center justify-center py-3 mt-2 rounded-xl"
              style={{ backgroundColor: colors.primary }}
              activeOpacity={0.8}
              onPress={openAddMemberModal}
            >
              <Icon name="userPlus" size={20} color="#FFFFFF" />
              <Text
                className="text-base ml-2"
                style={{
                  color: "#FFFFFF",
                }}
              >
                Thêm thành viên
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Privacy Settings Section - Admin Only */}
        {isAdmin && (
          <View
            className="rounded-2xl mx-4 mt-4 p-4"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row items-center mb-4">
              <Icon name="lock" size={20} color={colors.textPrimary} />
              <Text
                className="text-base ml-2"
                style={{
                  color: colors.textPrimary,
                }}
              >
                Quyền riêng tư
              </Text>
            </View>

            <TouchableOpacity
              className="flex-row items-center justify-between py-3"
              activeOpacity={0.7}
              onPress={() => handleUpdateSettings("isPublic", true)}
            >
            <View className="flex-1">
              <Text
                className="text-base"
                style={{
                  color: colors.textPrimary,
                }}
              >
                Công khai
              </Text>
              <Text
                className="text-sm mt-1"
                style={{
                  color: colors.textSecondary,
                }}
              >
                Bất kỳ ai có link đều có thể tham gia
              </Text>
            </View>
            <View
              className="w-5 h-5 rounded-full items-center justify-center"
              style={{
                borderWidth: 2,
                borderColor: isPublic ? colors.primary : colors.border,
                backgroundColor: isPublic ? colors.primary : "transparent",
              }}
            >
              {isPublic && (
                <View
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: "#FFFFFF" }}
                />
              )}
            </View>
          </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between py-3"
              activeOpacity={0.7}
              onPress={() => handleUpdateSettings("isPublic", false)}
            >
            <View className="flex-1">
              <Text
                className="text-base"
                style={{
                  color: colors.textPrimary,
                }}
              >
                Riêng tư
              </Text>
              <Text
                className="text-sm mt-1"
                style={{
                  color: colors.textSecondary,
                }}
              >
                Chỉ admin mới có thể mời thành viên
              </Text>
            </View>
            <View
              className="w-5 h-5 rounded-full items-center justify-center"
              style={{
                borderWidth: 2,
                borderColor: !isPublic ? colors.primary : colors.border,
                backgroundColor: !isPublic ? colors.primary : "transparent",
              }}
            >
              {!isPublic && (
                <View
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: "#FFFFFF" }}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
        )}

        {/* New Link Section */}
        <View
          className="rounded-2xl mx-4 mt-4 p-4"
          style={{ backgroundColor: colors.surface }}
        >
          <View className="flex-row items-center mb-4">
            <Icon name="link" size={20} color={colors.textPrimary} />
            <Text
              className="text-base ml-2"
              style={{
                color: colors.textPrimary,
              }}
            >
              Link mới
            </Text>
          </View>

          <View className="flex-row items-center mb-3">
            <TextInput
              className="flex-1 rounded-xl px-4 py-3 mr-2"
              style={{
                backgroundColor: colors.background,
                color: colors.textPrimary,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              value={`splitwise.vn/join/${group.inviteCode}`}
              editable={false}
            />
            <TouchableOpacity
              className="px-4 py-3 rounded-xl"
              style={{ backgroundColor: colors.primary }}
              activeOpacity={0.8}
              onPress={handleCopyLink}
            >
              <Text
                className="text-base"
                style={{
                  color: "#FFFFFF",
                }}
              >
                Sao chép
              </Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* Options Section - Admin Only */}
        {isAdmin && (
          <View
            className="rounded-2xl mx-4 mt-4 p-4"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row items-center mb-4">
              <Icon name="settings" size={20} color={colors.textPrimary} />
              <Text
                className="text-base ml-2"
                style={{
                  color: colors.textPrimary,
                }}
              >
                Tùy chọn
              </Text>
            </View>

            <View className="flex-row items-center justify-between ">
              <Text
                className="flex-1 text-base"
                style={{
                  color: colors.textPrimary,
                }}
              >
                Cho phép thành viên sửa/xóa
              </Text>
              <Switch
                value={allowMemberEdit}
                onValueChange={(val) => handleUpdateSettings("allowMemberEdit", val)}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={allowMemberEdit ? colors.primary : colors.textSecondary}
              />
            </View>

            {/* Added allowMemberDirectAdd */}
             <View className="flex-row items-center justify-between ">
               <Text
                 className="flex-1 text-base mr-4"
                 style={{
                   color: colors.textPrimary,
                 }}
               >
                 Cho phép thêm thành viên trực tiếp
               </Text>
               <Switch
                 value={allowMemberDirectAdd}
                 onValueChange={(val) => handleUpdateSettings("allowMemberDirectAdd", val)}
                 trackColor={{ false: colors.border, true: colors.primaryLight }}
                 thumbColor={allowMemberDirectAdd ? colors.primary : colors.textSecondary}
               />
             </View>

            <View className="flex-row items-center justify-between ">
              <Text
                className="flex-1 text-base"
                style={{
                  color: colors.textPrimary,
                }}
              >
                Yêu cầu xác nhận thanh toán
              </Text>
              <Switch
                value={requirePaymentConfirmation}
                onValueChange={(val) => handleUpdateSettings("requirePaymentConfirmation", val)}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={requirePaymentConfirmation ? colors.primary : colors.textSecondary}
              />
            </View>

            <View className="flex-row items-center justify-between ">
              <Text
                className="flex-1 text-base"
                style={{
                  color: colors.textPrimary,
                }}
              >
                Thông báo tự động
              </Text>
              <Switch
                value={autoReminderEnabled}
                onValueChange={(val) => handleUpdateSettings("autoReminderEnabled", val)}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={autoReminderEnabled ? colors.primary : colors.textSecondary}
              />
            </View>

            {autoReminderEnabled && (
                <View className="flex-row items-center justify-between mt-3">
                   <Text 
                      className="flex-1 text-base"
                      style={{ color: colors.textPrimary }}
                   >
                       Số ngày nhắc nhở
                   </Text>
                   <TextInput
                      value={tempReminderDays}
                      onChangeText={setTempReminderDays}
                      onEndEditing={() => {
                          const num = parseInt(tempReminderDays);
                          if (isNaN(num) || num < 1) {
                              showErrorRef.current("Số ngày nhắc nhở phải lớn hơn hoặc bằng 1", "Lỗi");
                              setTempReminderDays(String(reminderDays));
                              return;
                          }
                          if (num !== reminderDays) {
                              handleUpdateSettings("reminderDays", num);
                          }
                      }}
                      keyboardType="numeric"
                      className="w-16 text-center font-bold px-2 py-1 rounded border"
                      style={{
                          color: colors.textPrimary,
                          borderColor: colors.border,
                          backgroundColor: colors.background
                      }}
                   />
                </View>
            )}
          </View>
        )}

        {/* Data Section */}
        <View
          className="rounded-2xl mx-4 mt-4 p-4"
          style={{ backgroundColor: colors.surface }}
        >
          <View className="flex-row items-center mb-4">
            <Icon name="database" size={20} color={colors.textPrimary} />
            <Text
              className="text-base ml-2"
              style={{
                color: colors.textPrimary,
              }}
            >
              Dữ liệu
            </Text>
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-between py-3"
            activeOpacity={0.7}
          >
            <Text
              className="text-base"
              style={{
                color: colors.textPrimary,
              }}
            >
              Xuất dữ liệu nhóm
            </Text>
            <Icon name="chevronRight" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-3"
            activeOpacity={0.7}
          >
            <Text
              className="text-base"
              style={{
                color: colors.textPrimary,
              }}
            >
              Lưu trữ nhóm
            </Text>
            <Icon name="chevronRight" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View
          className="rounded-2xl mx-4 mt-4 p-4 mb-6"
          style={{
            backgroundColor: colors.surface,
          }}
        >
          <TouchableOpacity
            className="py-3 rounded-xl mb-3"
            style={{
              backgroundColor: colors.danger + "20",
              borderWidth: 1,
              borderColor: colors.danger,
            }}
            activeOpacity={0.7}
            onPress={handleLeaveGroup}
          >
            <Text
              className="text-center text-base"
              style={{
                color: colors.danger,
              }}
            >
              Rời nhóm
            </Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              className="py-3 rounded-xl"
              style={{ backgroundColor: colors.danger }}
              activeOpacity={0.8}
              onPress={handleDeleteGroup}
            >
              <Text
                className="text-center text-base"
                style={{
                  color: "#FFFFFF",
                }}
              >
                Xóa nhóm
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        transparent
        animationType="fade"
        onRequestClose={closeAddMemberModal}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          onPress={closeAddMemberModal}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View 
                style={{ 
                  backgroundColor: colors.surface, 
                  borderRadius: 16, 
                  padding: 24, 
                  width: 320,
                }}
              >
                <Text
                  className="text-xl font-bold mb-4"
                  style={{ color: colors.textPrimary }}
                >
                  Thêm thành viên
                </Text>

                {/* Input Type Toggle */}
                <View className="flex-row mb-4" style={{ gap: 8 }}>
                  <TouchableOpacity
                    className="flex-1 py-2 rounded-lg items-center"
                    style={{
                      backgroundColor: inputType === 'email' ? colors.primary : colors.background,
                    }}
                    onPress={() => setInputType('email')}
                  >
                    <Text
                      className="text-base font-semibold"
                      style={{ color: inputType === 'email' ? '#FFFFFF' : colors.textSecondary }}
                    >
                      Email
                    </Text>
                  </TouchableOpacity>

                  <Text className="text-base self-center" style={{ color: colors.textSecondary }}>
                    hoặc
                  </Text>

                  <TouchableOpacity
                    className="flex-1 py-2 rounded-lg items-center"
                    style={{
                      backgroundColor: inputType === 'phone' ? colors.primary : colors.background,
                    }}
                    onPress={() => setInputType('phone')}
                  >
                    <Text
                      className="text-base font-semibold"
                      style={{ color: inputType === 'phone' ? '#FFFFFF' : colors.textSecondary }}
                    >
                      Số điện thoại
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Input Field */}
                <TextInput
                  className="border rounded-lg px-4 py-3 text-base mb-4"
                  style={{
                    borderColor: colors.border,
                    color: colors.textPrimary,
                    backgroundColor: colors.background,
                  }}
                  placeholder={inputType === 'email' ? 'Nhập email' : 'Nhập số điện thoại'}
                  placeholderTextColor={colors.textSecondary}
                  value={inputValue}
                  onChangeText={setInputValue}
                  keyboardType={inputType === 'email' ? 'email-address' : 'phone-pad'}
                  autoCapitalize="none"
                  autoComplete={inputType === 'email' ? 'email' : 'tel'}
                />

                {/* Buttons */}
                <View className="flex-row" style={{ gap: 8 }}>
                  <TouchableOpacity
                    className="flex-1 py-3 rounded-lg items-center"
                    style={{ backgroundColor: colors.border }}
                    onPress={closeAddMemberModal}
                  >
                    <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                      Hủy
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 py-3 rounded-lg items-center"
                    style={{ backgroundColor: colors.primary }}
                    onPress={handleAddMember}
                    disabled={isAddingMember}
                  >
                    {isAddingMember ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="text-base font-bold" style={{ color: '#FFFFFF' }}>
                        Thêm
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};


import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput as RNTextInput,
  Modal,
  Platform,
  Keyboard,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useAuthStore } from "../../../store/authStore";
import { Icon } from "../../../components/common/Icon";
import { AmountInputWithKeypad } from "../../../components/common/AmountInputWithKeypad";
import { AmountKeypadBottomSheet } from "../../../components/common/AmountKeypadBottomSheet";
import { getGroupDetail, type GroupDetail, type GroupMember } from "../../../services/api/group.api";
import { createExpense, type CreateExpenseRequest } from "../../../services/api/expense.api";
import { createExpenseSchema, type CreateExpenseFormData } from "../schemas/expense.schema";
import { useToast } from "../../../hooks/useToast";
import { useGroupStore } from "../../../store/groupStore";

const CATEGORIES = [
  { value: "food", labelVi: "Ăn uống", labelEn: "Food & Drink" },
  { value: "transport", labelVi: "Giao thông", labelEn: "Transport" },
  { value: "entertainment", labelVi: "Giải trí", labelEn: "Entertainment" },
  { value: "accommodation", labelVi: "Chỗ ở", labelEn: "Accommodation" },
  { value: "shopping", labelVi: "Mua sắm", labelEn: "Shopping" },
  { value: "other", labelVi: "Khác", labelEn: "Other" },
] as const;

const SPLIT_TYPES = [
  { value: "equal", labelVi: "Chia đều", labelEn: "Split equally" },
  { value: "exact", labelVi: "Theo số tiền", labelEn: "By amount" },
  { value: "percentage", labelVi: "Theo %", labelEn: "By percentage" },
  { value: "shares", labelVi: "Theo phần", labelEn: "By share" },
] as const;

export const AddExpenseScreen = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const theme = usePreferencesStore((state) => state.theme);
  const language = usePreferencesStore((state) => state.language);
  const colors = getThemeColors(theme);
  const user = useAuthStore((state) => state.user);
  const { success, error: showError } = useToast();
  const getGroupDetailFromStore = useGroupStore((state) => state.getGroupDetail);
  const setGroupDetail = useGroupStore((state) => state.setGroupDetail);
  const groupFromStore = useGroupStore((state) => params.id ? state.groupDetails[params.id] : undefined);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPayerPicker, setShowPayerPicker] = useState(false);
  const [showAmountKeypad, setShowAmountKeypad] = useState(false);
  
  // State for split input values
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, string>>({});

  // Use refs to avoid dependency issues
  const showErrorRef = useRef(showError);
  const languageRef = useRef(language);

  useEffect(() => {
    showErrorRef.current = showError;
    languageRef.current = language;
  }, [showError, language]);

  const methods = useForm<CreateExpenseFormData>({
    resolver: zodResolver(createExpenseSchema(language)),
    defaultValues: {
      description: "",
      amount: "",
      currency: "VND",
      paidBy: "",
      category: "food",
      splitType: "equal",
      expenseDate: new Date(),
      receiptUrl: undefined,
      notes: "",
      selectedMembers: [],
    },
    mode: "onBlur",
  });

  const {
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = methods;

  const amount = watch("amount");
  const splitType = watch("splitType");
  const selectedMembers = watch("selectedMembers");
  const paidBy = watch("paidBy");
  const expenseDate = watch("expenseDate");

  // Load group detail - check store first, only call API if not in store
  useEffect(() => {
    if (!params.id) {
      showErrorRef.current("Không tìm thấy ID nhóm", "Lỗi");
      router.back();
      return;
    }

    // Check store first
    const storedGroup = getGroupDetailFromStore(params.id);
    if (storedGroup) {
      // Use data from store, no API call needed
      setGroup(storedGroup);
      setIsLoading(false);
      // Set default paidBy to current user
      if (user?.id) {
        setValue("paidBy", user.id);
      }
    } else {
      // Not in store, load from API
      const loadGroup = async () => {
        try {
          setIsLoading(true);
          const response = await getGroupDetail(params.id);
          setGroup(response.group);
          setGroupDetail(params.id, response.group);
          
          // Set default paidBy to current user
          if (user?.id) {
            setValue("paidBy", user.id);
          }
        } catch (err: any) {
          const errorMessage = err.message || (languageRef.current === "vi" ? "Không thể tải thông tin nhóm" : "Failed to load group");
          showErrorRef.current(errorMessage, languageRef.current === "vi" ? "Lỗi" : "Error");
        } finally {
          setIsLoading(false);
        }
      };
      loadGroup();
    }
  }, [params.id, user?.id, setValue, getGroupDetailFromStore, setGroupDetail]);

  // Update when store changes (e.g., after creating expense)
  useEffect(() => {
    if (groupFromStore && params.id) {
      setGroup(groupFromStore);
    }
  }, [groupFromStore, params.id]);

  // Get all members including current user
  const allMembers = useMemo(() => {
    if (!group || !user) return [];
    
    const currentUserMember: GroupMember = {
      id: user.id, // This is the groupMember id, but we'll use userId for operations
      userId: user.id,
      fullName: user.fullName,
      avatarUrl: null,
      role: "MEMBER",
    };

    // Check if current user is already in members
    const isUserInGroup = group.members.some((m) => m.userId === user.id);
    
    if (isUserInGroup) {
      return group.members;
    }
    
    return [currentUserMember, ...group.members];
  }, [group, user]);

  // Calculate splits based on splitType
  const calculatedSplits = useMemo(() => {
    if (!selectedMembers.length || !amount) return [];

    // Remove any non-numeric characters (dots, commas, etc.)
    const amountNum = parseFloat(amount.replace(/[^\d]/g, "")) || 0;
    if (amountNum <= 0) return [];

    const splits: Array<{ userId: string; amount?: string; percentage?: string; shares?: string }> = [];

    if (splitType === "equal") {
      const perPerson = amountNum / selectedMembers.length;
      selectedMembers.forEach((userId) => {
        splits.push({
          userId,
          amount: perPerson.toFixed(2),
        });
      });
    } else if (splitType === "exact") {
      // Use exact amounts from state
      selectedMembers.forEach((userId) => {
        const exactAmount = exactAmounts[userId] || "0";
        splits.push({
          userId,
          amount: exactAmount.replace(/,/g, ""),
        });
      });
    } else if (splitType === "percentage") {
      // Calculate amounts from percentages
      selectedMembers.forEach((userId) => {
        const percentage = parseFloat(percentages[userId] || "0");
        const calculatedAmount = (amountNum * percentage) / 100;
        splits.push({
          userId,
          percentage: percentage.toFixed(2),
          amount: calculatedAmount.toFixed(2),
        });
      });
    } else if (splitType === "shares") {
      // Calculate amounts from shares
      const totalShares = selectedMembers.reduce((sum, userId) => {
        return sum + parseFloat(shares[userId] || "0");
      }, 0);
      
      if (totalShares > 0) {
        selectedMembers.forEach((userId) => {
          const userShares = parseFloat(shares[userId] || "0");
          const calculatedAmount = (amountNum * userShares) / totalShares;
          splits.push({
            userId,
            shares: userShares.toFixed(2),
            amount: calculatedAmount.toFixed(2),
          });
        });
      } else {
        selectedMembers.forEach((userId) => {
          splits.push({
            userId,
            shares: "0",
            amount: "0",
          });
        });
      }
    }

    return splits;
  }, [selectedMembers, amount, splitType, exactAmounts, percentages, shares]);

  // Format currency
  const formatCurrency = useCallback((value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
    if (isNaN(num)) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num);
  }, []);


  // Format date
  const formatDate = useCallback((date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  // Handle member selection
  const toggleMember = useCallback(
    (memberId: string) => {
      const current = selectedMembers || [];
      if (current.includes(memberId)) {
        setValue("selectedMembers", current.filter((id) => id !== memberId));
        // Clear input values when deselecting
        setExactAmounts((prev) => {
          const newState = { ...prev };
          delete newState[memberId];
          return newState;
        });
        setPercentages((prev) => {
          const newState = { ...prev };
          delete newState[memberId];
          return newState;
        });
        setShares((prev) => {
          const newState = { ...prev };
          delete newState[memberId];
          return newState;
        });
      } else {
        setValue("selectedMembers", [...current, memberId]);
      }
    },
    [selectedMembers, setValue]
  );

  // Select all members
  const selectAllMembers = useCallback(() => {
    if (!allMembers.length) return;
    setValue("selectedMembers", allMembers.map((m) => m.userId));
  }, [allMembers, setValue]);

  // Pick image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showError(
        language === "vi" ? "Cần quyền truy cập thư viện ảnh" : "Need photo library permission",
        language === "vi" ? "Lỗi" : "Error"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setValue("receiptUrl", result.assets[0].uri);
    }
  };

  // Remove image
  const removeImage = () => {
    setImageUri(null);
    setValue("receiptUrl", undefined);
  };

  // Handle date change
  const handleDateChange = (selectedDate: Date) => {
    setValue("expenseDate", selectedDate);
    setShowDatePicker(false);
  };

  // Get member name
  const getMemberName = useCallback(
    (userId: string) => {
      if (userId === user?.id) {
        return language === "vi" ? "Bạn" : "You";
      }
      const member = allMembers.find((m) => m.userId === userId);
      return member?.fullName || "";
    },
    [allMembers, user?.id, language]
  );

  // Get member initials
  // Get member initials - first letter of last word
  const getMemberInitials = useCallback((name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return "?";
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

  // Handle form submit
  const onSubmit = async (data: CreateExpenseFormData) => {
    if (!group || !user) return;

    try {
      setIsSubmitting(true);

      // Build splits array - ensure all values are valid strings without commas
      const splits = calculatedSplits.map((split) => {
        const splitData: any = { userId: split.userId };
        if (splitType === "equal" || splitType === "exact") {
          const amountValue = split.amount || "0";
          // Remove commas and ensure it's a valid number string
          const cleanAmount = amountValue.toString().replace(/,/g, "").trim();
          splitData.amount = cleanAmount || "0";
        } else if (splitType === "percentage") {
          const percentageValue = split.percentage || "0";
          splitData.percentage = percentageValue.toString().trim() || "0";
        } else if (splitType === "shares") {
          const sharesValue = split.shares || "0";
          splitData.shares = sharesValue.toString().trim() || "0";
        }
        return splitData;
      });

      // Prepare request - ensure amount is a valid number string (no dots, commas, spaces, valid number)
      const amountStr = data.amount || "";
      let cleanAmount = amountStr.replace(/[^\d]/g, "").trim();
      
      // Validate amount
      if (!cleanAmount || cleanAmount === "" || cleanAmount === "0") {
        showError(
          language === "vi" ? "Vui lòng nhập số tiền lớn hơn 0" : "Please enter amount greater than 0",
          language === "vi" ? "Lỗi" : "Error"
        );
        setIsSubmitting(false);
        return;
      }

      // Validate it's a valid number
      const amountNum = parseFloat(cleanAmount);
      if (isNaN(amountNum) || amountNum <= 0 || !isFinite(amountNum)) {
        showError(
          language === "vi" ? "Số tiền không hợp lệ" : "Invalid amount",
          language === "vi" ? "Lỗi" : "Error"
        );
        setIsSubmitting(false);
        return;
      }

      // Keep the cleaned string (already validated as number)
      // Don't use toString() to avoid any precision issues
      // The cleaned string is already a valid number string

      // Validate splits array
      if (!splits || splits.length === 0) {
        showError(
          language === "vi" ? "Vui lòng chọn ít nhất một người để chia" : "Please select at least one person to split with",
          language === "vi" ? "Lỗi" : "Error"
        );
        setIsSubmitting(false);
        return;
      }

      const requestData: CreateExpenseRequest = {
        description: data.description,
        amount: cleanAmount,
        currency: data.currency || "VND",
        paidBy: data.paidBy,
        category: data.category,
        splitType: data.splitType,
        expenseDate: data.expenseDate?.toISOString(),
        receiptUrl: data.receiptUrl || "",
        notes: data.notes || "",
        splits,
      };

      const result = await createExpense(params.id, requestData);

      if ("message" in result && result.message && !("field" in result)) {
        // Reload group detail to get the new expense
        try {
          const groupDetailResponse = await getGroupDetail(params.id);
          setGroupDetail(params.id, groupDetailResponse.group);
        } catch (err) {
          // If reload fails, still show success but log error
          console.error("Failed to reload group detail:", err);
        }
        
        success(
          language === "vi" ? "Tạo chi phí thành công" : "Expense created successfully",
          language === "vi" ? "Thành công" : "Success"
        );
        router.back();
      } else {
        const errorMessage = ("message" in result ? result.message : undefined) || (language === "vi" ? "Không thể tạo chi phí" : "Failed to create expense");
        showError(errorMessage, language === "vi" ? "Lỗi" : "Error");
      }
    } catch (err: any) {
      const errorMessage = err.message || (language === "vi" ? "Không thể tạo chi phí" : "Failed to create expense");
      showError(errorMessage, language === "vi" ? "Lỗi" : "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <View className="flex-1 items-center justify-center px-4">
          <Text
            className="text-base text-center font-normal"
            style={{
              color: colors.textSecondary,
            }}
          >
            {language === "vi" ? "Không tìm thấy nhóm" : "Group not found"}
          </Text>
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
          borderBottomWidth: 1,
        }}
      >
        <View className="flex-row items-center justify-between px-4 py-4">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Icon name="arrowLeft" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View className="flex-1 items-center px-4">
            <Text
              className="text-lg font-bold"
              style={{
                color: colors.textPrimary,
              }}
            >
              {language === "vi" ? "Thêm chi phí" : "Add Expense"}
            </Text>
          </View>

          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Form */}
      <FormProvider {...methods}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Description */}
          <View className="mb-5">
            <Text
              className="text-base mb-3 font-semibold"
              style={{
                color: colors.textPrimary,
              }}
            >
              {language === "vi" ? "Mô tả" : "Description"}
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <RNTextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={language === "vi" ? "VD: Ăn trưa, xăng xe..." : "E.g., Lunch, gas..."}
                    placeholderTextColor={colors.textTertiary}
                    className="rounded-2xl border-2 px-4 py-4"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: errors.description ? colors.danger : colors.border,
                      fontSize: 15,
                      color: colors.textPrimary,
                    }}
                  />
                  {errors.description && (
                    <Text
                      className="text-xs mt-1 font-normal"
                      style={{
                        color: colors.danger,
                      }}
                    >
                      {errors.description.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* Amount */}
          <View className="mb-5">
            <Text
              className="text-base mb-3 font-semibold"
              style={{
                color: colors.textPrimary,
              }}
            >
              {language === "vi" ? "Số tiền" : "Amount"}
            </Text>
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, value } }) => (
                <View>
                  <AmountInputWithKeypad
                    value={value || ""}
                    onPress={() => setShowAmountKeypad(true)}
                    error={!!errors.amount}
                    placeholder={language === "vi" ? "Nhập số tiền" : "Enter amount"}
                  />
                  {errors.amount && (
                    <Text
                      className="text-xs mt-1 font-normal"
                      style={{
                        color: colors.danger,
                      }}
                    >
                      {errors.amount.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* Payer */}
          <View className="mb-5">
            <Text
              className="text-base mb-3 font-semibold"
              style={{
                color: colors.textPrimary,
              }}
            >
              {language === "vi" ? "Người trả" : "Payer"}
            </Text>
            <Controller
              control={control}
              name="paidBy"
              render={({ field: { onChange, value } }) => (
                <View>
                  <TouchableOpacity
                    className="rounded-2xl border-2 px-4 py-4 flex-row items-center justify-between"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: errors.paidBy ? colors.danger : colors.border,
                    }}
                    onPress={() => setShowPayerPicker(true)}
                  >
                    <Text
                      className="font-medium"
                      style={{
                        fontSize: 14,
                        color: value ? colors.textPrimary : colors.textTertiary,
                      }}
                    >
                      {value ? getMemberName(value) : language === "vi" ? "Chọn người trả" : "Select payer"}
                    </Text>
                    <Icon name="chevronDown" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  {errors.paidBy && (
                    <Text
                      className="text-xs mt-1 font-normal"
                      style={{
                        color: colors.danger,
                      }}
                    >
                      {errors.paidBy.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* Split among */}
          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text
                className="text-base font-semibold"
                style={{
                  color: colors.textPrimary,
                }}
              >
                {language === "vi" ? "Chia cho" : "Split among"}
              </Text>
              <TouchableOpacity onPress={selectAllMembers} activeOpacity={0.7}>
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: colors.primary,
                  }}
                >
                  {language === "vi" ? "Chọn tất cả" : "Select all"}
                </Text>
              </TouchableOpacity>
            </View>
            <View className="space-y-2">
              {allMembers.map((member) => {
                const isSelected = selectedMembers?.includes(member.userId);
                const split = calculatedSplits.find((s) => s.userId === member.userId);
                const splitAmount = split?.amount ? formatCurrency(split.amount) : "0 ₫";
                const isCurrentUser = member.userId === user?.id;
                const showInput = isSelected && splitType !== "equal";

                return (
                  <View
                    key={member.userId}
                    className="rounded-lg border mb-2"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: isSelected ? "#22C55E" : colors.border,
                      borderWidth: isSelected ? 1.5 : 1,
                    }}
                  >
                    {/* Header with checkbox */}
                    <TouchableOpacity
                      className="flex-row items-center justify-between px-3 py-2.5"
                      onPress={() => toggleMember(member.userId)}
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center flex-1">
                        {/* Avatar */}
                        <View
                          className="w-9 h-9 rounded-full items-center justify-center mr-2.5"
                          style={{
                            backgroundColor: getMemberAvatarColor(member.userId),
                          }}
                        >
                          {member.avatarUrl ? (
                            <Image
                              source={{ uri: member.avatarUrl }}
                              style={{ width: 36, height: 36, borderRadius: 18 }}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text
                              className="font-bold"
                              style={{
                                fontSize: 15,
                                color: getMemberTextColor(member.userId),
                              }}
                            >
                              {getMemberInitials(member.fullName)}
                            </Text>
                          )}
                        </View>

                        {/* Name and Amount */}
                        <View className="flex-1">
                          <Text
                            className="font-normal"
                            style={{
                              fontSize: 14,
                              color: colors.textPrimary,
                            }}
                          >
                            {isCurrentUser ? (language === "vi" ? "Bạn" : "You") : member.fullName}
                          </Text>
                          {!showInput && (
                            <Text
                              className="font-medium"
                              style={{
                                fontSize: 12,
                                color: isSelected ? "#22C55E" : colors.textSecondary,
                                marginTop: 2,
                              }}
                            >
                              {splitAmount}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Checkbox */}
                      <View
                        className="w-5 h-5 rounded-full border-2 items-center justify-center"
                        style={{
                          borderColor: isSelected ? "#22C55E" : colors.border,
                          backgroundColor: isSelected ? "#22C55E" : "transparent",
                        }}
                      >
                        {isSelected && (
                          <Icon name="check" size={14} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Input field for non-equal split types */}
                    {showInput && (
                      <View 
                        className="px-3 pb-2.5"
                        style={{
                          borderTopWidth: 1,
                          borderTopColor: colors.border,
                          marginTop: 4,
                          paddingTop: 8,
                        }}
                      >
                        <View className="flex-row items-center gap-3">
                          {splitType === "exact" && (
                            <>
                              <View className="flex-1">
                                <Text
                                  className="text-xs mb-1.5 font-normal"
                                  style={{
                                    fontSize: 12,
                                    color: colors.textTertiary,
                                  }}
                                >
                                  {language === "vi" ? "Số tiền" : "Amount"}
                                </Text>
                                <RNTextInput
                                  value={exactAmounts[member.userId] || ""}
                                  onChangeText={(text) => {
                                    // Remove non-numeric characters except comma
                                    const cleaned = text.replace(/[^\d,]/g, "");
                                    setExactAmounts((prev) => ({
                                      ...prev,
                                      [member.userId]: cleaned,
                                    }));
                                  }}
                                  placeholder="0"
                                  placeholderTextColor={colors.textTertiary}
                                  keyboardType="numeric"
                                  className="rounded-lg border px-2.5 py-1.5"
                                  style={{
                                    backgroundColor: colors.background,
                                    borderColor: "#22C55E",
                                    borderWidth: 1,
                                    fontSize: 13,
                                    color: colors.textPrimary,
                                  }}
                                />
                              </View>
                              <View className="items-end justify-center" style={{ paddingTop: 28 }}>
                                <Text
                                  className="text-sm font-medium"
                                  style={{
                                    fontSize: 13,
                                    color: "#22C55E",
                                  }}
                                >
                                  {splitAmount}
                                </Text>
                              </View>
                            </>
                          )}
                          {splitType === "percentage" && (
                            <>
                              <View className="flex-1">
                                <Text
                                  className="text-xs mb-1 font-normal"
                                  style={{
                                    fontSize: 11,
                                    color: colors.textTertiary,
                                  }}
                                >
                                  {language === "vi" ? "Phần trăm (%)" : "Percentage (%)"}
                                </Text>
                                <View className="flex-row items-center gap-2">
                                  <RNTextInput
                                    value={percentages[member.userId] || ""}
                                    onChangeText={(text) => {
                                      // Remove non-numeric characters except decimal point
                                      const cleaned = text.replace(/[^\d.]/g, "");
                                      setPercentages((prev) => ({
                                        ...prev,
                                        [member.userId]: cleaned,
                                      }));
                                    }}
                                    placeholder="0"
                                    placeholderTextColor={colors.textTertiary}
                                    keyboardType="decimal-pad"
                                    className="flex-1 rounded-lg border px-2.5 py-1.5"
                                    style={{
                                      backgroundColor: colors.background,
                                      borderColor: "#22C55E",
                                      borderWidth: 1,
                                      fontSize: 13,
                                      color: colors.textPrimary,
                                    }}
                                  />
                                  <View
                                    className="px-2.5 py-1.5 rounded-lg"
                                    style={{
                                      backgroundColor: "#22C55E" + "20",
                                    }}
                                  >
                                    <Text
                                      className="font-medium"
                                      style={{
                                        fontSize: 13,
                                        color: "#22C55E",
                                      }}
                                    >
                                      %
                                    </Text>
                                  </View>
                                </View>
                              </View>
                              <View className="items-end justify-center" style={{ paddingTop: 28 }}>
                                <Text
                                  className="text-sm font-medium"
                                  style={{
                                    fontSize: 13,
                                    color: "#22C55E",
                                  }}
                                >
                                  {splitAmount}
                                </Text>
                              </View>
                            </>
                          )}
                          {splitType === "shares" && (
                            <>
                              <View className="flex-1">
                                <Text
                                  className="text-xs mb-1 font-normal"
                                  style={{
                                    fontSize: 11,
                                    color: colors.textTertiary,
                                  }}
                                >
                                  {language === "vi" ? "Số phần" : "Shares"}
                                </Text>
                                <RNTextInput
                                  value={shares[member.userId] || ""}
                                  onChangeText={(text) => {
                                    // Remove non-numeric characters except decimal point
                                    const cleaned = text.replace(/[^\d.]/g, "");
                                    setShares((prev) => ({
                                      ...prev,
                                      [member.userId]: cleaned,
                                    }));
                                  }}
                                  placeholder="0"
                                  placeholderTextColor={colors.textTertiary}
                                  keyboardType="decimal-pad"
                                  className="rounded-lg border px-2.5 py-1.5"
                                  style={{
                                    backgroundColor: colors.background,
                                    borderColor: "#22C55E",
                                    borderWidth: 1,
                                    fontSize: 13,
                                    color: colors.textPrimary,
                                  }}
                                />
                              </View>
                              <View className="items-end justify-center" style={{ paddingTop: 28 }}>
                                <Text
                                  className="text-sm font-medium"
                                  style={{
                                    fontSize: 13,
                                    color: "#22C55E",
                                  }}
                                >
                                  {splitAmount}
                                </Text>
                              </View>
                            </>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
            {errors.selectedMembers && (
              <Text
                className="text-xs mt-1 font-normal"
                style={{
                  color: colors.danger,
                }}
              >
                {errors.selectedMembers.message}
              </Text>
            )}
          </View>

          {/* Split Type */}
          <View className="mb-5">
            <Text
              className="text-base mb-3 font-semibold"
              style={{
                color: colors.textPrimary,
              }}
            >
              {language === "vi" ? "Cách chia" : "Split method"}
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {SPLIT_TYPES.map((type) => {
                const isSelected = splitType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    className="flex-1 min-w-[45%] px-4 py-4 rounded-2xl border-2"
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      shadowColor: isSelected ? colors.primary : "transparent",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isSelected ? 0.2 : 0,
                      shadowRadius: 4,
                      elevation: isSelected ? 3 : 0,
                    }}
                    onPress={() => {
                      setValue("splitType", type.value);
                      // Reset input values when changing split type
                      setExactAmounts({});
                      setPercentages({});
                      setShares({});
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      className="font-semibold"
                      style={{
                        fontSize: 14,
                        color: isSelected ? "#FFFFFF" : colors.textPrimary,
                        textAlign: "center",
                      }}
                    >
                      {language === "vi" ? type.labelVi : type.labelEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Date */}
          <View className="mb-5">
            <Text
              className="text-base mb-3 font-semibold"
              style={{
                color: colors.textPrimary,
              }}
            >
              {language === "vi" ? "Ngày" : "Date"}
            </Text>
            <Controller
              control={control}
              name="expenseDate"
              render={({ field: { value } }) => (
                <TouchableOpacity
                  className="rounded-xl border px-4 py-3 flex-row items-center justify-between"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                  onPress={() => {
                    setShowDatePicker(true);
                  }}
                >
                  <Text
                    className="font-medium"
                    style={{
                      fontSize: 16,
                      color: colors.textPrimary,
                    }}
                  >
                    {value ? formatDate(value) : ""}
                  </Text>
                  <Icon name="calendar" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Category */}
          <View className="mb-5">
            <Text
              className="text-base mb-3 font-semibold"
              style={{
                color: colors.textPrimary,
              }}
            >
              {language === "vi" ? "Danh mục" : "Category"}
            </Text>
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  className="rounded-xl border px-4 py-3 flex-row items-center justify-between"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                  onPress={() => setShowCategoryPicker(true)}
                >
                  <Text
                    className="font-medium"
                    style={{
                      fontSize: 16,
                      color: colors.textPrimary,
                    }}
                  >
                    {CATEGORIES.find((c) => c.value === value)?.[language === "vi" ? "labelVi" : "labelEn"] || ""}
                  </Text>
                  <Icon name="chevronDown" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Receipt Image */}
          <View className="mb-5">
            <Text
              className="text-base mb-3 font-semibold"
              style={{
                color: colors.textPrimary,
              }}
            >
              {language === "vi" ? "Thêm ảnh hóa đơn" : "Add receipt image"}
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
                  onPress={removeImage}
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
                onPress={pickImage}
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
                  {language === "vi" ? "Thêm ảnh hóa đơn" : "Add receipt image"}
                </Text>
                <Text
                  className="text-center font-normal"
                  style={{
                    fontSize: 13,
                    color: colors.textTertiary,
                  }}
                >
                  {language === "vi" ? "Chạm để chọn ảnh" : "Tap to select image"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notes */}
          <View className="mb-5">
            <Text
              className="text-base mb-3 font-semibold"
              style={{
                color: colors.textPrimary,
              }}
            >
              {language === "vi" ? "Ghi chú thêm (tùy chọn)" : "Add notes (optional)"}
            </Text>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <RNTextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={language === "vi" ? "Thêm ghi chú ở đây..." : "Add notes here..."}
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={4}
                  className="rounded-2xl border-2 px-4 py-4"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    fontSize: 15,
                    color: colors.textPrimary,
                    minHeight: 120,
                    textAlignVertical: "top",
                  }}
                />
              )}
            />
          </View>
        </ScrollView>
      </FormProvider>

      {/* Submit Button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t"
        style={{
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        }}
      >
        <TouchableOpacity
          className="rounded-xl py-4 items-center justify-center"
          style={{
            backgroundColor: colors.primary,
            opacity: isSubmitting ? 0.6 : 1,
          }}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="font-semibold"
              style={{
                fontSize: 16,
                color: "#FFFFFF",
              }}
            >
              {language === "vi" ? "Lưu chi phí" : "Save expense"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View
            className="rounded-t-3xl p-6"
            style={{ backgroundColor: colors.background }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-lg font-semibold"
                style={{
                  color: colors.textPrimary,
                }}
              >
                {language === "vi" ? "Chọn ngày" : "Select Date"}
              </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Icon name="x" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-2">
              {[-2, -1, 0, 1, 2].map((days) => {
                const date = new Date();
                date.setDate(date.getDate() + days);
                const isToday = days === 0;
                const isSelected = expenseDate && formatDate(expenseDate) === formatDate(date);
                return (
                  <TouchableOpacity
                    key={days}
                    className="flex-1 py-3 rounded-xl border items-center"
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                    onPress={() => handleDateChange(date)}
                  >
                    <Text
                      className="text-xs mb-1 font-normal"
                      style={{
                        color: isSelected ? "#FFFFFF" : colors.textSecondary,
                      }}
                    >
                      {days === -2 ? (language === "vi" ? "2 ngày trước" : "2 days ago") :
                       days === -1 ? (language === "vi" ? "Hôm qua" : "Yesterday") :
                       days === 0 ? (language === "vi" ? "Hôm nay" : "Today") :
                       days === 1 ? (language === "vi" ? "Ngày mai" : "Tomorrow") :
                       (language === "vi" ? "2 ngày sau" : "2 days later")}
                    </Text>
                    <Text
                      className="font-bold"
                      style={{
                        fontSize: 16,
                        color: isSelected ? "#FFFFFF" : colors.textPrimary,
                      }}
                    >
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View
            className="rounded-t-3xl p-6 max-h-[80%]"
            style={{ backgroundColor: colors.background }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-lg font-semibold"
                style={{
                  color: colors.textPrimary,
                }}
              >
                {language === "vi" ? "Chọn danh mục" : "Select Category"}
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Icon name="x" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {CATEGORIES.map((category) => {
                const isSelected = watch("category") === category.value;
                return (
                  <TouchableOpacity
                    key={category.value}
                    className="py-4 px-4 rounded-xl border mb-2 flex-row items-center justify-between"
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                    onPress={() => {
                      setValue("category", category.value);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text
                      className="font-medium"
                      style={{
                        fontSize: 14,
                        color: isSelected ? "#FFFFFF" : colors.textPrimary,
                      }}
                    >
                      {language === "vi" ? category.labelVi : category.labelEn}
                    </Text>
                    {isSelected && (
                      <Icon name="check" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payer Picker Modal */}
      <Modal
        visible={showPayerPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPayerPicker(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View
            className="rounded-t-3xl p-6 max-h-[80%]"
            style={{ backgroundColor: colors.background }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-lg font-semibold"
                style={{
                  color: colors.textPrimary,
                }}
              >
                {language === "vi" ? "Chọn người trả" : "Select Payer"}
              </Text>
              <TouchableOpacity onPress={() => setShowPayerPicker(false)}>
                <Icon name="x" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {allMembers.map((member) => {
                const isSelected = watch("paidBy") === member.userId;
                const isCurrentUser = member.userId === user?.id;
                return (
                  <TouchableOpacity
                    key={member.userId}
                    className="py-4 px-4 rounded-xl border mb-2 flex-row items-center"
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                    onPress={() => {
                      setValue("paidBy", member.userId);
                      setShowPayerPicker(false);
                    }}
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{
                        backgroundColor: isSelected ? "#FFFFFF" : getMemberAvatarColor(member.userId),
                      }}
                    >
                      {member.avatarUrl ? (
                        <Image
                          source={{ uri: member.avatarUrl }}
                          style={{ width: 40, height: 40, borderRadius: 20 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text
                          className="font-bold"
                          style={{
                            fontSize: 16,
                            color: isSelected ? getMemberTextColor(member.userId) : getMemberTextColor(member.userId),
                          }}
                        >
                          {getMemberInitials(member.fullName)}
                        </Text>
                      )}
                    </View>
                    <Text
                      className="flex-1 font-medium"
                      style={{
                        fontSize: 14,
                        color: isSelected ? "#FFFFFF" : colors.textPrimary,
                      }}
                    >
                      {isCurrentUser ? (language === "vi" ? "Bạn" : "You") : member.fullName}
                    </Text>
                    {isSelected && (
                      <Icon name="check" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Amount Keypad Bottom Sheet */}
      <AmountKeypadBottomSheet
        isOpen={showAmountKeypad}
        onClose={() => setShowAmountKeypad(false)}
        value={watch("amount") || ""}
        onChange={(newValue) => setValue("amount", newValue)}
      />
    </SafeAreaView>
  );
};


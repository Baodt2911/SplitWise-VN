import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput as RNTextInput,
  Keyboard,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { getThemeColors } from "../../../utils/themeColors";
import { uploadImage } from "../../../services/api/upload.api";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useAuthStore } from "../../../store/authStore";
import { useCategoryStore } from "../../../store/categoryStore";
import { Icon } from "../../../components/common/Icon";
import { AmountInputWithKeypad } from "../../../components/common/AmountInputWithKeypad";
import { AmountKeypadBottomSheet } from "../../../components/common/AmountKeypadBottomSheet";
import { getGroupDetail, type GroupDetail, type GroupMember } from "../../../services/api/group.api";
import { createExpense, updateExpense, getExpenseDetail, type CreateExpenseRequest } from "../../../services/api/expense.api";
import { createExpenseSchema, type CreateExpenseFormData } from "../schemas/expense.schema";
import { useToast } from "../../../hooks/useToast";
import { useGroupStore } from "../../../store/groupStore";
import { useTranslation } from "react-i18next";
import { CategorySelector } from "../../../components/common/CategorySelector";
import { getCategoryIcon } from "../../../constants/category.constants";
import { getMemberInitials, getMemberAvatarColor, getMemberTextColor } from "../../../utils/memberUtils";

// New Components
import { PayerSelector } from "../components/PayerSelector";
import { SplitSection } from "../components/SplitSection";
import { DateSelector } from "../components/DateSelector";
import { ReceiptPicker } from "../components/ReceiptPicker";

interface ExpenseFormScreenProps {
  isEdit?: boolean;
  expenseId?: string;
}

export const ExpenseFormScreen = ({ isEdit = false, expenseId }: ExpenseFormScreenProps) => {
  const params = useLocalSearchParams<{ id: string; expenseId?: string }>();
  // Use props if available, otherwise fallback to params
  const rawExpenseId = expenseId || params.expenseId;
  const finalExpenseId = Array.isArray(rawExpenseId) ? rawExpenseId[0] : rawExpenseId;
  
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);
  const user = useAuthStore((state) => state.user);
  const { success, error: showError } = useToast();
  const getGroupDetailFromStore = useGroupStore((state) => state.getGroupDetail);
  const setGroupDetail = useGroupStore((state) => state.setGroupDetail);

  const groupFromStore = useGroupStore((state) => params.id ? state.groupDetails[params.id] : undefined);
  const { t } = useTranslation();

  const categories = useCategoryStore((state) => state.categories);
  
  // Helper to find sub-category key
  const getSubCategoryKey = useCallback((subId: string) => {
    if (!categories || !subId) return subId;
    
    // Handle if categories has data wrapper
    const categoryData = (categories as any).data || categories;
    
    for (const group of Object.values(categoryData)) {
        if (Array.isArray(group)) {
          const found = group.find((c: any) => String(c.id) === String(subId));
          if (found) return found.key;
        }
    }
    return subId;
  }, [categories]);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPayerPicker, setShowPayerPicker] = useState(false);
  const [showAmountKeypad, setShowAmountKeypad] = useState(false);
  
  // State for split input values
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, string>>({});

  // Use refs to avoid dependency issues
  const showErrorRef = useRef(showError);

  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);

  const methods = useForm<CreateExpenseFormData>({
    resolver: zodResolver(createExpenseSchema()),
    defaultValues: {
      description: "",
      amount: "",
      currency: "VND",
      paidBy: "",
      category: "FOOD",
      subCategoryId: undefined,
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
  const selectedMembers = watch("selectedMembers") || [];
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
          const errorMessage = err.message || "Không thể tải thông tin nhóm";
          showErrorRef.current(errorMessage, "Lỗi");
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

  // Helper to populate form
  const populateForm = useCallback((expenseData: any) => {
      // Basic fields
      setValue("description", expenseData.description || "");
      setValue("amount", (expenseData.amount || "0").toString());
      setValue("currency", expenseData.currency || "VND");
      
      // Payer - prioritize ID
      const payerId = expenseData.paidById || expenseData.paidBy || "";
      setValue("paidBy", payerId);
      
      // Category
      setValue("category", expenseData.category || "FOOD");
      const subCatId = expenseData.subCategoryId || expenseData.subCategory?.id;
      setValue("subCategoryId", subCatId);
      
      // Split Type
      const splitType = expenseData.splitType || "equal";
      setValue("splitType", splitType);
      
      // Date
      const dateStr = expenseData.expenseDate || expenseData.date;
      setValue("expenseDate", dateStr ? new Date(dateStr) : new Date());
      
      // Receipt & Notes
      setValue("receiptUrl", expenseData.receiptUrl);
      setValue("notes", expenseData.notes || "");
      if (expenseData.receiptUrl) {
        setImageUri(expenseData.receiptUrl);
      }

      // Splits
      const splits = expenseData.splits || [];
      const memberIds = splits.map((s: any) => s.userId).filter(Boolean);
      setValue("selectedMembers", memberIds);

      // Split Values
      if (splitType === "exact") {
        const exacts: Record<string, string> = {};
        splits.forEach((s: any) => {
          if (s.userId && s.amount) exacts[s.userId] = s.amount.toString();
        });
        setExactAmounts(exacts);
      } else if (splitType === "percentage") {
        const percs: Record<string, string> = {};
        splits.forEach((s: any) => {
          if (s.userId && s.percentage) percs[s.userId] = s.percentage.toString();
        });
        setPercentages(percs);
      } else if (splitType === "shares") {
        const shrs: Record<string, string> = {};
        splits.forEach((s: any) => {
          if (s.userId && s.shares) shrs[s.userId] = s.shares.toString();
        });
        setShares(shrs);
      }
  }, [setValue]);

  // Fetch expense details if isEdit
  useEffect(() => {
    if (isEdit && finalExpenseId && params.id) {
      // Try to populate from store first
      if (groupFromStore?.expenses) {
          const expenseFromStore = groupFromStore.expenses.find(e => e.id === finalExpenseId);
          if (expenseFromStore) {
              populateForm(expenseFromStore);
              setIsLoading(false); 
              return; // Skip API fetch completely as requested
          }
      }

      const fetchExpense = async () => {
        try {
          setIsLoading(true);
          const expense = await getExpenseDetail(params.id, finalExpenseId);
          
          if ("message" in expense && !("description" in expense)) {
            showErrorRef.current(expense.message, "Lỗi");
            return;
          }

          const expenseData = expense as CreateExpenseRequest;
          populateForm(expenseData);
          
          // Update store
          useGroupStore.getState().updateExpense(params.id, finalExpenseId, expenseData);
          
        } catch (err: any) {
          showErrorRef.current(err.message || "Không thể tải chi tiết chi phí", "Lỗi");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchExpense();
    }
  }, [isEdit, finalExpenseId, params.id, populateForm, groupFromStore]);



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
        "Cần quyền truy cập thư viện ảnh",
        "Lỗi"
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
  };

  // Handle split value change
  const handleSplitValueChange = useCallback((userId: string, value: string, type: "exact" | "percentage" | "shares") => {
    if (type === "exact") {
      setExactAmounts(prev => ({ ...prev, [userId]: value }));
    } else if (type === "percentage") {
      setPercentages(prev => ({ ...prev, [userId]: value }));
    } else if (type === "shares") {
      setShares(prev => ({ ...prev, [userId]: value }));
    }
  }, []);

  // Get member name
  const getMemberName = useCallback(
    (userId: string) => {
      if (userId === user?.id) {
        return "Bạn";
      }
      const member = allMembers.find((m) => m.userId === userId);
      return member?.fullName || "";
    },
    [allMembers, user?.id]
  );



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



// ... (existing code)

      // Prepare request - ensure amount is a valid number string (no dots, commas, spaces, valid number)
      const amountStr = data.amount || "";
      let cleanAmount = amountStr.replace(/[^\d]/g, "").trim();
      
      // Validate amount
      if (!cleanAmount || cleanAmount === "" || cleanAmount === "0") {
// ...
      }

      // Validate splits array
      if (!splits || splits.length === 0) {
        showError(
          "Vui lòng chọn ít nhất một người để chia",
          "Lỗi"
        );
        setIsSubmitting(false);
        return;
      }
      
      // ... (validation logic)

      // Upload receipt if needed
      let finalReceiptUrl = data.receiptUrl;
      
      // If imageUri is set and is a local file (begins with file://), upload it
      if (imageUri && !imageUri.startsWith('http')) {
         try {
           const uploadResult = await uploadImage(
             { uri: imageUri, name: `expense_${Date.now()}.jpg`, type: 'image/jpeg' },
             params.id,
             'receipt'
           );
           
           if (uploadResult?.secure_url) {
             finalReceiptUrl = uploadResult.secure_url;
           }
         } catch (uploadError) {
           console.error("Receipt upload failed:", uploadError);
           // Continue without receipt or show error? 
           // For now, let's continue but maybe warn?
         }
      } else if (!imageUri) {
          // If imageUri is null, receipt was removed
          finalReceiptUrl = ""; 
      }

      const requestData: CreateExpenseRequest = {
        description: data.description,
        amount: cleanAmount,
        currency: data.currency || "VND",
        paidBy: data.paidBy,
        category: data.category,
        subCategoryId: data.subCategoryId,
        splitType: data.splitType,
        expenseDate: data.expenseDate?.toISOString(),
        receiptUrl: finalReceiptUrl || "",
        notes: data.notes || "",
        splits,
      };

      let result;
      if (isEdit && finalExpenseId) {
        result = await updateExpense(params.id, finalExpenseId, requestData);
      } else {
        result = await createExpense(params.id, requestData);
      }

      if ("message" in result && result.message && !("field" in result)) {
        // Update store
        if (isEdit && finalExpenseId) {
             // For update, we might need to refresh the list or update the specific item
             // For now, let's just refresh the expenses list in the background or assume the user will pull to refresh
             // Or better, update the specific item in the store if possible.
             // Update the specific item in the store
             if ('data' in result && result.data) {
               useGroupStore.getState().updateExpense(params.id, finalExpenseId, result.data);
             } else {
               // Fallback if no data returned, trigger refresh
               useGroupStore.getState().triggerRefresh();
             }
             success("Cập nhật chi phí thành công");
        } else {
             // Add new expense to store immediately
            if ('data' in result && result.data) {
              useGroupStore.getState().addExpense(params.id, result.data);
            }
            success("Tạo chi phí thành công");
        }
        
        router.back();
      } else if ("field" in result) {
        // Handle field error
        if (result.field === "amount") {
          methods.setError("amount", { message: result.message });
        } else if (result.field === "description") {
          methods.setError("description", { message: result.message });
        } else {
          showError(result.message, "Lỗi");
        }
      } else {
        showError(result.message || "Không thể lưu chi phí", "Lỗi");
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      showError(err.message || "Đã có lỗi xảy ra", "Lỗi");
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
            Không tìm thấy nhóm
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
              {isEdit ? "Sửa chi phí" : "Thêm chi phí"}
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
              Mô tả
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
                    placeholder="VD: Ăn trưa, xăng xe..."
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
              Số tiền
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
                    placeholder="Nhập số tiền"
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
              Người trả
            </Text>
            <Controller
              control={control}
              name="paidBy"
              render={({ field: { value } }) => (
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
                      {value ? getMemberName(value) : "Chọn người trả"}
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

          {/* Split Section */}
          <SplitSection
            splitType={splitType}
            onSplitTypeChange={(type) => {
              setValue("splitType", type);
              setExactAmounts({});
              setPercentages({});
              setShares({});
            }}
            members={allMembers}
            selectedMembers={selectedMembers}
            onToggleMember={toggleMember}
            onSelectAll={selectAllMembers}
            exactAmounts={exactAmounts}
            percentages={percentages}
            shares={shares}
            onSplitValueChange={handleSplitValueChange}
            calculatedSplits={calculatedSplits}
            colors={colors}
            currentUserId={user?.id}
            formatCurrency={formatCurrency}
          />

          {/* Category */}
          <View className="mb-5">
            <Text
              className="text-base mb-3 font-semibold"
              style={{
                color: colors.textPrimary,
              }}
            >
              Danh mục
            </Text>
            <Controller
              control={control}
              name="category"
              render={({ field: { value } }) => {
                const subCategoryId = watch("subCategoryId");
                
                // Determine colors based on category
                let iconBgColor = "#F3F4F6"; // gray-50
                let iconColor = "#6B7280"; // gray-500
                
                switch(value) {
                  case "FOOD": iconBgColor = "#FFF7ED"; iconColor = "#F97316"; break; // orange
                  case "TRANSPORT": iconBgColor = "#EFF6FF"; iconColor = "#3B82F6"; break; // blue
                  case "HOUSING": iconBgColor = "#F0FDF4"; iconColor = "#22C55E"; break; // green
                  case "ENTERTAINMENT": iconBgColor = "#FAF5FF"; iconColor = "#A855F7"; break; // purple
                  case "TRAVEL": iconBgColor = "#FEF2F2"; iconColor = "#EF4444"; break; // red
                  case "SHOPPING": iconBgColor = "#FDF2F8"; iconColor = "#EC4899"; break; // pink
                  case "HEALTH": iconBgColor = "#ECFEFF"; iconColor = "#06B6D4"; break; // cyan
                  case "EDUCATION": iconBgColor = "#FFFBEB"; iconColor = "#F59E0B"; break; // amber
                  case "PETS": iconBgColor = "#F5F3FF"; iconColor = "#8B5CF6"; break; // violet
                  case "GIFTS": iconBgColor = "#FFF1F2"; iconColor = "#F43F5E"; break; // rose
                  case "OTHER": iconBgColor = "#F3F4F6"; iconColor = "#6B7280"; break; // gray
                  default: break;
                }

                return (
                  <View>
                    <TouchableOpacity
                      className="rounded-2xl border-2 px-4 py-4 flex-row items-center justify-between"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: errors.category ? colors.danger : colors.border,
                      }}
                      onPress={() => setShowCategoryPicker(true)}
                    >
                      <View className="flex-row items-center">
                        <View 
                          className="w-10 h-10 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: iconBgColor }}
                        >
                          <Icon 
                            name={getCategoryIcon(subCategoryId ? getSubCategoryKey(subCategoryId) : value)} 
                            size={20} 
                            color={iconColor} 
                          />
                        </View>
                        <View>
                          <Text
                            className="font-medium"
                            style={{
                              fontSize: 14,
                              color: iconColor,
                            }}
                          >
                            {t(`categories.${value}`)}
                          </Text>
                          {subCategoryId && (
                            <Text
                              className="text-xs"
                              style={{
                                color: colors.textSecondary,
                              }}
                            >
                              {t(`categories.${getSubCategoryKey(subCategoryId)}`)}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Icon name="chevronDown" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {errors.category && (
                      <Text
                        className="text-xs mt-1 font-normal"
                        style={{
                          color: colors.danger,
                        }}
                      >
                        {errors.category.message}
                      </Text>
                    )}
                  </View>
                );
              }}
            />
          </View>

          {/* Date */}
          <DateSelector
            date={expenseDate || new Date()}
            onDateChange={handleDateChange}
            colors={colors}
            formatDate={formatDate}
          />

          {/* Receipt Image */}
          <ReceiptPicker
            imageUri={imageUri}
            onPickImage={pickImage}
            onRemoveImage={removeImage}
            colors={colors}
          />

          {/* Notes */}
          <View className="mb-5">
            <Text
              className="text-base mb-3 font-semibold"
              style={{
                color: colors.textPrimary,
              }}
            >
              Ghi chú
            </Text>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <RNTextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Thêm ghi chú ở đây..."
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
        className="absolute bottom-4 left-0 right-0 px-4 py-4"
        style={{
          backgroundColor: colors.background,
        }}
      >
        <TouchableOpacity
          className="rounded-xl py-4 items-center justify-center shadow-lg"
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
              {isEdit ? "Lưu thay đổi" : "Lưu chi phí"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <CategorySelector
        isVisible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onSelect={(category, subCategoryId) => {
          setValue("category", category, { shouldValidate: true, shouldDirty: true });
          setValue("subCategoryId", subCategoryId, { shouldValidate: true, shouldDirty: true });
        }}
        selectedCategory={watch("category")}
        selectedSubCategoryId={watch("subCategoryId")}
      />

      <PayerSelector
        visible={showPayerPicker}
        onClose={() => setShowPayerPicker(false)}
        onSelect={(userId) => setValue("paidBy", userId)}
        selectedPayerId={watch("paidBy")}
        members={allMembers}
        colors={colors}
        currentUserId={user?.id}
      />

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

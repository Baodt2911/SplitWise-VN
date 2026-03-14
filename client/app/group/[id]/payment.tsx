import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { usePreferencesStore } from "../../../src/store/preferencesStore";
import { getThemeColors } from "../../../src/utils/themeColors";
import { Icon } from "../../../src/components/common/Icon";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../src/services/api/config";
import { useToast } from "../../../src/hooks/useToast";
import { useAlertStore } from "../../../src/store/alertStore";

// ─── VietQR ──────────────────────────────────────────────────────────────────

const BANK_ID_MAP: Record<string, string> = {
  vietcombank: "VCB",
  vcb: "VCB",
  techcombank: "TCB",
  tcb: "TCB",
  "mb bank": "MB",
  mbbank: "MB",
  mb: "MB",
  bidv: "BIDV",
  vietinbank: "CTG",
  ctg: "CTG",
  agribank: "AGR",
  agr: "AGR",
  sacombank: "STB",
  stb: "STB",
  acb: "ACB",
  tpbank: "TPB",
  vpbank: "VPB",
  hdbank: "HDB",
  ocb: "OCB",
  seabank: "SEAB",
  vib: "VIB",
  msb: "MSB",
  shb: "SHB",
  lpbank: "LPB",
  "lien viet": "LPB",
  pvcombank: "PVB",
  abbank: "ABB",
  ncb: "NVB",
};

const resolveBankId = (name: string): string => {
  const key = name.toLowerCase().trim();
  for (const [k, v] of Object.entries(BANK_ID_MAP)) {
    if (key.includes(k)) return v;
  }
  return name.toUpperCase().replace(/\s/g, "");
};

const buildVietQR = (
  bankId: string,
  accountNo: string,
  accountName: string,
  amount: string,
  desc: string,
) =>
  `https://img.vietqr.io/image/${bankId}-${accountNo}-qr_only.png?amount=${Math.round(parseFloat(amount))}&addInfo=${encodeURIComponent(desc)}&accountName=${encodeURIComponent(accountName)}`;

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function PaymentScreen() {
  const theme = usePreferencesStore((s) => s.theme);
  const colors = getThemeColors(theme);
  const { success, error: errorToast } = useToast();
  const queryClient = useQueryClient();

  const {
    groupId,
    groupName,
    payerId,
    payerName,
    payeeId,
    payeeName,
    amount,
    expenseName,
  } = useLocalSearchParams<{
    groupId: string;
    groupName: string;
    payerId: string;
    payerName: string;
    payeeId: string;
    payeeName: string;
    amount: string;
    expenseName?: string;
  }>();

  const [notes, setNotes] = useState("");

  // Fetch payee's bank info from the new payment-info endpoint
  const { data: paymentInfo, isLoading: loadingPaymentInfo } = useQuery({
    queryKey: ["paymentInfo", groupId, payeeId],
    queryFn: async () => {
      const res = await apiClient.get(`/groups/${groupId}/payment-info`, {
        params: { payeeId },
      });
      return res.data.paymentInfo as {
        bankName: string | null;
        bankAccountNumber: string | null;
        bankAccountName: string | null;
      };
    },
    enabled: !!groupId && !!payeeId,
  });

  const bankName = paymentInfo?.bankName ?? "";
  const bankAccountNumber = paymentInfo?.bankAccountNumber ?? "";
  const bankAccountName = paymentInfo?.bankAccountName ?? "";
  const hasBankInfo = !!(bankName && bankAccountNumber);

  const transferNote = (() => {
    const raw = expenseName
      ? `Thanh toan chi phi "${expenseName}" nhom "${groupName}"`
      : `Thanh toan nhom "${groupName}"`;
    return raw.length > 50 ? raw.slice(0, 50) : raw;
  })();

  const qrUrl = hasBankInfo
    ? buildVietQR(
        resolveBankId(bankName),
        bankAccountNumber,
        bankAccountName,
        amount ?? "0",
        transferNote,
      )
    : null;

  const formatAmount = (val: string) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseFloat(val || "0"));

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    success(`Đã sao chép ${label}`);
  };

  // Settlement mutation
  const settleMutation = useMutation({
    mutationFn: async (paymentMethod: "BANK_TRANSFER" | "CASH") => {
      const res = await apiClient.post(`/groups/${groupId}/settlements`, {
        payeeId,
        amount,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["pendingSettlements", groupId] });
      success("Đã xác nhận thanh toán thành công!");
      router.back();
    },
    onError: (err: any) => {
      const serverMsg = err.response?.data?.message;
      errorToast(serverMsg || err.message || "Không thể xác nhận thanh toán");
    },
  });

  const { show: showAlert } = useAlertStore();

  const handleConfirm = (method: "BANK_TRANSFER" | "CASH") => {
    const label =
      method === "BANK_TRANSFER" ? "chuyển khoản ngân hàng" : "tiền mặt";
    showAlert(
      `Bạn xác nhận đã thanh toán ${formatAmount(amount ?? "0")} cho ${payeeName} bằng ${label}?`,
      "Xác nhận thanh toán",
      [
        { text: "Huỷ", style: "cancel" },
        { text: "Xác nhận", onPress: () => settleMutation.mutate(method) },
      ],
    );
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: colors.border }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full z-10"
          activeOpacity={0.7}
        >
          <Icon name="arrowLeft" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View className="absolute left-0 right-0 items-center pointer-events-none">
          <Text
            className="text-lg font-bold"
            style={{ color: colors.textPrimary }}
          >
            Thanh toán
          </Text>
        </View>

        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 180, gap: 14 }}
      >
        {/* Amount card */}
        <View
          className="items-center rounded-2xl p-6"
          style={{ backgroundColor: colors.card }}
        >
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.primary + "18" }}
          >
            <Icon name="wallet" size={30} color={colors.primary} />
          </View>
          <Text
            className="text-sm font-medium"
            style={{ color: colors.textSecondary }}
          >
            Bạn trả {payeeName}
          </Text>
          <Text
            className="text-4xl font-extrabold mt-2 mb-1"
            style={{ color: colors.primary }}
          >
            {formatAmount(amount ?? "0")}
          </Text>
          <View
            className="flex-row items-center gap-2 mt-3 px-4 py-1.5 rounded-full border"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <Icon name="users" size={15} color={colors.textSecondary} />
            <Text
              className="text-xs font-medium"
              style={{ color: colors.textSecondary }}
            >
              Từ nhóm:{" "}
              <Text className="font-bold" style={{ color: colors.textPrimary }}>
                {groupName}
              </Text>
            </Text>
          </View>
        </View>

        {/* QR / Bank info card */}
        {(hasBankInfo || loadingPaymentInfo) && (
          <View
            className="rounded-2xl p-5"
            style={{ backgroundColor: colors.card }}
          >
            <View className="flex-row items-center justify-center gap-2 mb-5">
              <Icon name="qrcode" size={20} color={colors.primary} />
              <Text
                className="text-base font-bold"
                style={{ color: colors.primary }}
              >
                Mã QR của bạn để nhận tiền
              </Text>
            </View>

            {hasBankInfo ? (
              <>
                {qrUrl && (
                  <View className="items-center mb-5">
                    <View
                      className="p-3 rounded-2xl border"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      <Image
                        source={{ uri: qrUrl }}
                        style={{ width: 220, height: 220, borderRadius: 12 }}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                )}
                {[
                  { label: "Ngân hàng", value: bankName, copy: false },
                  { label: "STK", value: bankAccountNumber, copy: true },
                  {
                    label: "Chủ TK",
                    value: bankAccountName.toUpperCase(),
                    copy: false,
                  },
                  { label: "Nội dung", value: transferNote, copy: true },
                ].map((row, idx, arr) => (
                  <View
                    key={row.label}
                    className="flex-row items-center justify-between py-3"
                    style={{
                      borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text
                      className="text-sm"
                      style={{ color: colors.textSecondary }}
                    >
                      {row.label}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Text
                        className="text-sm font-bold"
                        style={{ color: colors.textPrimary }}
                        selectable
                      >
                        {row.value}
                      </Text>
                      {row.copy && (
                        <TouchableOpacity
                          onPress={() => copyToClipboard(row.value, row.label)}
                          className="p-1"
                        >
                          <Icon name="link" size={15} color={colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <View className="items-center py-4 gap-3">
                <Icon name="creditCard" size={36} color={colors.border} />
                <Text
                  className="text-sm text-center px-4"
                  style={{ color: colors.textSecondary }}
                >
                  Bạn chưa cập nhật thông tin ngân hàng trong hồ sơ cá nhân
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/profile" as any)}
                  className="px-4 py-2 rounded-xl border"
                  style={{ borderColor: colors.primary }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: colors.primary }}
                  >
                    Cập nhật ngay
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Info hint — shown when no bank info loaded yet */}
        {!hasBankInfo && !loadingPaymentInfo && (
          <View
            className="rounded-2xl p-4 flex-row items-start gap-3"
            style={{
              backgroundColor: colors.primary + "10",
              borderWidth: 1,
              borderColor: colors.primary + "20",
            }}
          >
            <Icon name="info" size={18} color={colors.primary} />
            <Text
              className="flex-1 text-sm leading-5"
              style={{ color: colors.textSecondary }}
            >
              Liên hệ trực tiếp với{" "}
              <Text
                className="font-semibold"
                style={{ color: colors.textPrimary }}
              >
                {payeeName}
              </Text>{" "}
              để lấy thông tin chuyển khoản, sau đó xác nhận bên dưới.
            </Text>
          </View>
        )}

        {/* Notes input */}
        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: colors.card }}
        >
          <Text
            className="text-sm font-semibold mb-3"
            style={{ color: colors.textPrimary }}
          >
            Ghi chú (tuỳ chọn)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Vd: Bao ne, Trả bữa đi chơi hôm qua..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            style={{
              color: colors.textPrimary,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              fontSize: 14,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: 80,
              textAlignVertical: "top",
            }}
          />
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pt-3 pb-8 shadow-lg gap-3"
        style={{ backgroundColor: colors.background }}
      >
        <TouchableOpacity
          onPress={() => handleConfirm("BANK_TRANSFER")}
          disabled={settleMutation.isPending}
          className="flex-row items-center justify-center rounded-xl h-12 gap-2"
          style={{ backgroundColor: colors.primary }}
          activeOpacity={0.85}
        >
          {settleMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name="creditCard" size={20} color="#FFFFFF" />
              <Text
                className="text-base font-bold"
                style={{ color: "#FFFFFF" }}
              >
                Tôi đã chuyển khoản
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleConfirm("CASH")}
          disabled={settleMutation.isPending}
          className="flex-row items-center justify-center rounded-xl h-12 gap-2 border"
          style={{ borderColor: colors.border, backgroundColor: colors.card }}
          activeOpacity={0.8}
        >
          <Icon name="dollarSign" size={18} color={colors.textSecondary} />
          <Text
            className="text-sm font-bold"
            style={{ color: colors.textSecondary }}
          >
            Đã thanh toán bằng tiền mặt
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

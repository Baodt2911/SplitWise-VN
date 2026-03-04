import React, { useEffect, useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart, PieChart } from "react-native-chart-kit";
import { getThemeColors } from "../../../utils/themeColors";
import { usePreferencesStore } from "../../../store/preferencesStore";
import { useQuery } from "@tanstack/react-query";
import { getOverviewStats, exportStats } from "../../../services/api/stats.api";
import { Icon } from "../../../components/common/Icon";
import {
  getCategoryIcon,
  getCategoryLabel,
  CATEGORY_COLORS,
} from "../../../constants/category.constants";
import type { IconName } from "../../../components/common/Icon";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const screenWidth = Dimensions.get("window").width;

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0đ";
  return new Intl.NumberFormat("vi-VN").format(num) + "đ";
}

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + "tỷ";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "tr";
  if (value >= 1_000) return (value / 1_000).toFixed(0) + "k";
  return value.toString();
}

export const StatsScreen = () => {
  const theme = usePreferencesStore((state) => state.theme);
  const colors = getThemeColors(theme);

  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Applied filters (what the API uses)
  const [appliedYear, setAppliedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [appliedMonth, setAppliedMonth] = useState<number>(
    new Date().getMonth() + 1,
  );

  // Temporary state for the modal
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  const {
    data,
    isLoading,
    isRefetching: isRefreshing,
    error,
    refetch: refreshStats,
  } = useQuery({
    queryKey: ["stats", "overview", appliedMonth, appliedYear],
    queryFn: () => getOverviewStats(appliedMonth, appliedYear),
  });

  const handleRefresh = useCallback(() => {
    refreshStats();
  }, [refreshStats]);

  const handleMonthSelect = (month: number) => {
    setAppliedMonth(month);
    setAppliedYear(selectedYear); // apply the selected year only when a month is chosen
    setShowMonthPicker(false);
  };

  const openMonthPicker = () => {
    setSelectedYear(appliedYear); // reset modal to whatever year is currently applied
    setShowMonthPicker(true);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await exportStats(appliedMonth, appliedYear, "csv");

      // Since react-native's blob handling can be tricky, we'll convert the blob to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64data = (reader.result as string).split(",")[1];

        const fileName = `bao-cao-thang-${appliedMonth}-${appliedYear}.csv`;
        const FS: any = FileSystem;
        const fileUri = `${FS.documentDirectory}${fileName}`;

        await FS.writeAsStringAsync(fileUri, base64data, {
          encoding: FS.EncodingType?.Base64 || "base64",
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "text/csv",
            dialogTitle: "Lưu báo cáo chi tiêu",
            UTI: "public.comma-separated-values-text",
          });
        } else {
          Alert.alert(
            "Lỗi",
            "Tính năng chia sẻ không khả dụng trên thiết bị này",
          );
        }
      };

      reader.onerror = () => {
        Alert.alert("Lỗi", "Không thể xử lý dữ liệu báo cáo");
      };

      reader.readAsDataURL(blob);
    } catch (err: any) {
      Alert.alert("Lỗi", err?.message || "Không thể xuất báo cáo");
    } finally {
      setIsExporting(false);
    }
  };

  // Pie chart data
  const pieData = useMemo(() => {
    if (!data?.categoryBreakdown) return [];
    const total = data.categoryBreakdown.reduce(
      (sum, item) => sum + parseFloat(item.amount),
      0,
    );
    return data.categoryBreakdown
      .filter((item) => parseFloat(item.amount) > 0)
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
      .map((item) => ({
        name: getCategoryLabel(item.category),
        amount: parseFloat(item.amount),
        percentage: total > 0 ? (parseFloat(item.amount) / total) * 100 : 0,
        color: CATEGORY_COLORS[item.category] || "#607D8B",
        legendFontColor: colors.textSecondary,
        legendFontSize: 12,
        category: item.category,
      }));
  }, [data?.categoryBreakdown, colors.textSecondary]);

  // Line chart data — filter to only months with actual data or within range
  const lineChartData = useMemo(() => {
    if (!data?.trend) return null;
    const expenseValues = data.trend.expense.map((v) => parseFloat(v) || 0);
    const receivedValues = data.trend.received.map((v) => parseFloat(v) || 0);

    // Find the last month with data to trim trailing zeros
    let lastIndex = 0;
    for (let i = expenseValues.length - 1; i >= 0; i--) {
      if (expenseValues[i] > 0 || receivedValues[i] > 0) {
        lastIndex = i;
        break;
      }
    }
    // Show at least up to the last data point, minimum 3 months
    const endIdx = Math.min(
      Math.max(lastIndex + 1, 3),
      data.trend.labels.length,
    );

    // Normalize values to millions for cleaner Y-axis labels
    const expSlice = expenseValues.slice(0, endIdx).map((v) => v / 1_000_000);
    const recSlice = receivedValues.slice(0, endIdx).map((v) => v / 1_000_000);

    return {
      labels: data.trend.labels.slice(0, endIdx),
      datasets: [
        {
          data: expSlice.map((v) => Math.max(v, 0)),
          color: () => colors.primary,
          strokeWidth: 2,
        },
        {
          data: recSlice.map((v) => Math.max(v, 0)),
          color: () => colors.warning,
          strokeWidth: 2,
        },
      ],
    };
  }, [data?.trend, colors.primary, colors.warning]);

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            className="text-sm mt-3"
            style={{ color: colors.textSecondary }}
          >
            Đang tải thống kê...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <View className="flex-1 items-center justify-center px-8">
          <Icon name="alertCircle" size={48} color={colors.danger} />
          <Text
            className="text-base mt-4 text-center"
            style={{ color: colors.textSecondary }}
          >
            {error instanceof Error ? error.message : "Đã có lỗi xảy ra"}
          </Text>
          <TouchableOpacity
            onPress={() => refreshStats()}
            className="mt-4 px-6 py-2 rounded-xl"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-sm font-semibold" style={{ color: "#fff" }}>
              Thử lại
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) return null;

  const expenseChange = parseFloat(data.summary.expenseChangePercent);
  const receivedChange = parseFloat(data.summary.receivedChangePercent);

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 h-14 border-b"
        style={{
          borderColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <View className="w-10" />
        <Text
          className="text-lg font-bold flex-1 text-center"
          style={{ color: colors.textPrimary }}
        >
          Tài chính của tôi
        </Text>
        <TouchableOpacity
          className="flex-row items-center gap-1"
          onPress={openMonthPicker}
        >
          <Text className="text-sm font-bold" style={{ color: colors.primary }}>
            {data.monthLabel}
          </Text>
          <Icon name="chevronDown" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View className="gap-6">
          {/* Summary Cards */}
          <View className="flex-row gap-3">
            {/* Total Expense */}
            <View
              className="flex-1 rounded-xl p-4 shadow-lg"
              style={{
                backgroundColor: colors.surface,
              }}
            >
              <View className="flex-row items-center gap-2 mb-2">
                <Text
                  className="text-base font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Tổng chi
                </Text>
              </View>
              <Text
                className="text-2xl font-bold"
                style={{ color: colors.danger }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(data.summary.totalExpense)}
              </Text>
              {expenseChange !== 0 && (
                <View className="flex-row items-center gap-1 mt-1">
                  <Icon
                    name={expenseChange > 0 ? "chevronUp" : "chevronDown"}
                    size={14}
                    color={expenseChange > 0 ? colors.danger : colors.success}
                  />
                  <Text
                    className="text-xs font-medium"
                    style={{
                      color: expenseChange > 0 ? colors.danger : colors.success,
                    }}
                  >
                    {Math.abs(expenseChange).toFixed(0)}% so với tháng trước
                  </Text>
                </View>
              )}
            </View>

            {/* Total Received */}
            <View
              className="flex-1 rounded-xl p-4 shadow-lg"
              style={{
                backgroundColor: colors.surface,
              }}
            >
              <View className="flex-row items-center gap-2 mb-2">
                <Text
                  className="text-base font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Tổng thu
                </Text>
              </View>
              <Text
                className="text-2xl font-bold"
                style={{ color: colors.primary }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(data.summary.totalReceived)}
              </Text>
              {receivedChange !== 0 && (
                <View className="flex-row items-center gap-1 mt-1">
                  <Text
                    className="text-xs font-medium"
                    style={{
                      color:
                        receivedChange > 0 ? colors.success : colors.danger,
                    }}
                  >
                    {receivedChange > 0 ? "↑" : "↓"}{" "}
                    {Math.abs(receivedChange).toFixed(0)}% so với tháng trước
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Category Breakdown */}
          {pieData.length > 0 && (
            <View
              className="rounded-xl p-4 shadow-lg"
              style={{
                backgroundColor: colors.surface,
              }}
            >
              <View className="flex-row items-center gap-2 mb-4">
                <Text
                  className="text-xl font-bold"
                  style={{ color: colors.textPrimary }}
                >
                  Chi tiêu theo danh mục
                </Text>
              </View>

              {/* Pie Chart */}
              <View className="items-center mb-4">
                <PieChart
                  data={pieData}
                  width={screenWidth - 64}
                  height={180}
                  chartConfig={{
                    color: () => colors.textPrimary,
                  }}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="0"
                  hasLegend={false}
                  center={[(screenWidth - 64) / 4, 0]}
                />
              </View>

              {/* Category Legend */}
              <View className="gap-1">
                {pieData.map((item, index) => (
                  <View
                    key={item.category}
                    className="flex-row items-center justify-between py-2.5"
                    style={{
                      borderBottomWidth: index < pieData.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <View
                        className="w-8 h-8 rounded-lg items-center justify-center"
                        style={{ backgroundColor: item.color + "15" }}
                      >
                        <Icon
                          name={getCategoryIcon(item.category) as IconName}
                          size={16}
                          color={item.color}
                        />
                      </View>
                      <View>
                        <Text
                          className="text-sm font-medium"
                          style={{ color: colors.textPrimary }}
                        >
                          {item.name}
                        </Text>
                        <Text
                          className="text-xs"
                          style={{ color: colors.textTertiary }}
                        >
                          {item.percentage.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: colors.textPrimary }}
                    >
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Spending Trend */}
          {lineChartData && lineChartData.labels.length >= 2 && (
            <View
              className="rounded-xl p-4 shadow-lg"
              style={{
                backgroundColor: colors.surface,
              }}
            >
              <View className="flex-row items-center gap-2 mb-4">
                <Text
                  className="text-xl font-bold"
                  style={{ color: colors.textPrimary }}
                >
                  Xu hướng chi tiêu
                </Text>
              </View>

              {/* Chart Legend */}
              <View className="flex-row items-center gap-4 mb-3">
                <View className="flex-row items-center gap-1.5">
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <Text
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    Chi tiêu
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.warning }}
                  />
                  <Text
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    Thu về
                  </Text>
                </View>
              </View>

              <View style={{ marginHorizontal: -8 }}>
                <LineChart
                  data={lineChartData}
                  width={screenWidth - 48}
                  height={200}
                  yAxisSuffix="tr"
                  chartConfig={{
                    backgroundColor: colors.surface,
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    color: (opacity = 1) => colors.primary,
                    labelColor: () => colors.textTertiary,
                    propsForDots: {
                      r: "3",
                      strokeWidth: "1.5",
                      stroke: colors.primary,
                    },
                    propsForBackgroundLines: {
                      stroke: colors.border,
                      strokeDasharray: "5,5",
                    },
                  }}
                  bezier
                  withVerticalLines={false}
                  withHorizontalLabels
                  withVerticalLabels
                  fromZero
                  segments={4}
                  style={{
                    borderRadius: 12,
                  }}
                />
              </View>
            </View>
          )}

          {/* Comparison Section */}
          <View
            className="rounded-xl p-4 shadow-lg"
            style={{
              backgroundColor: colors.surface,
            }}
          >
            <View className="flex-row items-center gap-2 mb-3">
              <Text
                className="text-xl font-bold"
                style={{ color: colors.textPrimary }}
              >
                So với trung bình
              </Text>
            </View>
            <Text
              className="text-sm leading-5 mb-2"
              style={{ color: colors.textSecondary }}
            >
              Bạn chi{" "}
              <Text className="font-bold" style={{ color: colors.danger }}>
                nhiều hơn{" "}
                {parseFloat(data.comparison.percentHigherThanAverage).toFixed(
                  0,
                )}
                %
              </Text>{" "}
              so với người dùng khác.
            </Text>
            <Text
              className="text-sm leading-5"
              style={{ color: colors.textSecondary }}
            >
              Danh mục chi tiêu cao nhất của bạn là{" "}
              <Text className="font-bold" style={{ color: colors.textPrimary }}>
                {getCategoryLabel(data.comparison.topCategory)}
              </Text>
              .
            </Text>
          </View>

          {/* Export Button */}
          <TouchableOpacity
            onPress={handleExport}
            disabled={isExporting}
            className="rounded-xl flex-row items-center justify-center py-4 mt-2 shadow-sm"
            style={{
              backgroundColor: colors.primary,
              opacity: isExporting ? 0.7 : 1,
            }}
            activeOpacity={0.8}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#fff" className="mr-2" />
            ) : (
              <Icon name="download" size={20} color="#fff" />
            )}
            <Text
              className="text-base font-semibold ml-2"
              style={{ color: "#fff" }}
            >
              {isExporting ? "Đang xuất dữ liệu..." : "Xuất báo cáo tháng"}
            </Text>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View className="h-24" />
        </View>
      </ScrollView>

      {/* Month/Year Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View
          className="flex-1 justify-center items-center z-50 px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setShowMonthPicker(false)}
          />
          <View
            className="w-full rounded-3xl p-6"
            style={{ backgroundColor: colors.card }}
          >
            {/* Year Selector */}
            <View className="flex-row items-center justify-between px-6 mb-6">
              <TouchableOpacity
                onPress={() => setSelectedYear((prev) => prev - 1)}
                className="w-10 h-10 items-center justify-center rounded-full shadow-sm"
                style={{ backgroundColor: colors.surface }}
              >
                <Text
                  className="text-lg font-bold"
                  style={{ color: colors.textPrimary }}
                >
                  {"<"}
                </Text>
              </TouchableOpacity>

              <Text
                className="text-xl font-bold"
                style={{ color: colors.textPrimary }}
              >
                Năm {selectedYear}
              </Text>

              <TouchableOpacity
                onPress={() => setSelectedYear((prev) => prev + 1)}
                disabled={selectedYear >= new Date().getFullYear()}
                className="w-10 h-10 items-center justify-center rounded-full shadow-sm"
                style={[
                  { backgroundColor: colors.surface },
                  selectedYear >= new Date().getFullYear() && { opacity: 0.5 },
                ]}
              >
                <Text
                  className="text-lg font-bold"
                  style={{ color: colors.textPrimary }}
                >
                  {">"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Months Grid */}
            <View className="flex-row flex-wrap -mx-2">
              {Array.from({ length: 12 }).map((_, i) => {
                const month = i + 1;
                // Highlight if it's the currently applied month AND the modal is viewing the applied year
                const isSelected =
                  appliedMonth === month && appliedYear === selectedYear;
                const isFuture =
                  selectedYear === new Date().getFullYear() &&
                  month > new Date().getMonth() + 1;

                return (
                  <View key={month} className="w-1/3 p-2">
                    <TouchableOpacity
                      onPress={() => handleMonthSelect(month)}
                      disabled={isFuture}
                      className="py-3 items-center justify-center rounded-xl shadow-sm"
                      style={{
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surface,
                        opacity: isFuture ? 0.3 : 1,
                      }}
                    >
                      <Text
                        className="text-base font-medium"
                        style={{
                          color: isSelected ? "#FFF" : colors.textPrimary,
                        }}
                      >
                        Tháng {month}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

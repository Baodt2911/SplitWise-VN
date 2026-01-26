import fs from "fs";
import carbone from "carbone";
const data = {
  // =========================
  // THÔNG TIN THÁNG
  // =========================
  month: "01/2026",
  monthLabel: "Tháng 01/2026",

  // =========================
  // TỔNG QUAN
  // =========================
  summary: {
    totalIncome: 18500000, // Tổng thu
    totalExpense: 13250000, // Tổng chi
    balance: 5250000, // Số dư
    compareLastMonthPercent: -6.8, // % so với tháng trước
    lastMonthExpense: 14200000, // (phục vụ hiển thị nếu cần)
  },

  // =========================
  // CHI TIÊU THEO DANH MỤC
  // =========================
  categoryExpense: [
    {
      id: "food",
      name: "Ăn uống",
      amount: 4200000,
      percent: 31.7,
    },
    {
      id: "transport",
      name: "Di chuyển",
      amount: 1850000,
      percent: 14.0,
    },
    {
      id: "shopping",
      name: "Mua sắm",
      amount: 2650000,
      percent: 20.0,
    },
    {
      id: "entertainment",
      name: "Giải trí",
      amount: 1750000,
      percent: 13.2,
    },
    {
      id: "housing",
      name: "Nhà ở",
      amount: 2100000,
      percent: 15.9,
    },
    {
      id: "other",
      name: "Khác",
      amount: 650000,
      percent: 4.9,
    },
  ],

  // =========================
  // TOP DANH MỤC CHI NHIỀU NHẤT
  // =========================
  topCategories: [
    {
      rank: 1,
      name: "Ăn uống",
      amount: 4200000,
    },
    {
      rank: 2,
      name: "Mua sắm",
      amount: 2650000,
    },
    {
      rank: 3,
      name: "Nhà ở",
      amount: 2100000,
    },
  ],

  // =========================
  // XU HƯỚNG 6 THÁNG GẦN NHẤT
  // =========================
  trend6Months: [
    {
      month: "08/2025",
      label: "T08/2025",
      total: 11800000,
    },
    {
      month: "09/2025",
      label: "T09/2025",
      total: 12500000,
    },
    {
      month: "10/2025",
      label: "T10/2025",
      total: 13100000,
    },
    {
      month: "11/2025",
      label: "T11/2025",
      total: 13850000,
    },
    {
      month: "12/2025",
      label: "T12/2025",
      total: 14200000,
    },
    {
      month: "01/2026",
      label: "T01/2026",
      total: 13250000,
    },
  ],

  // =========================
  // SO SÁNH VỚI TRUNG BÌNH NGƯỜI DÙNG
  // =========================
  averageComparison: {
    user: 13250000, // chi tiêu user
    average: 10800000, // trung bình hệ thống
    diff: 2450000, // user - average
    diffPercent: 22.7, // %
    status: "HIGHER", // HIGHER | LOWER | EQUAL
  },

  // =========================
  // METADATA (OPTIONAL – RẤT HAY)
  // =========================
  meta: {
    currency: "VND",
    generatedAt: "2026-01-31T23:59:59Z",
    userId: "user_01HZX9F8KQ",
    timezone: "Asia/Ho_Chi_Minh",
  },
};

carbone.set({
  lang: "fr-fr",
  currencySource: "VND",
  currencyTarget: "VND",
  currencyRates: { VND: 2 },
});
carbone.render(
  "templates/reports/personal-report.xlsx",
  data,
  function (err, result) {
    if (err) {
      return console.log(err);
    }
    // write the result
    fs.writeFileSync("result.xlsx", result);
  },
);

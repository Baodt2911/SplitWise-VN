import { apiClient } from "./config";

export interface StatsOverviewSummary {
  totalExpense: string;
  totalReceived: string;
  expenseChangePercent: string;
  receivedChangePercent: string;
}

export interface CategoryBreakdownItem {
  category: string;
  amount: string;
}

export interface StatsOverviewTrend {
  labels: string[];
  expense: string[];
  received: string[];
}

export interface StatsOverviewComparison {
  percentHigherThanAverage: string;
  topCategory: string;
}

export interface StatsOverview {
  month: string;
  monthLabel: string;
  summary: StatsOverviewSummary;
  categoryBreakdown: CategoryBreakdownItem[];
  trend: StatsOverviewTrend;
  comparison: StatsOverviewComparison;
}

export const getOverviewStats = async (
  month?: number,
  year?: number,
): Promise<StatsOverview> => {
  const response = await apiClient.get<StatsOverview>("/stats/me/overview", {
    params: { month, year },
  });
  return response.data;
};

export interface BalanceDetail {
  fullName: string;
  payeeId: string;
  groupId: string;
  amount: string;
  type: "oweYou" | "youOwe";
}

export interface BalancesStats {
  total: {
    youOwe: string | null;
    oweYou: string | null;
  };
  details: BalanceDetail[];
}

export const getBalancesStats = async (): Promise<BalancesStats> => {
  const response = await apiClient.get<BalancesStats>("/stats/me/balances");
  return response.data;
};

export const exportStats = async (
  month?: number,
  year?: number,
  format: "csv" | "pdf" = "csv",
): Promise<any> => {
  // This might return a blob or file download link
  const response = await apiClient.get("/stats/me/export", {
    params: { month, year, format },
    responseType: "blob", // or 'arraybuffer'
  });
  return response.data;
};

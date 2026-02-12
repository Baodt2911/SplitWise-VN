import { apiClient } from "./config";

// ============ Types ============

export interface OverviewStatsParams {
  month?: number;
  year?: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number | string;
}

export interface OverviewSummary {
  totalExpense: number | string;
  totalReceived: number | string;
  expenseChangePercent: string;
  receivedChangePercent: string;
}

export interface OverviewTrend {
  labels: string[];
  expense: (number | string)[];
  received: (number | string)[];
}

export interface OverviewComparison {
  percentHigherThanAverage: string;
  topCategory: string | null;
}

export interface OverviewStatsResponse {
  month: string;
  monthLabel: string;
  summary: OverviewSummary;
  categoryBreakdown: CategoryBreakdown[];
  trend: OverviewTrend;
  comparison: OverviewComparison;
}

export interface BalanceDetail {
  fullName: string;
  payeeId: string;
  groupId: string;
  amount: number | string;
  type: "youOwe" | "oweYou";
}

export interface BalancesStatsResponse {
  total: {
    youOwe: number | string | null;
    oweYou: number | string | null;
  };
  details: BalanceDetail[];
}

// ============ API Functions ============

/**
 * Get overview statistics (monthly expenses, received, trends, etc.)
 * @param params - Optional month and year query parameters
 */
export const getOverviewStats = async (
  params?: OverviewStatsParams,
): Promise<OverviewStatsResponse> => {
  const { data } = await apiClient.get<OverviewStatsResponse>(
    "/user-stats/overview",
    {
      params,
    },
  );
  return data;
};

/**
 * Get balances statistics (who owes you, who you owe)
 */
export const getBalancesStats = async (): Promise<BalancesStatsResponse> => {
  const { data } = await apiClient.get<BalancesStatsResponse>(
    "/user-stats/balances",
  );
  return data;
};

/**
 * Export user statistics (download)
 */
export const exportStats = async (): Promise<Blob> => {
  const { data } = await apiClient.get("/user-stats/export", {
    responseType: "blob",
  });
  return data;
};

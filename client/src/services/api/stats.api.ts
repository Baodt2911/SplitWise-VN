import { apiClient } from "./config";

export interface OverviewStats {
  totalPaid: string;
  totalReceived: string; // or totalDebt/Credit based on server response structure
  totalExpenses: string;
  // user_stats.route.ts -> getOverviewStatsController
  // Assuming simple structure for now based on context
}

export const getOverviewStats = async (period: "week" | "month" | "year" = "month"): Promise<OverviewStats> => {
  const response = await apiClient.get<OverviewStats>("/stats/me/overview", {
    params: { period }
  });
  return response.data;
};

export const getBalancesStats = async (): Promise<any> => {
  const response = await apiClient.get("/stats/me/balances");
  return response.data;
};

export const exportStats = async (format: "csv" | "pdf" = "csv"): Promise<any> => {
  // This might return a blob or file download link
  const response = await apiClient.get("/stats/me/export", {
    params: { format },
    responseType: "blob" // or 'arraybuffer'
  });
  return response.data;
};

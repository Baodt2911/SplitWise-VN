export type CreateSettlementDTO = {
  payeeId: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  notes?: string;
};

export type RegisterDTO = {
  phone: string;
  password: string;
  fullName: string;
  email?: string;
};
export type LoginDTO = {
  phone: string;
  password: string;
};
export type ChangePassDTO = {
  currentPassword: string;
  newPassword: string;
};
export type UpdateProfileDTO = {
  fullName: string;
  avatarUrl: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  language: string;
  timezone: string;
  currency: string;
  isPremium: boolean;
  premiumExpiresAt: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret: string;
};

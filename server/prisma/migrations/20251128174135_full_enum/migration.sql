/*
  Warnings:

  - The `category` column on the `expenses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `split_type` column on the `expenses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `friendships` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `group_invites` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `group_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `group_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `premium_subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `payment_method` column on the `premium_subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `referrals` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `reward_type` column on the `referrals` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `settlements` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `payment_method` column on the `settlements` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `theme` column on the `user_settings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `accent_color` column on the `user_settings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `font_size` column on the `user_settings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `plan` on the `premium_subscriptions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `transaction_type` on the `user_points` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `source` on the `user_points` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "GroupMemberRole" AS ENUM ('admin', 'member');

-- CreateEnum
CREATE TYPE "GroupMemberStatus" AS ENUM ('active', 'left', 'removed');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('food', 'transport', 'entertainment', 'accommodation', 'shopping', 'other');

-- CreateEnum
CREATE TYPE "ExpenseSplitType" AS ENUM ('equal', 'exact', 'percentage', 'shares');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('pending', 'confirmed', 'rejected');

-- CreateEnum
CREATE TYPE "SettlementPaymentMethod" AS ENUM ('cash', 'bank_transfer', 'momo', 'zalopay', 'vnpay');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('pending', 'accepted', 'blocked');

-- CreateEnum
CREATE TYPE "GroupInviteStatus" AS ENUM ('pending', 'accepted', 'expired');

-- CreateEnum
CREATE TYPE "PremiumPlan" AS ENUM ('monthly', 'yearly', 'lifetime');

-- CreateEnum
CREATE TYPE "PremiumStatus" AS ENUM ('active', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "PremiumPaymentMethod" AS ENUM ('cash', 'bank_transfer', 'momo', 'zalopay', 'vnpay', 'credit_card', 'paypal', 'stripe', 'apple_pay', 'google_pay');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('pending', 'completed', 'rewarded');

-- CreateEnum
CREATE TYPE "ReferralRewardType" AS ENUM ('premium_days', 'points');

-- CreateEnum
CREATE TYPE "PointTransactionType" AS ENUM ('earn', 'redeem');

-- CreateEnum
CREATE TYPE "PointSource" AS ENUM ('complete_profile', 'add_expense', 'referral', 'check_in');

-- CreateEnum
CREATE TYPE "ThemeType" AS ENUM ('light', 'dark', 'auto');

-- CreateEnum
CREATE TYPE "FontSize" AS ENUM ('small', 'medium', 'large');

-- CreateEnum
CREATE TYPE "AccentColor" AS ENUM ('blue', 'red', 'green', 'purple', 'orange');

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "category",
ADD COLUMN     "category" "ExpenseCategory" NOT NULL DEFAULT 'other',
DROP COLUMN "split_type",
ADD COLUMN     "split_type" "ExpenseSplitType" NOT NULL DEFAULT 'equal';

-- AlterTable
ALTER TABLE "friendships" DROP COLUMN "status",
ADD COLUMN     "status" "FriendshipStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "group_invites" DROP COLUMN "status",
ADD COLUMN     "status" "GroupInviteStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "group_members" DROP COLUMN "role",
ADD COLUMN     "role" "GroupMemberRole" NOT NULL DEFAULT 'member',
DROP COLUMN "status",
ADD COLUMN     "status" "GroupMemberStatus" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "premium_subscriptions" DROP COLUMN "plan",
ADD COLUMN     "plan" "PremiumPlan" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PremiumStatus" NOT NULL DEFAULT 'active',
DROP COLUMN "payment_method",
ADD COLUMN     "payment_method" "PremiumPaymentMethod";

-- AlterTable
ALTER TABLE "referrals" DROP COLUMN "status",
ADD COLUMN     "status" "ReferralStatus" NOT NULL DEFAULT 'pending',
DROP COLUMN "reward_type",
ADD COLUMN     "reward_type" "ReferralRewardType";

-- AlterTable
ALTER TABLE "settlements" DROP COLUMN "status",
ADD COLUMN     "status" "SettlementStatus" NOT NULL DEFAULT 'pending',
DROP COLUMN "payment_method",
ADD COLUMN     "payment_method" "SettlementPaymentMethod";

-- AlterTable
ALTER TABLE "user_points" DROP COLUMN "transaction_type",
ADD COLUMN     "transaction_type" "PointTransactionType" NOT NULL,
DROP COLUMN "source",
ADD COLUMN     "source" "PointSource" NOT NULL;

-- AlterTable
ALTER TABLE "user_settings" DROP COLUMN "theme",
ADD COLUMN     "theme" "ThemeType" NOT NULL DEFAULT 'light',
DROP COLUMN "accent_color",
ADD COLUMN     "accent_color" "AccentColor" NOT NULL DEFAULT 'blue',
DROP COLUMN "font_size",
ADD COLUMN     "font_size" "FontSize" NOT NULL DEFAULT 'medium';

-- CreateIndex
CREATE INDEX "expenses_category_deleted_at_idx" ON "expenses"("category", "deleted_at");

-- CreateIndex
CREATE INDEX "friendships_user_id_status_idx" ON "friendships"("user_id", "status");

-- CreateIndex
CREATE INDEX "friendships_friend_id_status_idx" ON "friendships"("friend_id", "status");

-- CreateIndex
CREATE INDEX "group_invites_invite_token_status_idx" ON "group_invites"("invite_token", "status");

-- CreateIndex
CREATE INDEX "group_invites_group_id_status_idx" ON "group_invites"("group_id", "status");

-- CreateIndex
CREATE INDEX "group_members_group_id_status_idx" ON "group_members"("group_id", "status");

-- CreateIndex
CREATE INDEX "group_members_user_id_status_idx" ON "group_members"("user_id", "status");

-- CreateIndex
CREATE INDEX "group_members_group_id_role_idx" ON "group_members"("group_id", "role");

-- CreateIndex
CREATE INDEX "premium_subscriptions_user_id_status_idx" ON "premium_subscriptions"("user_id", "status");

-- CreateIndex
CREATE INDEX "premium_subscriptions_auto_renew_expires_at_status_idx" ON "premium_subscriptions"("auto_renew", "expires_at", "status");

-- CreateIndex
CREATE INDEX "referrals_referrer_id_status_idx" ON "referrals"("referrer_id", "status");

-- CreateIndex
CREATE INDEX "settlements_group_id_status_deleted_at_idx" ON "settlements"("group_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "settlements_payer_id_status_deleted_at_idx" ON "settlements"("payer_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "settlements_payee_id_status_deleted_at_idx" ON "settlements"("payee_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "settlements_status_deleted_at_idx" ON "settlements"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "user_points_transaction_type_idx" ON "user_points"("transaction_type");

/*
  Warnings:

  - You are about to drop the column `accent_color` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `allow_friend_requests` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `app_lock_enabled` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `app_lock_timeout` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `biometric_enabled` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `email_weekly_summary` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `font_size` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `notification_comment` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `notification_expense_added` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `notification_member_added` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `notification_payment_confirmed` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `notification_payment_request` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `show_in_search` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `show_online_status` on the `user_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_settings" DROP COLUMN "accent_color",
DROP COLUMN "allow_friend_requests",
DROP COLUMN "app_lock_enabled",
DROP COLUMN "app_lock_timeout",
DROP COLUMN "biometric_enabled",
DROP COLUMN "email_weekly_summary",
DROP COLUMN "font_size",
DROP COLUMN "notification_comment",
DROP COLUMN "notification_expense_added",
DROP COLUMN "notification_member_added",
DROP COLUMN "notification_payment_confirmed",
DROP COLUMN "notification_payment_request",
DROP COLUMN "show_in_search",
DROP COLUMN "show_online_status";

-- DropEnum
DROP TYPE "AccentColor";

-- DropEnum
DROP TYPE "FontSize";

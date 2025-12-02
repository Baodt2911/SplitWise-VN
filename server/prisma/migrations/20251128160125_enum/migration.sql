/*
  Warnings:

  - The `related_type` column on the `notifications` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `action` on the `activities` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('expense_added', 'expense_updated', 'expense_deleted', 'payment_request', 'payment_confirmed', 'payment_rejected', 'member_added', 'member_removed', 'member_left', 'member_role_changed', 'member_self_joined', 'comment_added', 'comment_mention', 'reminder');

-- CreateEnum
CREATE TYPE "RelatedType" AS ENUM ('expense', 'settlement', 'group', 'user', 'comment');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('create_group', 'update_group', 'delete_group', 'add_member', 'remove_member', 'member_left', 'change_member_role', 'self_join_group', 'add_expense', 'update_expense', 'delete_expense', 'create_payment', 'confirm_payment', 'reject_payment', 'add_comment', 'delete_comment', 'reminder_triggered');

-- AlterTable
ALTER TABLE "activities" DROP COLUMN "action",
ADD COLUMN     "action" "ActivityAction" NOT NULL;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL,
DROP COLUMN "related_type",
ADD COLUMN     "related_type" "RelatedType";

-- CreateIndex
CREATE INDEX "activities_action_idx" ON "activities"("action");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_related_type_related_id_idx" ON "notifications"("related_type", "related_id");

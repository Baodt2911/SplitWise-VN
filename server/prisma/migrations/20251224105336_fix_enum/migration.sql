/*
  Warnings:

  - The values [blue,red,green,purple,orange] on the enum `AccentColor` will be removed. If these variants are still used in the database, this will fail.
  - The values [create_group,update_group,delete_group,add_member,remove_member,member_left,change_member_role,self_join_group,add_expense,update_expense,delete_expense,create_payment,confirm_payment,reject_payment,add_comment,delete_comment,reminder_triggered,invite_member,accept_invite,reject_invite,dispute_payment,reject_dispute_payment] on the enum `ActivityAction` will be removed. If these variants are still used in the database, this will fail.
  - The values [food,transport,entertainment,accommodation,shopping,other] on the enum `ExpenseCategory` will be removed. If these variants are still used in the database, this will fail.
  - The values [equal,exact,percentage,shares] on the enum `ExpenseSplitType` will be removed. If these variants are still used in the database, this will fail.
  - The values [small,medium,large] on the enum `FontSize` will be removed. If these variants are still used in the database, this will fail.
  - The values [pending,accepted,blocked] on the enum `FriendshipStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [pending,accepted,expired] on the enum `GroupInviteStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [admin,member] on the enum `GroupMemberRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [active,left,removed] on the enum `GroupMemberStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [expense_added,expense_updated,expense_deleted,payment_request,payment_confirmed,payment_rejected,member_added,member_removed,member_left,member_role_changed,member_self_joined,comment_added,comment_mention,reminder,member_invited,member_joined,you_were_removed,payment_disputed,payment_dispute_rejected] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [complete_profile,add_expense,referral,check_in] on the enum `PointSource` will be removed. If these variants are still used in the database, this will fail.
  - The values [earn,redeem] on the enum `PointTransactionType` will be removed. If these variants are still used in the database, this will fail.
  - The values [cash,bank_transfer,momo,zalopay,vnpay,credit_card,paypal,stripe,apple_pay,google_pay] on the enum `PremiumPaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - The values [monthly,yearly,lifetime] on the enum `PremiumPlan` will be removed. If these variants are still used in the database, this will fail.
  - The values [active,cancelled,expired] on the enum `PremiumStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [premium_days,points] on the enum `ReferralRewardType` will be removed. If these variants are still used in the database, this will fail.
  - The values [pending,completed,rewarded] on the enum `ReferralStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [expense,settlement,group,user,comment] on the enum `RelatedType` will be removed. If these variants are still used in the database, this will fail.
  - The values [cash,bank_transfer,momo,zalopay,vnpay] on the enum `SettlementPaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - The values [pending,confirmed,rejected,disputed] on the enum `SettlementStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [light,dark,auto] on the enum `ThemeType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AccentColor_new" AS ENUM ('BLUE', 'RED', 'GREEN', 'PURPLE', 'ORANGE');
ALTER TABLE "public"."user_settings" ALTER COLUMN "accent_color" DROP DEFAULT;
ALTER TABLE "user_settings" ALTER COLUMN "accent_color" TYPE "AccentColor_new" USING ("accent_color"::text::"AccentColor_new");
ALTER TYPE "AccentColor" RENAME TO "AccentColor_old";
ALTER TYPE "AccentColor_new" RENAME TO "AccentColor";
DROP TYPE "public"."AccentColor_old";
ALTER TABLE "user_settings" ALTER COLUMN "accent_color" SET DEFAULT 'BLUE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ActivityAction_new" AS ENUM ('CREATE_GROUP', 'UPDATE_GROUP', 'DELETE_GROUP', 'ADD_MEMBER', 'REMOVE_MEMBER', 'MEMBER_LEFT', 'CHANGE_MEMBER_ROLE', 'SELF_JOIN_GROUP', 'INVITE_MEMBER', 'ACCEPT_INVITE', 'REJECT_INVITE', 'ADD_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE', 'CREATE_PAYMENT', 'CONFIRM_PAYMENT', 'REJECT_PAYMENT', 'DISPUTE_PAYMENT', 'REJECT_DISPUTE_PAYMENT', 'ADD_COMMENT', 'DELETE_COMMENT', 'REMINDER_TRIGGERED');
ALTER TABLE "activities" ALTER COLUMN "action" TYPE "ActivityAction_new" USING ("action"::text::"ActivityAction_new");
ALTER TYPE "ActivityAction" RENAME TO "ActivityAction_old";
ALTER TYPE "ActivityAction_new" RENAME TO "ActivityAction";
DROP TYPE "public"."ActivityAction_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ExpenseCategory_new" AS ENUM ('FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'ACCOMMODATION', 'SHOPPING', 'OTHER');
ALTER TABLE "public"."expenses" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "expenses" ALTER COLUMN "category" TYPE "ExpenseCategory_new" USING ("category"::text::"ExpenseCategory_new");
ALTER TYPE "ExpenseCategory" RENAME TO "ExpenseCategory_old";
ALTER TYPE "ExpenseCategory_new" RENAME TO "ExpenseCategory";
DROP TYPE "public"."ExpenseCategory_old";
ALTER TABLE "expenses" ALTER COLUMN "category" SET DEFAULT 'OTHER';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ExpenseSplitType_new" AS ENUM ('EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES');
ALTER TABLE "public"."expenses" ALTER COLUMN "split_type" DROP DEFAULT;
ALTER TABLE "expenses" ALTER COLUMN "split_type" TYPE "ExpenseSplitType_new" USING ("split_type"::text::"ExpenseSplitType_new");
ALTER TYPE "ExpenseSplitType" RENAME TO "ExpenseSplitType_old";
ALTER TYPE "ExpenseSplitType_new" RENAME TO "ExpenseSplitType";
DROP TYPE "public"."ExpenseSplitType_old";
ALTER TABLE "expenses" ALTER COLUMN "split_type" SET DEFAULT 'EQUAL';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "FontSize_new" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');
ALTER TABLE "public"."user_settings" ALTER COLUMN "font_size" DROP DEFAULT;
ALTER TABLE "user_settings" ALTER COLUMN "font_size" TYPE "FontSize_new" USING ("font_size"::text::"FontSize_new");
ALTER TYPE "FontSize" RENAME TO "FontSize_old";
ALTER TYPE "FontSize_new" RENAME TO "FontSize";
DROP TYPE "public"."FontSize_old";
ALTER TABLE "user_settings" ALTER COLUMN "font_size" SET DEFAULT 'MEDIUM';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "FriendshipStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');
ALTER TABLE "public"."friendships" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "friendships" ALTER COLUMN "status" TYPE "FriendshipStatus_new" USING ("status"::text::"FriendshipStatus_new");
ALTER TYPE "FriendshipStatus" RENAME TO "FriendshipStatus_old";
ALTER TYPE "FriendshipStatus_new" RENAME TO "FriendshipStatus";
DROP TYPE "public"."FriendshipStatus_old";
ALTER TABLE "friendships" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "GroupInviteStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');
ALTER TABLE "public"."group_invites" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "group_invites" ALTER COLUMN "status" TYPE "GroupInviteStatus_new" USING ("status"::text::"GroupInviteStatus_new");
ALTER TYPE "GroupInviteStatus" RENAME TO "GroupInviteStatus_old";
ALTER TYPE "GroupInviteStatus_new" RENAME TO "GroupInviteStatus";
DROP TYPE "public"."GroupInviteStatus_old";
ALTER TABLE "group_invites" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "GroupMemberRole_new" AS ENUM ('ADMIN', 'MEMBER');
ALTER TABLE "public"."group_members" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "group_members" ALTER COLUMN "role" TYPE "GroupMemberRole_new" USING ("role"::text::"GroupMemberRole_new");
ALTER TYPE "GroupMemberRole" RENAME TO "GroupMemberRole_old";
ALTER TYPE "GroupMemberRole_new" RENAME TO "GroupMemberRole";
DROP TYPE "public"."GroupMemberRole_old";
ALTER TABLE "group_members" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "GroupMemberStatus_new" AS ENUM ('ACTIVE', 'LEFT', 'REMOVED');
ALTER TABLE "public"."group_members" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "group_members" ALTER COLUMN "status" TYPE "GroupMemberStatus_new" USING ("status"::text::"GroupMemberStatus_new");
ALTER TYPE "GroupMemberStatus" RENAME TO "GroupMemberStatus_old";
ALTER TYPE "GroupMemberStatus_new" RENAME TO "GroupMemberStatus";
DROP TYPE "public"."GroupMemberStatus_old";
ALTER TABLE "group_members" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('EXPENSE_ADDED', 'EXPENSE_UPDATED', 'EXPENSE_DELETED', 'PAYMENT_REQUEST', 'PAYMENT_CONFIRMED', 'PAYMENT_REJECTED', 'PAYMENT_DISPUTED', 'PAYMENT_DISPUTE_REJECTED', 'MEMBER_ADDED', 'MEMBER_INVITED', 'MEMBER_JOINED', 'MEMBER_REMOVED', 'MEMBER_LEFT', 'MEMBER_ROLE_CHANGED', 'MEMBER_SELF_JOINED', 'YOU_WERE_REMOVED', 'COMMENT_ADDED', 'COMMENT_MENTION', 'REMINDER');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PointSource_new" AS ENUM ('COMPLETE_PROFILE', 'ADD_EXPENSE', 'REFERRAL', 'CHECK_IN');
ALTER TABLE "user_points" ALTER COLUMN "source" TYPE "PointSource_new" USING ("source"::text::"PointSource_new");
ALTER TYPE "PointSource" RENAME TO "PointSource_old";
ALTER TYPE "PointSource_new" RENAME TO "PointSource";
DROP TYPE "public"."PointSource_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PointTransactionType_new" AS ENUM ('EARN', 'REDEEM');
ALTER TABLE "user_points" ALTER COLUMN "transaction_type" TYPE "PointTransactionType_new" USING ("transaction_type"::text::"PointTransactionType_new");
ALTER TYPE "PointTransactionType" RENAME TO "PointTransactionType_old";
ALTER TYPE "PointTransactionType_new" RENAME TO "PointTransactionType";
DROP TYPE "public"."PointTransactionType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PremiumPaymentMethod_new" AS ENUM ('CASH', 'BANK_TRANSFER', 'MOMO', 'ZALOPAY', 'VNPAY', 'CREDIT_CARD', 'PAYPAL', 'STRIPE', 'APPLE_PAY', 'GOOGLE_PAY');
ALTER TABLE "premium_subscriptions" ALTER COLUMN "payment_method" TYPE "PremiumPaymentMethod_new" USING ("payment_method"::text::"PremiumPaymentMethod_new");
ALTER TYPE "PremiumPaymentMethod" RENAME TO "PremiumPaymentMethod_old";
ALTER TYPE "PremiumPaymentMethod_new" RENAME TO "PremiumPaymentMethod";
DROP TYPE "public"."PremiumPaymentMethod_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PremiumPlan_new" AS ENUM ('MONTHLY', 'YEARLY', 'LIFETIME');
ALTER TABLE "premium_subscriptions" ALTER COLUMN "plan" TYPE "PremiumPlan_new" USING ("plan"::text::"PremiumPlan_new");
ALTER TYPE "PremiumPlan" RENAME TO "PremiumPlan_old";
ALTER TYPE "PremiumPlan_new" RENAME TO "PremiumPlan";
DROP TYPE "public"."PremiumPlan_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PremiumStatus_new" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED');
ALTER TABLE "public"."premium_subscriptions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "premium_subscriptions" ALTER COLUMN "status" TYPE "PremiumStatus_new" USING ("status"::text::"PremiumStatus_new");
ALTER TYPE "PremiumStatus" RENAME TO "PremiumStatus_old";
ALTER TYPE "PremiumStatus_new" RENAME TO "PremiumStatus";
DROP TYPE "public"."PremiumStatus_old";
ALTER TABLE "premium_subscriptions" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ReferralRewardType_new" AS ENUM ('PREMIUM_DAYS', 'POINTS');
ALTER TABLE "referrals" ALTER COLUMN "reward_type" TYPE "ReferralRewardType_new" USING ("reward_type"::text::"ReferralRewardType_new");
ALTER TYPE "ReferralRewardType" RENAME TO "ReferralRewardType_old";
ALTER TYPE "ReferralRewardType_new" RENAME TO "ReferralRewardType";
DROP TYPE "public"."ReferralRewardType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ReferralStatus_new" AS ENUM ('PENDING', 'COMPLETED', 'REWARDED');
ALTER TABLE "public"."referrals" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "referrals" ALTER COLUMN "status" TYPE "ReferralStatus_new" USING ("status"::text::"ReferralStatus_new");
ALTER TYPE "ReferralStatus" RENAME TO "ReferralStatus_old";
ALTER TYPE "ReferralStatus_new" RENAME TO "ReferralStatus";
DROP TYPE "public"."ReferralStatus_old";
ALTER TABLE "referrals" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RelatedType_new" AS ENUM ('EXPENSE', 'SETTLEMENT', 'GROUP', 'USER', 'COMMENT');
ALTER TABLE "notifications" ALTER COLUMN "related_type" TYPE "RelatedType_new" USING ("related_type"::text::"RelatedType_new");
ALTER TYPE "RelatedType" RENAME TO "RelatedType_old";
ALTER TYPE "RelatedType_new" RENAME TO "RelatedType";
DROP TYPE "public"."RelatedType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SettlementPaymentMethod_new" AS ENUM ('CASH', 'BANK_TRANSFER', 'MOMO', 'ZALOPAY', 'VNPAY');
ALTER TABLE "settlements" ALTER COLUMN "payment_method" TYPE "SettlementPaymentMethod_new" USING ("payment_method"::text::"SettlementPaymentMethod_new");
ALTER TYPE "SettlementPaymentMethod" RENAME TO "SettlementPaymentMethod_old";
ALTER TYPE "SettlementPaymentMethod_new" RENAME TO "SettlementPaymentMethod";
DROP TYPE "public"."SettlementPaymentMethod_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SettlementStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'DISPUTED');
ALTER TABLE "public"."settlements" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "settlements" ALTER COLUMN "status" TYPE "SettlementStatus_new" USING ("status"::text::"SettlementStatus_new");
ALTER TYPE "SettlementStatus" RENAME TO "SettlementStatus_old";
ALTER TYPE "SettlementStatus_new" RENAME TO "SettlementStatus";
DROP TYPE "public"."SettlementStatus_old";
ALTER TABLE "settlements" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ThemeType_new" AS ENUM ('LIGHT', 'DARK', 'AUTO');
ALTER TABLE "public"."user_settings" ALTER COLUMN "theme" DROP DEFAULT;
ALTER TABLE "user_settings" ALTER COLUMN "theme" TYPE "ThemeType_new" USING ("theme"::text::"ThemeType_new");
ALTER TYPE "ThemeType" RENAME TO "ThemeType_old";
ALTER TYPE "ThemeType_new" RENAME TO "ThemeType";
DROP TYPE "public"."ThemeType_old";
ALTER TABLE "user_settings" ALTER COLUMN "theme" SET DEFAULT 'LIGHT';
COMMIT;

-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "category" SET DEFAULT 'OTHER',
ALTER COLUMN "split_type" SET DEFAULT 'EQUAL';

-- AlterTable
ALTER TABLE "friendships" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "group_invites" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "group_members" ALTER COLUMN "role" SET DEFAULT 'MEMBER',
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "premium_subscriptions" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "referrals" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "settlements" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "user_settings" ALTER COLUMN "theme" SET DEFAULT 'LIGHT',
ALTER COLUMN "accent_color" SET DEFAULT 'BLUE',
ALTER COLUMN "font_size" SET DEFAULT 'MEDIUM';

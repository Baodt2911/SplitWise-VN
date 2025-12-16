-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityAction" ADD VALUE 'dispute_payment';
ALTER TYPE "ActivityAction" ADD VALUE 'reject_dispute_payment';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'payment_disputed';
ALTER TYPE "NotificationType" ADD VALUE 'payment_dispute_rejected';

-- AlterEnum
ALTER TYPE "SettlementStatus" ADD VALUE 'disputed';

-- AlterTable
ALTER TABLE "settlements" ADD COLUMN     "dispute_reason" TEXT;

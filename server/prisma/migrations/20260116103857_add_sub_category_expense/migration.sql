-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ExpenseCategory" ADD VALUE 'HOUSING';
ALTER TYPE "ExpenseCategory" ADD VALUE 'TRAVEL';
ALTER TYPE "ExpenseCategory" ADD VALUE 'HEALTH';
ALTER TYPE "ExpenseCategory" ADD VALUE 'EDUCATION';
ALTER TYPE "ExpenseCategory" ADD VALUE 'PETS';
ALTER TYPE "ExpenseCategory" ADD VALUE 'GIFTS';

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "sub_category_id" TEXT;

-- CreateTable
CREATE TABLE "ExpenseSubCategory" (
    "id" TEXT NOT NULL,
    "parent" "ExpenseCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ExpenseSubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpenseSubCategory_parent_name_idx" ON "ExpenseSubCategory"("parent", "name");

-- CreateIndex
CREATE INDEX "ExpenseSubCategory_parent_isActive_idx" ON "ExpenseSubCategory"("parent", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseSubCategory_parent_name_key" ON "ExpenseSubCategory"("parent", "name");

-- CreateIndex
CREATE INDEX "expenses_group_id_sub_category_id_deleted_at_idx" ON "expenses"("group_id", "sub_category_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "ExpenseSubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

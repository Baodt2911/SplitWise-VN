/*
  Warnings:

  - You are about to drop the `ExpenseSubCategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_sub_category_id_fkey";

-- DropTable
DROP TABLE "ExpenseSubCategory";

-- CreateTable
CREATE TABLE "expense_sub_categories" (
    "id" TEXT NOT NULL,
    "parent" "ExpenseCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "expense_sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expense_sub_categories_parent_name_idx" ON "expense_sub_categories"("parent", "name");

-- CreateIndex
CREATE INDEX "expense_sub_categories_parent_isActive_idx" ON "expense_sub_categories"("parent", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "expense_sub_categories_parent_name_key" ON "expense_sub_categories"("parent", "name");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "expense_sub_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

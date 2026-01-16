-- DropIndex
DROP INDEX "expenses_category_deleted_at_idx";

-- DropIndex
DROP INDEX "expenses_expense_date_deleted_at_idx";

-- DropIndex
DROP INDEX "expenses_group_id_expense_date_deleted_at_idx";

-- DropIndex
DROP INDEX "expenses_paid_by_deleted_at_idx";

-- CreateIndex
CREATE INDEX "expenses_group_id_deleted_at_expense_date_idx" ON "expenses"("group_id", "deleted_at", "expense_date");

-- CreateIndex
CREATE INDEX "expenses_group_id_deleted_at_created_at_idx" ON "expenses"("group_id", "deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "expenses_group_id_category_deleted_at_idx" ON "expenses"("group_id", "category", "deleted_at");

-- CreateIndex
CREATE INDEX "expenses_group_id_paid_by_deleted_at_idx" ON "expenses"("group_id", "paid_by", "deleted_at");

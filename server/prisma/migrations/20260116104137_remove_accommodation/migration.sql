/*
  Warnings:

  - The values [ACCOMMODATION] on the enum `ExpenseCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExpenseCategory_new" AS ENUM ('FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'HOUSING', 'TRAVEL', 'SHOPPING', 'HEALTH', 'EDUCATION', 'PETS', 'GIFTS', 'OTHER');
ALTER TABLE "public"."expenses" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "ExpenseSubCategory" ALTER COLUMN "parent" TYPE "ExpenseCategory_new" USING ("parent"::text::"ExpenseCategory_new");
ALTER TABLE "expenses" ALTER COLUMN "category" TYPE "ExpenseCategory_new" USING ("category"::text::"ExpenseCategory_new");
ALTER TYPE "ExpenseCategory" RENAME TO "ExpenseCategory_old";
ALTER TYPE "ExpenseCategory_new" RENAME TO "ExpenseCategory";
DROP TYPE "public"."ExpenseCategory_old";
ALTER TABLE "expenses" ALTER COLUMN "category" SET DEFAULT 'OTHER';
COMMIT;

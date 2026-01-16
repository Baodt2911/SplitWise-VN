/*
  Warnings:

  - Added the required column `key` to the `expense_sub_categories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "expense_sub_categories" ADD COLUMN     "key" VARCHAR(100) NOT NULL;

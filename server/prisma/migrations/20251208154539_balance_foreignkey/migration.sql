/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `balances` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `balances` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "balances" DROP COLUMN "updatedAt",
ADD COLUMN     "updated_at" TIMESTAMP NOT NULL;

-- AddForeignKey
ALTER TABLE "balances" ADD CONSTRAINT "balances_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balances" ADD CONSTRAINT "balances_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balances" ADD CONSTRAINT "balances_payee_id_fkey" FOREIGN KEY ("payee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

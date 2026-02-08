/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `push_notification_tokens` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "push_notification_tokens_user_id_token_key";

-- CreateIndex
CREATE UNIQUE INDEX "push_notification_tokens_token_key" ON "push_notification_tokens"("token");

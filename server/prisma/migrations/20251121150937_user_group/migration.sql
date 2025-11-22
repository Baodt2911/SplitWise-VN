-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "allow_member_direct_add" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "allow_direct_add" BOOLEAN NOT NULL DEFAULT false;

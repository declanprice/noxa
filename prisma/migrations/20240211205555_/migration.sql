/*
  Warnings:

  - Added the required column `lastTransactionId` to the `tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "events" ADD COLUMN     "transactionId" BIGINT NOT NULL DEFAULT pg_current_xact_id();

-- AlterTable
ALTER TABLE "tokens" ADD COLUMN     "lastTransactionId" BIGINT NOT NULL;

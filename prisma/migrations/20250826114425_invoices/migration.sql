/*
  Warnings:

  - The values [USS] on the enum `Currency` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Currency_new" AS ENUM ('BRL', 'USD');
ALTER TABLE "public"."Account" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "public"."Account" ALTER COLUMN "currency" TYPE "public"."Currency_new" USING ("currency"::text::"public"."Currency_new");
ALTER TYPE "public"."Currency" RENAME TO "Currency_old";
ALTER TYPE "public"."Currency_new" RENAME TO "Currency";
DROP TYPE "public"."Currency_old";
ALTER TABLE "public"."Account" ALTER COLUMN "currency" SET DEFAULT 'BRL';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "invoiceId" TEXT;

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "closingDate" TIMESTAMP(3) NOT NULL,
    "creditCardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "public"."CreditCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_creditCardId_fkey";

-- AlterTable
ALTER TABLE "CreditCard" ADD COLUMN     "name" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

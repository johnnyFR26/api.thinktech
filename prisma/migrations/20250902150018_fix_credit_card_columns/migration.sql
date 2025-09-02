/*
  Warnings:

  - Changed the type of `expire` on the `CreditCard` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `close` on the `CreditCard` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "CreditCard" DROP COLUMN "expire",
ADD COLUMN     "expire" INTEGER NOT NULL,
DROP COLUMN "close",
ADD COLUMN     "close" INTEGER NOT NULL;

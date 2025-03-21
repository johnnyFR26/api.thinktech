/*
  Warnings:

  - The values [BR] on the enum `Currency` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `accountId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Currency_new" AS ENUM ('BRL', 'USS');
ALTER TABLE "Account" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "Account" ALTER COLUMN "currency" TYPE "Currency_new" USING ("currency"::text::"Currency_new");
ALTER TYPE "Currency" RENAME TO "Currency_old";
ALTER TYPE "Currency_new" RENAME TO "Currency";
DROP TYPE "Currency_old";
ALTER TABLE "Account" ALTER COLUMN "currency" SET DEFAULT 'BRL';
COMMIT;

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_accountId_fkey";

-- DropIndex
DROP INDEX "User_accountId_key";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "userId" INTEGER,
ALTER COLUMN "currency" SET DEFAULT 'BRL';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "accountId";

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_key" ON "Account"("userId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

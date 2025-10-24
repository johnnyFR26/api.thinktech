/*
  Warnings:

  - You are about to alter the column `currentValue` on the `Account` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(19,2)`.
  - You are about to alter the column `name` on the `Category` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `availableLimit` on the `CreditCard` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(19,2)`.
  - You are about to alter the column `limit` on the `CreditCard` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(19,2)`.
  - You are about to alter the column `company` on the `CreditCard` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `name` on the `CreditCard` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `expire` on the `CreditCard` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `close` on the `CreditCard` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `name` on the `Holding` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `tax` on the `Holding` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(19,2)`.
  - You are about to alter the column `total` on the `Holding` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(19,2)`.
  - You are about to alter the column `value` on the `Moviment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(19,2)`.
  - You are about to alter the column `title` on the `Objective` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `limit` on the `Objective` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(19,2)`.
  - You are about to alter the column `availableLimit` on the `Planning` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(19,2)`.
  - You are about to alter the column `limit` on the `Planning` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(19,2)`.
  - You are about to alter the column `title` on the `Planning` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `availableLimit` on the `PlanningCategories` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(19,2)`.
  - You are about to alter the column `limit` on the `PlanningCategories` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(19,2)`.
  - You are about to alter the column `value` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(19,2)`.
  - You are about to alter the column `destination` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `name` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `email` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `phone` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `password` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `cpf` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(11)`.
  - You are about to alter the column `originalName` on the `files` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `storedName` on the `files` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `mimeType` on the `files` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `url` on the `files` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `blobPathname` on the `files` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - A unique constraint covering the columns `[categoryId,planningId]` on the table `PlanningCategories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cpf]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Account" ALTER COLUMN "currentValue" SET DATA TYPE DECIMAL(19,2);

-- AlterTable
ALTER TABLE "public"."Category" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."CreditCard" ALTER COLUMN "availableLimit" SET DATA TYPE DECIMAL(19,2),
ALTER COLUMN "limit" SET DATA TYPE DECIMAL(19,2),
ALTER COLUMN "company" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "expire" SET DATA TYPE SMALLINT,
ALTER COLUMN "close" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "public"."Holding" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "tax" SET DATA TYPE DECIMAL(19,2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(19,2);

-- AlterTable
ALTER TABLE "public"."Moviment" ALTER COLUMN "value" SET DATA TYPE DECIMAL(19,2);

-- AlterTable
ALTER TABLE "public"."Objective" ALTER COLUMN "title" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "limit" SET DATA TYPE DECIMAL(19,2);

-- AlterTable
ALTER TABLE "public"."Planning" ALTER COLUMN "availableLimit" SET DATA TYPE DECIMAL(19,2),
ALTER COLUMN "limit" SET DATA TYPE DECIMAL(19,2),
ALTER COLUMN "title" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."PlanningCategories" ALTER COLUMN "availableLimit" SET DATA TYPE DECIMAL(19,2),
ALTER COLUMN "limit" SET DATA TYPE DECIMAL(19,2);

-- AlterTable
ALTER TABLE "public"."Transaction" ALTER COLUMN "value" SET DATA TYPE DECIMAL(19,2),
ALTER COLUMN "destination" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "password" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "cpf" SET DATA TYPE VARCHAR(11);

-- AlterTable
ALTER TABLE "public"."files" ALTER COLUMN "originalName" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "storedName" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "mimeType" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "url" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "blobPathname" SET DATA TYPE VARCHAR(500);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "public"."Account"("userId");

-- CreateIndex
CREATE INDEX "Category_accountId_idx" ON "public"."Category"("accountId");

-- CreateIndex
CREATE INDEX "Category_accountId_name_idx" ON "public"."Category"("accountId", "name");

-- CreateIndex
CREATE INDEX "CreditCard_accountId_idx" ON "public"."CreditCard"("accountId");

-- CreateIndex
CREATE INDEX "CreditCard_accountId_close_idx" ON "public"."CreditCard"("accountId", "close");

-- CreateIndex
CREATE INDEX "Holding_accountId_idx" ON "public"."Holding"("accountId");

-- CreateIndex
CREATE INDEX "Holding_dueDate_idx" ON "public"."Holding"("dueDate");

-- CreateIndex
CREATE INDEX "Holding_accountId_dueDate_idx" ON "public"."Holding"("accountId", "dueDate");

-- CreateIndex
CREATE INDEX "Invoice_creditCardId_idx" ON "public"."Invoice"("creditCardId");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "public"."Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "public"."Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_creditCardId_status_idx" ON "public"."Invoice"("creditCardId", "status");

-- CreateIndex
CREATE INDEX "Invoice_creditCardId_dueDate_idx" ON "public"."Invoice"("creditCardId", "dueDate");

-- CreateIndex
CREATE INDEX "Moviment_holdingId_idx" ON "public"."Moviment"("holdingId");

-- CreateIndex
CREATE INDEX "Moviment_type_idx" ON "public"."Moviment"("type");

-- CreateIndex
CREATE INDEX "Moviment_holdingId_type_idx" ON "public"."Moviment"("holdingId", "type");

-- CreateIndex
CREATE INDEX "Moviment_holdingId_createdAt_idx" ON "public"."Moviment"("holdingId", "createdAt");

-- CreateIndex
CREATE INDEX "Objective_accountId_idx" ON "public"."Objective"("accountId");

-- CreateIndex
CREATE INDEX "Objective_accountId_milestone_idx" ON "public"."Objective"("accountId", "milestone");

-- CreateIndex
CREATE INDEX "Planning_accountId_idx" ON "public"."Planning"("accountId");

-- CreateIndex
CREATE INDEX "Planning_month_idx" ON "public"."Planning"("month");

-- CreateIndex
CREATE INDEX "Planning_accountId_month_idx" ON "public"."Planning"("accountId", "month");

-- CreateIndex
CREATE INDEX "PlanningCategories_planningId_idx" ON "public"."PlanningCategories"("planningId");

-- CreateIndex
CREATE INDEX "PlanningCategories_categoryId_idx" ON "public"."PlanningCategories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningCategories_categoryId_planningId_key" ON "public"."PlanningCategories"("categoryId", "planningId");

-- CreateIndex
CREATE INDEX "Transaction_accountId_idx" ON "public"."Transaction"("accountId");

-- CreateIndex
CREATE INDEX "Transaction_categoryId_idx" ON "public"."Transaction"("categoryId");

-- CreateIndex
CREATE INDEX "Transaction_creditCardId_idx" ON "public"."Transaction"("creditCardId");

-- CreateIndex
CREATE INDEX "Transaction_invoiceId_idx" ON "public"."Transaction"("invoiceId");

-- CreateIndex
CREATE INDEX "Transaction_objectiveId_idx" ON "public"."Transaction"("objectiveId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "public"."Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_accountId_createdAt_idx" ON "public"."Transaction"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_type_accountId_idx" ON "public"."Transaction"("type", "accountId");

-- CreateIndex
CREATE INDEX "Transaction_accountId_type_createdAt_idx" ON "public"."Transaction"("accountId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "public"."User"("cpf");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_cpf_idx" ON "public"."User"("cpf");

-- CreateIndex
CREATE INDEX "files_categoryId_idx" ON "public"."files"("categoryId");

-- CreateIndex
CREATE INDEX "files_transactionId_idx" ON "public"."files"("transactionId");

-- CreateIndex
CREATE INDEX "files_userId_idx" ON "public"."files"("userId");

-- CreateIndex
CREATE INDEX "files_categoryId_transactionId_idx" ON "public"."files"("categoryId", "transactionId");

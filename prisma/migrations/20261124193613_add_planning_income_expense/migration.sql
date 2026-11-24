-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('fixed', 'installment', 'variable');

-- CreateTable
CREATE TABLE "PlanningIncome" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "value" DECIMAL(19,2) NOT NULL,
    "planningId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningIncome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningExpense" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "totalValue" DECIMAL(19,2) NOT NULL,
    "installments" INTEGER NOT NULL,
    "currentInstallment" INTEGER NOT NULL,
    "monthlyValue" DECIMAL(19,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "type" "ExpenseType" NOT NULL,
    "planningId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanningIncome_planningId_idx" ON "PlanningIncome"("planningId");

-- CreateIndex
CREATE INDEX "PlanningExpense_planningId_idx" ON "PlanningExpense"("planningId");

-- AddForeignKey
ALTER TABLE "PlanningIncome" ADD CONSTRAINT "PlanningIncome_planningId_fkey" FOREIGN KEY ("planningId") REFERENCES "Planning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningExpense" ADD CONSTRAINT "PlanningExpense_planningId_fkey" FOREIGN KEY ("planningId") REFERENCES "Planning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

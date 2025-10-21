-- CreateTable
CREATE TABLE "public"."Holding" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tax" DECIMAL(65,30) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "controls" JSONB,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Moviment" (
    "id" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "holdingId" TEXT NOT NULL,
    "controls" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Moviment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Holding" ADD CONSTRAINT "Holding_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Moviment" ADD CONSTRAINT "Moviment_holdingId_fkey" FOREIGN KEY ("holdingId") REFERENCES "public"."Holding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

import { TransactionType } from "@prisma/client";

export interface Transaction {
    id: string;
    value: number; // Decimal no schema
    type: TransactionType;
    destination: string;
    description: string;
    
    // Foreign Keys
    accountId: string;
    categoryId: string;
    creditCardId?: string | null; // Opcional
    objectiveId?: string | null;  // Opcional
    invoiceId?: string | null;    // Opcional
    
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}
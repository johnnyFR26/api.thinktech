import { TransactionType } from "@prisma/client";

export interface Transaction {
    id: string;
    accountId: String;
    categoryId: String;
    value: number;
    type: TransactionType;
    destination: string;
    description: string;
    createdAt: Date;
}
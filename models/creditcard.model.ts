export interface CreditCard {
    name: string;
    id: string;
    accountId: string;
    invoiceId: string;
    availableLimit: number;
    limit: number;
    company: string;
    expire: Date;
    close: Date;
    controls?: any; // JSON type
    createdAt: Date;
    updatedAt: Date;
}
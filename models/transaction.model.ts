export interface Transaction {
    id: string;
    accountId: String;
    value: number;
    type: string;
    destination: string;
    description: string;
    createdAt: Date;
}
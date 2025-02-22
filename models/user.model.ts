export interface User {
    id: number;
    name: string;
    email: string;
    password?: string;
    createdAt?: Date;
    cpf?: string;
    phone?: string;
}
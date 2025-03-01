import { Currency } from '@prisma/client'

export interface Account {
    id: String
    currentValue: number
    currency: Currency
    userId: number
    createdAt: Date
    updatedAt: Date
}
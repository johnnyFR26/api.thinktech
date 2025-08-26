import { FastifyReply, FastifyRequest } from "fastify"
import { Transaction } from "../models/transaction.model"
import { db } from "../lib/db"
import { z } from "zod"
import { TransactionType } from "@prisma/client"
import { endOfMonth, startOfMonth } from "date-fns"

const createTransactionSchema = z.object({
    value: z.number().positive(),
    description: z.string().min(1),
    type: z.nativeEnum(TransactionType),
    destination: z.string().min(1),
    accountId: z.string().uuid(),
    categoryId: z.string().uuid(),
    invoiceId: z.string().uuid(),
    creditCardId: z.string().uuid().optional(),
    objectiveId: z.string().uuid().optional()
})

const updateTransactionSchema = z.object({
    value: z.number().positive().optional(),
    description: z.string().min(1).optional(),
    type: z.nativeEnum(TransactionType).optional(),
    destination: z.string().min(1).optional(),
    categoryId: z.string().uuid().optional(),
    creditCardId: z.string().uuid().optional(),
    objectiveId: z.string().uuid().optional()
})

/**
 * @class TransactionController
 * @description Transaction controller class with enhanced features
 * @memberof module:controllers
 */
export class TransactionController {
    /**
     * Creates a new transaction with proper account balance updates
     */
    async create(request: FastifyRequest<{Body: Transaction}>, reply: FastifyReply) {
        const validation = createTransactionSchema.safeParse(request.body)
        if (!validation.success) {
            return reply.status(400).send({
                error: "Dados inválidos",
                details: validation.error.format()
            })
        }

        const data = validation.data

        try {
            // Verifica se a conta existe
            const account = await db.account.findUnique({
                where: { id: data.accountId }
            })
            if (!account) {
                return reply.status(404).send({ error: "Conta não encontrada" })
            }

            // Verifica se a categoria existe e pertence à conta
            const category = await db.category.findFirst({
                where: { 
                    id: data.categoryId,
                    accountId: data.accountId 
                }
            })
            if (!category) {
                return reply.status(404).send({ error: "Categoria não encontrada ou não pertence à conta" })
            }

            // Se creditCardId foi fornecido, verifica se existe e pertence à conta
            if (data.creditCardId) {
                const creditCard = await db.creditCard.findFirst({
                    where: { 
                        id: data.creditCardId,
                        accountId: data.accountId 
                    }
                })
                if (!creditCard) {
                    return reply.status(404).send({ error: "Cartão de crédito não encontrado ou não pertence à conta" })
                }
            }

            // Se objectiveId foi fornecido, verifica se existe e pertence à conta
            if (data.objectiveId) {
                const objective = await db.objective.findFirst({
                    where: { 
                        id: data.objectiveId,
                        accountId: data.accountId 
                    }
                })
                if (!objective) {
                    return reply.status(404).send({ error: "Objetivo não encontrado ou não pertence à conta" })
                }
            }

            const transaction = await db.transaction.create({
                data: {
                    value: data.value,
                    description: data.description,
                    type: data.type,
                    destination: data.destination,
                    accountId: data.accountId,
                    categoryId: data.categoryId,
                    creditCardId: data.creditCardId,
                    objectiveId: data.objectiveId,
                    invoiceId: data.invoiceId
                },
                include: {
                    category: true,
                    creditCard: true,
                    objective: true
                }
            })

            // Atualiza o saldo da conta apenas se não for transação de cartão de crédito
            let accountUpdate = null
            if (!data.creditCardId) {
                if (data.type === TransactionType.output) {
                    accountUpdate = await db.account.update({
                        where: { id: data.accountId },
                        data: {
                            currentValue: {
                                decrement: data.value
                            }
                        }
                    })
                } else {
                    accountUpdate = await db.account.update({
                        where: { id: data.accountId },
                        data: {
                            currentValue: {
                                increment: data.value
                            }
                        }
                    })
                }
            }

            return reply.status(201).send({
                transaction,
                accountUpdate
            })

        } catch (error) {
            console.error('Erro ao criar transação:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Retrieves all transactions with pagination
     */
    async getAll(request: FastifyRequest<{
        Querystring: {
            page?: string
            limit?: string
            type?: TransactionType
        }
    }>, reply: FastifyReply) {
        const page = parseInt(request.query.page || '1')
        const limit = parseInt(request.query.limit || '10')
        const skip = (page - 1) * limit
        const type = request.query.type

        const where = type ? { type } : {}

        try {
            const [transactions, total] = await Promise.all([
                db.transaction.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        category: true,
                        creditCard: true,
                        objective: true,
                        account: {
                            select: { id: true, currentValue: true }
                        }
                    }
                }),
                db.transaction.count({ where })
            ])

            return reply.status(200).send({
                transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            })
        } catch (error) {
            console.error('Erro ao buscar transações:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Get all transactions by account ID with optional filters
     */
    async getAllByAccountId(request: FastifyRequest<{
        Params: { accountId: string }
        Querystring: {
            page?: string
            limit?: string
            type?: TransactionType
            categoryId?: string
            startDate?: string
            endDate?: string
        }
    }>, reply: FastifyReply) {
        const { accountId } = request.params
        const page = parseInt(request.query.page || '1')
        const limit = parseInt(request.query.limit || '10')
        const skip = (page - 1) * limit

        const where: any = { accountId }
        
        if (request.query.type) {
            where.type = request.query.type
        }
        
        if (request.query.categoryId) {
            where.categoryId = request.query.categoryId
        }
        
        if (request.query.startDate && request.query.endDate) {
            where.createdAt = {
                gte: new Date(request.query.startDate),
                lte: new Date(request.query.endDate)
            }
        }

        try {
            const [transactions, total] = await Promise.all([
                db.transaction.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        category: true,
                        creditCard: true,
                        objective: true
                    }
                }),
                db.transaction.count({ where })
            ])

            return reply.status(200).send({
                transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            })
        } catch (error) {
            console.error('Erro ao buscar transações por conta:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Get transactions by category ID
     */
    async getAllByCategoryId(request: FastifyRequest<{Params: {categoryId: string}}>, reply: FastifyReply) {
        const { categoryId } = request.params
        
        try {
            const transactions = await db.transaction.findMany({
                where: { categoryId },
                orderBy: { createdAt: 'desc' },
                include: {
                    category: true,
                    creditCard: true,
                    objective: true,
                    account: {
                        select: { id: true, currentValue: true }
                    }
                }
            })
            
            return reply.status(200).send(transactions)
        } catch (error) {
            console.error('Erro ao buscar transações por categoria:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Get transactions by month with enhanced filtering
     */
    async getAllByMonth(request: FastifyRequest<{
        Body: { 
            month: number
            year?: number
            accountId: string
            type?: TransactionType
        }
    }>, reply: FastifyReply) {
        const { month, accountId, type } = request.body
        const year = request.body.year || new Date().getFullYear()

        if (month < 1 || month > 12) {
            return reply.status(400).send({ error: "Mês deve estar entre 1 e 12" })
        }

        const startDate = startOfMonth(new Date(year, month - 1))
        const endDate = endOfMonth(new Date(year, month - 1))

        const where: any = {
            accountId,
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        }

        if (type) {
            where.type = type
        }

        try {
            const transactions = await db.transaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    category: true,
                    creditCard: true,
                    objective: true
                }
            })

            // Calcula totais
            const totals = transactions.reduce((acc, transaction) => {
                if (transaction.type === TransactionType.input) {
                    acc.income += Number(transaction.value)
                } else {
                    acc.expense += Number(transaction.value)
                }
                acc.total = acc.income - acc.expense
                return acc
            }, { income: 0, expense: 0, total: 0 })

            return reply.status(200).send({
                transactions,
                totals,
                period: {
                    month,
                    year,
                    startDate,
                    endDate
                }
            })
        } catch (error) {
            console.error('Erro ao buscar transações por mês:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Get transaction by ID
     */
    async getOne(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
        const { id } = request.params

        try {
            const transaction = await db.transaction.findUnique({
                where: { id },
                include: {
                    category: true,
                    creditCard: true,
                    objective: true,
                    account: {
                        select: { id: true, currentValue: true, currency: true }
                    }
                }
            })

            if (!transaction) {
                return reply.status(404).send({ error: "Transação não encontrada" })
            }

            return reply.status(200).send(transaction)
        } catch (error) {
            console.error('Erro ao buscar transação:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Updates a transaction with proper validation and balance adjustment
     */
    async patch(request: FastifyRequest<{
        Params: {id: string}
        Body: Partial<Transaction>
    }>, reply: FastifyReply) {
        const validation = updateTransactionSchema.safeParse(request.body)
        if (!validation.success) {
            return reply.status(400).send({
                error: "Dados inválidos",
                details: validation.error.format()
            })
        }

        const data = validation.data
        const { id } = request.params

        try {
            // Busca a transação atual
            const currentTransaction = await db.transaction.findUnique({
                where: { id },
                include: { account: true }
            })

            if (!currentTransaction) {
                return reply.status(404).send({ error: "Transação não encontrada" })
            }

            // Se está alterando categoria, verifica se pertence à mesma conta
            if (data.categoryId) {
                const category = await db.category.findFirst({
                    where: { 
                        id: data.categoryId,
                        accountId: currentTransaction.accountId 
                    }
                })
                if (!category) {
                    return reply.status(404).send({ error: "Categoria não encontrada ou não pertence à conta" })
                }
            }

            const updatedTransaction = await db.transaction.update({
                where: { id },
                data,
                include: {
                    category: true,
                    creditCard: true,
                    objective: true,
                    account: {
                        select: { id: true, currentValue: true }
                    }
                }
            })

            // Se o valor ou tipo mudou e não é transação de cartão, ajusta o saldo da conta
            if ((data.value !== undefined || data.type !== undefined) && !currentTransaction.creditCardId) {
                const oldValue = Number(currentTransaction.value)
                const newValue = Number(data.value || currentTransaction.value)
                const oldType = currentTransaction.type
                const newType = data.type || currentTransaction.type

                // Reverte o efeito da transação anterior
                if (oldType === TransactionType.output) {
                    await db.account.update({
                        where: { id: currentTransaction.accountId },
                        data: { currentValue: { increment: oldValue } }
                    })
                } else {
                    await db.account.update({
                        where: { id: currentTransaction.accountId },
                        data: { currentValue: { decrement: oldValue } }
                    })
                }

                // Aplica o efeito da nova transação
                if (newType === TransactionType.output) {
                    await db.account.update({
                        where: { id: currentTransaction.accountId },
                        data: { currentValue: { decrement: newValue } }
                    })
                } else {
                    await db.account.update({
                        where: { id: currentTransaction.accountId },
                        data: { currentValue: { increment: newValue } }
                    })
                }
            }

            return reply.status(200).send(updatedTransaction)
        } catch (error) {
            console.error('Erro ao atualizar transação:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Deletes a transaction and adjusts account balance
     */
    async delete(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
        const { id } = request.params

        try {
            const transaction = await db.transaction.findUnique({
                where: { id }
            })

            if (!transaction) {
                return reply.status(404).send({ error: "Transação não encontrada" })
            }

            await db.transaction.delete({ where: { id } })

            // Ajusta o saldo da conta se não for transação de cartão
            if (!transaction.creditCardId) {
                if (transaction.type === TransactionType.output) {
                    await db.account.update({
                        where: { id: transaction.accountId },
                        data: {
                            currentValue: {
                                increment: transaction.value
                            }
                        }
                    })
                } else {
                    await db.account.update({
                        where: { id: transaction.accountId },
                        data: {
                            currentValue: {
                                decrement: transaction.value
                            }
                        }
                    })
                }
            }

            return reply.status(204).send()
        } catch (error) {
            console.error('Erro ao deletar transação:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Get transaction statistics for an account
     */
    async getStatistics(request: FastifyRequest<{
        Params: { accountId: string }
        Querystring: {
            startDate?: string
            endDate?: string
        }
    }>, reply: FastifyReply) {
        const { accountId } = request.params
        const { startDate, endDate } = request.query

        const where: any = { accountId }
        
        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        }

        try {
            const transactions = await db.transaction.findMany({
                where,
                include: { category: true }
            })

            const statistics = {
                totalTransactions: transactions.length,
                totalIncome: 0,
                totalExpense: 0,
                balance: 0,
                byCategory: {} as Record<string, { name: string, income: number, expense: number, total: number }>,
                byType: {
                    input: 0,
                    output: 0
                }
            }

            transactions.forEach(transaction => {
                const value = Number(transaction.value)
                const categoryName = transaction.category.name

                if (transaction.type === TransactionType.input) {
                    statistics.totalIncome += value
                    statistics.byType.input++
                } else {
                    statistics.totalExpense += value
                    statistics.byType.output++
                }

                if (!statistics.byCategory[categoryName]) {
                    statistics.byCategory[categoryName] = {
                        name: categoryName,
                        income: 0,
                        expense: 0,
                        total: 0
                    }
                }

                if (transaction.type === TransactionType.input) {
                    statistics.byCategory[categoryName].income += value
                } else {
                    statistics.byCategory[categoryName].expense += value
                }
                
                statistics.byCategory[categoryName].total = 
                    statistics.byCategory[categoryName].income - statistics.byCategory[categoryName].expense
            })

            statistics.balance = statistics.totalIncome - statistics.totalExpense

            return reply.status(200).send(statistics)
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }
}
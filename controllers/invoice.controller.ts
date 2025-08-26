import { FastifyReply, FastifyRequest } from "fastify"
import { Invoice } from "../models/invoice.model"
import { db } from "../lib/db"
import { z } from "zod"
import { endOfMonth, startOfMonth, addMonths } from "date-fns"

const createInvoiceSchema = z.object({
    dueDate: z.string().datetime(),
    closingDate: z.string().datetime(),
    creditCardId: z.string().uuid()
})

const updateInvoiceSchema = z.object({
    dueDate: z.string().datetime().optional(),
    closingDate: z.string().datetime().optional()
})

/**
 * @class InvoiceController
 * @description Invoice controller class with enhanced features
 * @memberof module:controllers
 */
export class InvoiceController {
    /**
     * Creates a new invoice with proper validation
     */
    async create(request: FastifyRequest<{Body: Invoice}>, reply: FastifyReply) {
        const validation = createInvoiceSchema.safeParse(request.body)
        if (!validation.success) {
            return reply.status(400).send({
                error: "Dados inválidos",
                details: validation.error.format()
            })
        }

        const data = validation.data

        try {
            // Verifica se o cartão de crédito existe
            const creditCard = await db.creditCard.findUnique({
                where: { id: data.creditCardId },
                include: { account: true }
            })
            if (!creditCard) {
                return reply.status(404).send({ error: "Cartão de crédito não encontrado" })
            }

            // Verifica se já existe uma fatura para o mesmo período
            const existingInvoice = await db.invoice.findFirst({
                where: {
                    creditCardId: data.creditCardId,
                    closingDate: new Date(data.closingDate)
                }
            })
            if (existingInvoice) {
                return reply.status(400).send({ error: "Já existe uma fatura para este período" })
            }

            const invoice = await db.invoice.create({
                data: {
                    dueDate: new Date(data.dueDate),
                    closingDate: new Date(data.closingDate),
                    creditCardId: data.creditCardId
                },
                include: {
                    creditCard: {
                        include: {
                            account: {
                                select: { id: true, currentValue: true, currency: true }
                            }
                        }
                    },
                    transactions: {
                        include: {
                            category: true
                        }
                    }
                }
            })

            return reply.status(201).send(invoice)

        } catch (error) {
            console.error('Erro ao criar fatura:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Retrieves all invoices with pagination
     */
    async getAll(request: FastifyRequest<{
        Querystring: {
            page?: string
            limit?: string
            creditCardId?: string
        }
    }>, reply: FastifyReply) {
        const page = parseInt(request.query.page || '1')
        const limit = parseInt(request.query.limit || '10')
        const skip = (page - 1) * limit

        const where: any = {}
        
        if (request.query.creditCardId) {
            where.creditCardId = request.query.creditCardId
        }

        try {
            const [invoices, total] = await Promise.all([
                db.invoice.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { dueDate: 'desc' },
                    include: {
                        creditCard: {
                            include: {
                                account: {
                                    select: { id: true, currentValue: true, currency: true }
                                }
                            }
                        },
                        transactions: {
                            include: {
                                category: true
                            }
                        }
                    }
                }),
                db.invoice.count({ where })
            ])

            // Calcula o valor total de cada fatura
            const invoicesWithTotals = invoices.map(invoice => ({
                ...invoice,
                totalValue: invoice.transactions.reduce((sum, transaction) => 
                    sum + Number(transaction.value), 0
                )
            }))

            return reply.status(200).send({
                invoices: invoicesWithTotals,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            })
        } catch (error) {
            console.error('Erro ao buscar faturas:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Get all invoices by credit card ID
     */
    async getAllByCreditCardId(request: FastifyRequest<{
        Params: { creditCardId: string }
        Querystring: {
            page?: string
            limit?: string
            year?: string
        }
    }>, reply: FastifyReply) {
        const { creditCardId } = request.params
        const page = parseInt(request.query.page || '1')
        const limit = parseInt(request.query.limit || '10')
        const skip = (page - 1) * limit

        const where: any = { creditCardId }
        
        if (request.query.year) {
            const year = parseInt(request.query.year)
            where.dueDate = {
                gte: new Date(year, 0, 1),
                lt: new Date(year + 1, 0, 1)
            }
        }

        try {
            const [invoices, total] = await Promise.all([
                db.invoice.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { dueDate: 'desc' },
                    include: {
                        creditCard: true,
                        transactions: {
                            include: {
                                category: true
                            }
                        }
                    }
                }),
                db.invoice.count({ where })
            ])

            // Calcula o valor total de cada fatura
            const invoicesWithTotals = invoices.map(invoice => ({
                ...invoice,
                totalValue: invoice.transactions.reduce((sum, transaction) => 
                    sum + Number(transaction.value), 0
                )
            }))

            return reply.status(200).send({
                invoices: invoicesWithTotals,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            })
        } catch (error) {
            console.error('Erro ao buscar faturas por cartão:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Get invoices by account ID (through credit cards)
     */
    async getAllByAccountId(request: FastifyRequest<{
        Params: { accountId: string }
        Querystring: {
            page?: string
            limit?: string
            year?: string
        }
    }>, reply: FastifyReply) {
        const { accountId } = request.params
        const page = parseInt(request.query.page || '1')
        const limit = parseInt(request.query.limit || '10')
        const skip = (page - 1) * limit

        const where: any = {
            creditCard: {
                accountId
            }
        }
        
        if (request.query.year) {
            const year = parseInt(request.query.year)
            where.dueDate = {
                gte: new Date(year, 0, 1),
                lt: new Date(year + 1, 0, 1)
            }
        }

        try {
            const [invoices, total] = await Promise.all([
                db.invoice.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { dueDate: 'desc' },
                    include: {
                        creditCard: true,
                        transactions: {
                            include: {
                                category: true
                            }
                        }
                    }
                }),
                db.invoice.count({ where })
            ])

            // Calcula o valor total de cada fatura
            const invoicesWithTotals = invoices.map(invoice => ({
                ...invoice,
                totalValue: invoice.transactions.reduce((sum, transaction) => 
                    sum + Number(transaction.value), 0
                )
            }))

            return reply.status(200).send({
                invoices: invoicesWithTotals,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            })
        } catch (error) {
            console.error('Erro ao buscar faturas por conta:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Get invoice by ID with detailed information
     */
    async getOne(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
        const { id } = request.params

        try {
            const invoice = await db.invoice.findUnique({
                where: { id },
                include: {
                    creditCard: {
                        include: {
                            account: {
                                select: { id: true, currentValue: true, currency: true }
                            }
                        }
                    },
                    transactions: {
                        include: {
                            category: true,
                            objective: true
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            })

            if (!invoice) {
                return reply.status(404).send({ error: "Fatura não encontrada" })
            }

            // Calcula informações adicionais da fatura
            const totalValue = invoice.transactions.reduce((sum, transaction) => 
                sum + Number(transaction.value), 0
            )

            const transactionsByCategory = invoice.transactions.reduce((acc, transaction) => {
                const categoryName = transaction.category.name
                if (!acc[categoryName]) {
                    acc[categoryName] = {
                        name: categoryName,
                        value: 0,
                        count: 0
                    }
                }
                acc[categoryName].value += Number(transaction.value)
                acc[categoryName].count++
                return acc
            }, {} as Record<string, { name: string, value: number, count: number }>)

            const invoiceWithDetails = {
                ...invoice,
                totalValue,
                transactionsByCategory: Object.values(transactionsByCategory),
                transactionCount: invoice.transactions.length
            }

            return reply.status(200).send(invoiceWithDetails)
        } catch (error) {
            console.error('Erro ao buscar fatura:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Updates an invoice
     */
    async patch(request: FastifyRequest<{
        Params: {id: string}
        Body: Partial<Invoice>
    }>, reply: FastifyReply) {
        const validation = updateInvoiceSchema.safeParse(request.body)
        if (!validation.success) {
            return reply.status(400).send({
                error: "Dados inválidos",
                details: validation.error.format()
            })
        }

        const data = validation.data
        const { id } = request.params

        try {
            const currentInvoice = await db.invoice.findUnique({
                where: { id }
            })

            if (!currentInvoice) {
                return reply.status(404).send({ error: "Fatura não encontrada" })
            }

            // Prepara os dados para atualização
            const updateData: any = {}
            if (data.dueDate) updateData.dueDate = new Date(data.dueDate)
            if (data.closingDate) updateData.closingDate = new Date(data.closingDate)

            const updatedInvoice = await db.invoice.update({
                where: { id },
                data: updateData,
                include: {
                    creditCard: true,
                    transactions: {
                        include: {
                            category: true
                        }
                    }
                }
            })

            const totalValue = updatedInvoice.transactions.reduce((sum, transaction) => 
                sum + Number(transaction.value), 0
            )

            return reply.status(200).send({
                ...updatedInvoice,
                totalValue
            })
        } catch (error) {
            console.error('Erro ao atualizar fatura:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Deletes an invoice (only if it has no transactions)
     */
    async delete(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
        const { id } = request.params

        try {
            const invoice = await db.invoice.findUnique({
                where: { id },
                include: {
                    transactions: true
                }
            })

            if (!invoice) {
                return reply.status(404).send({ error: "Fatura não encontrada" })
            }

            if (invoice.transactions.length > 0) {
                return reply.status(400).send({ 
                    error: "Não é possível excluir uma fatura que possui transações" 
                })
            }

            await db.invoice.delete({ where: { id } })

            return reply.status(204).send()
        } catch (error) {
            console.error('Erro ao deletar fatura:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Get invoice statistics for a credit card
     */
    async getStatistics(request: FastifyRequest<{
        Params: { creditCardId: string }
        Querystring: {
            startDate?: string
            endDate?: string
        }
    }>, reply: FastifyReply) {
        const { creditCardId } = request.params
        const { startDate, endDate } = request.query

        const where: any = { creditCardId }
        
        if (startDate && endDate) {
            where.dueDate = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        }

        try {
            const invoices = await db.invoice.findMany({
                where,
                include: {
                    transactions: {
                        include: {
                            category: true
                        }
                    }
                }
            })

            const statistics = {
                totalInvoices: invoices.length,
                totalValue: 0,
                averageValue: 0,
                highestValue: 0,
                lowestValue: 0,
                byCategory: {} as Record<string, { name: string, value: number, count: number }>,
                monthlyBreakdown: {} as Record<string, { month: string, value: number, count: number }>
            }

            const invoiceValues: number[] = []

            invoices.forEach(invoice => {
                const invoiceTotal = invoice.transactions.reduce((sum, transaction) => 
                    sum + Number(transaction.value), 0
                )
                
                invoiceValues.push(invoiceTotal)
                statistics.totalValue += invoiceTotal

                // Breakdown por categoria
                invoice.transactions.forEach(transaction => {
                    const categoryName = transaction.category.name
                    const value = Number(transaction.value)

                    if (!statistics.byCategory[categoryName]) {
                        statistics.byCategory[categoryName] = {
                            name: categoryName,
                            value: 0,
                            count: 0
                        }
                    }
                    statistics.byCategory[categoryName].value += value
                    statistics.byCategory[categoryName].count++
                })

                // Breakdown mensal
                const monthKey = invoice.dueDate.toISOString().slice(0, 7) // YYYY-MM
                if (!statistics.monthlyBreakdown[monthKey]) {
                    statistics.monthlyBreakdown[monthKey] = {
                        month: monthKey,
                        value: 0,
                        count: 0
                    }
                }
                statistics.monthlyBreakdown[monthKey].value += invoiceTotal
                statistics.monthlyBreakdown[monthKey].count++
            })

            if (invoiceValues.length > 0) {
                statistics.averageValue = statistics.totalValue / invoiceValues.length
                statistics.highestValue = Math.max(...invoiceValues)
                statistics.lowestValue = Math.min(...invoiceValues)
            }

            return reply.status(200).send(statistics)
        } catch (error) {
            console.error('Erro ao buscar estatísticas da fatura:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Generate invoice for current period based on credit card closing date
     */
    async generateCurrentInvoice(request: FastifyRequest<{
        Params: { creditCardId: string }
    }>, reply: FastifyReply) {
        const { creditCardId } = request.params

        try {
            const creditCard = await db.creditCard.findUnique({
                where: { id: creditCardId }
            })

            if (!creditCard) {
                return reply.status(404).send({ error: "Cartão de crédito não encontrado" })
            }

            const now = new Date()
            const closingDate = new Date(creditCard.close)
            const currentMonth = now.getMonth()
            const currentYear = now.getFullYear()

            // Ajusta as datas para o mês/ano atual
            const invoiceClosingDate = new Date(currentYear, currentMonth, closingDate.getDate())
            const invoiceDueDate = addMonths(invoiceClosingDate, 1)

            // Verifica se já existe fatura para este período
            const existingInvoice = await db.invoice.findFirst({
                where: {
                    creditCardId,
                    closingDate: invoiceClosingDate
                }
            })

            if (existingInvoice) {
                return reply.status(400).send({ error: "Fatura já existe para este período" })
            }

            // Cria a nova fatura
            const newInvoice = await db.invoice.create({
                data: {
                    dueDate: invoiceDueDate,
                    closingDate: invoiceClosingDate,
                    creditCardId
                },
                include: {
                    creditCard: true,
                    transactions: {
                        include: {
                            category: true
                        }
                    }
                }
            })

            return reply.status(201).send({
                ...newInvoice,
                totalValue: 0 // Nova fatura não tem transações ainda
            })

        } catch (error) {
            console.error('Erro ao gerar fatura:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Pay an invoice (mark as paid and update account balance)
     */
    async payInvoice(request: FastifyRequest<{
        Params: { id: string }
        Body: { paymentValue?: number }
    }>, reply: FastifyReply) {
        const { id } = request.params
        const { paymentValue } = request.body

        try {
            const invoice = await db.invoice.findUnique({
                where: { id },
                include: {
                    creditCard: {
                        include: {
                            account: true
                        }
                    },
                    transactions: true
                }
            })

            if (!invoice) {
                return reply.status(404).send({ error: "Fatura não encontrada" })
            }

            const totalInvoiceValue = invoice.transactions.reduce((sum, transaction) => 
                sum + Number(transaction.value), 0
            )

            const valueToDeduct = paymentValue || totalInvoiceValue

            if (valueToDeduct <= 0) {
                return reply.status(400).send({ error: "Valor de pagamento deve ser maior que zero" })
            }

            // Atualiza o saldo da conta
            await db.account.update({
                where: { id: invoice.creditCard.accountId },
                data: {
                    currentValue: {
                        decrement: valueToDeduct
                    }
                }
            })

            // Aqui você pode adicionar um campo 'paid' na tabela Invoice se necessário
            // Por enquanto, apenas retornamos a confirmação

            return reply.status(200).send({
                message: "Fatura paga com sucesso",
                paidValue: valueToDeduct,
                totalInvoiceValue,
                remainingBalance: totalInvoiceValue - valueToDeduct
            })

        } catch (error) {
            console.error('Erro ao pagar fatura:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }
}
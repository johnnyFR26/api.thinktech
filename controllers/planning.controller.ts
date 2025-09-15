import { FastifyReply, FastifyRequest } from "fastify"
import { Planning } from "@prisma/client"
import { db } from "../lib/db"
import { z } from "zod"
import { startOfMonth, endOfMonth } from "date-fns"

const createPlanningSchema = z.object({
    availableLimit: z.number().positive(),
    limit: z.number().positive(),
    month: z.string().datetime(),
    title: z.string().min(1),
    accountId: z.string().uuid(),
    categories: z.array(z.object({
        categoryId: z.string().uuid(),
        limit: z.number().positive()
    })).optional()
})

const updatePlanningSchema = z.object({
    availableLimit: z.number().positive().optional(),
    limit: z.number().positive().optional(),
    month: z.string().datetime().optional(),
    title: z.string().min(1).optional()
})

/**
 * @class PlanningController
 * @description Planning controller class with enhanced features
 * @memberof module:controllers
 */
export class PlanningController {
    /**
     * Creates a new planning with categories
     */
    async create(request: FastifyRequest<{Body: Planning & { categories?: Array<{categoryId: string, limit: number}> }}>, reply: FastifyReply) {
        const validation = createPlanningSchema.safeParse(request.body)
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

            // Verifica se já existe planejamento para o mesmo mês
            const monthStart = startOfMonth(new Date(data.month))
            const monthEnd = endOfMonth(new Date(data.month))
            
            const existingPlanning = await db.planning.findFirst({
                where: {
                    accountId: data.accountId,
                    month: {
                        gte: monthStart,
                        lte: monthEnd
                    }
                }
            })

            if (existingPlanning) {
                return reply.status(409).send({ 
                    error: "Já existe um planejamento para este mês" 
                })
            }

            // Verifica se as categorias pertencem à conta
            if (data.categories && data.categories.length > 0) {
                const categoryIds = data.categories.map(cat => cat.categoryId)
                const categories = await db.category.findMany({
                    where: {
                        id: { in: categoryIds },
                        accountId: data.accountId
                    }
                })

                if (categories.length !== categoryIds.length) {
                    return reply.status(404).send({ 
                        error: "Uma ou mais categorias não foram encontradas ou não pertencem à conta" 
                    })
                }
            }

            // Cria o planejamento
            const planning = await db.planning.create({
                data: {
                    availableLimit: data.availableLimit,
                    limit: data.limit,
                    month: new Date(data.month),
                    title: data.title,
                    accountId: data.accountId
                },
                include: {
                    planningCategories: {
                        include: {
                            category: true
                        }
                    }
                }
            })

            // Cria as categorias do planejamento se fornecidas
            if (data.categories && data.categories.length > 0) {
                const planningCategories = await Promise.all(
                    data.categories.map(cat => 
                        db.planningCategories.create({
                            data: {
                                availableLimit: cat.limit,
                                limit: cat.limit,
                                categoryId: cat.categoryId,
                                planningId: planning.id
                            },
                            include: {
                                category: true
                            }
                        })
                    )
                )

                return reply.status(201).send({
                    ...planning,
                    planningCategories
                })
            }

            return reply.status(201).send(planning)

        } catch (error) {
            console.error('Erro ao criar planejamento:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Get all plannings with pagination
     */
    async getAll(request: FastifyRequest<{
        Querystring: {
            page?: string
            limit?: string
        }
    }>, reply: FastifyReply) {
        const page = parseInt(request.query.page || '1')
        const limit = parseInt(request.query.limit || '10')
        const skip = (page - 1) * limit

        try {
            const [plannings, total] = await Promise.all([
                db.planning.findMany({
                    skip,
                    take: limit,
                    orderBy: { month: 'desc' },
                    include: {
                        account: {
                            select: { id: true, currentValue: true }
                        },
                        planningCategories: {
                            include: {
                                category: true
                            }
                        }
                    }
                }),
                db.planning.count()
            ])

            return reply.status(200).send({
                plannings,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            })
        } catch (error) {
            console.error('Erro ao buscar planejamentos:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Get all plannings by account ID
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

        const where: any = { accountId }
        
        if (request.query.year) {
            const year = parseInt(request.query.year)
            where.month = {
                gte: new Date(year, 0, 1),
                lte: new Date(year, 11, 31)
            }
        }

        try {
            const [plannings, total] = await Promise.all([
                db.planning.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { month: 'desc' },
                    include: {
                        planningCategories: {
                            include: {
                                category: true
                            }
                        }
                    }
                }),
                db.planning.count({ where })
            ])

            return reply.status(200).send({
                plannings,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            })
        } catch (error) {
            console.error('Erro ao buscar planejamentos por conta:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Get planning by month and year
     */
    async getByMonth(request: FastifyRequest<{
        Body: { 
            month: number
            year: number
            accountId: string
        }
    }>, reply: FastifyReply) {
        const { month, year, accountId } = request.body

        if (month < 1 || month > 12) {
            return reply.status(400).send({ error: "Mês deve estar entre 1 e 12" })
        }

        const startDate = startOfMonth(new Date(year, month - 1))
        const endDate = endOfMonth(new Date(year, month - 1))

        try {
            const planning = await db.planning.findFirst({
                where: {
                    accountId,
                    month: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                include: {
                    planningCategories: {
                        include: {
                            category: true
                        }
                    }
                }
            })

            if (!planning) {
                return reply.status(404).send({ error: "Planejamento não encontrado para este mês" })
            }

            // Calcula estatísticas do planejamento
            const totalCategoryLimits = planning.planningCategories.reduce(
                (sum, pc) => sum + Number(pc.limit), 0
            )

            const totalCategoryUsed = planning.planningCategories.reduce(
                (sum, pc) => sum + (Number(pc.limit) - Number(pc.availableLimit)), 0
            )

            return reply.status(200).send({
                ...planning,
                statistics: {
                    totalCategoryLimits,
                    totalCategoryUsed,
                    totalAvailable: Number(planning.availableLimit),
                    totalLimit: Number(planning.limit),
                    usagePercentage: totalCategoryLimits > 0 ? (totalCategoryUsed / totalCategoryLimits) * 100 : 0
                }
            })
        } catch (error) {
            console.error('Erro ao buscar planejamento por mês:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Get planning by ID
     */
    async getOne(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
        const { id } = request.params

        try {
            const planning = await db.planning.findUnique({
                where: { id },
                include: {
                    account: {
                        select: { id: true, currentValue: true, currency: true }
                    },
                    planningCategories: {
                        include: {
                            category: true
                        }
                    }
                }
            })

            if (!planning) {
                return reply.status(404).send({ error: "Planejamento não encontrado" })
            }

            return reply.status(200).send(planning)
        } catch (error) {
            console.error('Erro ao buscar planejamento:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Update planning
     */
    async patch(request: FastifyRequest<{
        Params: {id: string}
        Body: Partial<Planning>
    }>, reply: FastifyReply) {
        const validation = updatePlanningSchema.safeParse(request.body)
        if (!validation.success) {
            return reply.status(400).send({
                error: "Dados inválidos",
                details: validation.error.format()
            })
        }

        const data = validation.data
        const { id } = request.params

        try {
            const planning = await db.planning.findUnique({
                where: { id }
            })

            if (!planning) {
                return reply.status(404).send({ error: "Planejamento não encontrado" })
            }

            const updatedPlanning = await db.planning.update({
                where: { id },
                data: {
                    ...data,
                    month: data.month ? new Date(data.month) : undefined
                },
                include: {
                    planningCategories: {
                        include: {
                            category: true
                        }
                    }
                }
            })

            return reply.status(200).send(updatedPlanning)
        } catch (error) {
            console.error('Erro ao atualizar planejamento:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Delete planning
     */
    async delete(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
        const { id } = request.params

        try {
            const planning = await db.planning.findUnique({
                where: { id }
            })

            if (!planning) {
                return reply.status(404).send({ error: "Planejamento não encontrado" })
            }

            await db.planning.delete({ where: { id } })

            return reply.status(204).send()
        } catch (error) {
            console.error('Erro ao deletar planejamento:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Get planning progress and statistics
     */
    async getProgress(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
        const { id } = request.params

        try {
            const planning = await db.planning.findUnique({
                where: { id },
                include: {
                    planningCategories: {
                        include: {
                            category: {
                                include: {
                                    transactions: {
                                        where: {
                                            createdAt: {
                                                gte: startOfMonth(new Date()),
                                                lte: endOfMonth(new Date())
                                            },
                                            type: 'output'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })

            if (!planning) {
                return reply.status(404).send({ error: "Planejamento não encontrado" })
            }

            const progress = planning.planningCategories.map(pc => {
                const spent = pc.category.transactions.reduce(
                    (sum, transaction) => sum + Number(transaction.value), 0
                )
                const limit = Number(pc.limit)
                const available = Number(pc.availableLimit)
                
                return {
                    categoryId: pc.categoryId,
                    categoryName: pc.category.name,
                    limit,
                    spent,
                    available,
                    percentage: limit > 0 ? (spent / limit) * 100 : 0,
                    status: spent > limit ? 'exceeded' : spent > limit * 0.8 ? 'warning' : 'ok'
                }
            })

            const totalLimit = Number(planning.limit)
            const totalSpent = progress.reduce((sum, p) => sum + p.spent, 0)
            const totalAvailable = Number(planning.availableLimit)

            return reply.status(200).send({
                planning: {
                    id: planning.id,
                    title: planning.title,
                    month: planning.month
                },
                summary: {
                    totalLimit,
                    totalSpent,
                    totalAvailable,
                    percentage: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0,
                    status: totalSpent > totalLimit ? 'exceeded' : totalSpent > totalLimit * 0.8 ? 'warning' : 'ok'
                },
                categories: progress
            })
        } catch (error) {
            console.error('Erro ao buscar progresso do planejamento:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }
}
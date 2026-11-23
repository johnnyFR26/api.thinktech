import { FastifyReply, FastifyRequest } from "fastify"
import { db } from "../lib/db"
import { z } from "zod"

const createExpenseSchema = z.object({
    name: z.string().min(1),
    totalValue: z.number().positive(),
    installments: z.number().int().min(1),
    currentInstallment: z.number().int().min(1),
    startDate: z.string().datetime(),
    type: z.enum(['fixed', 'installment', 'variable']),
    planningId: z.string().uuid()
})

const updateExpenseSchema = z.object({
    name: z.string().min(1).optional(),
    totalValue: z.number().positive().optional(),
    installments: z.number().int().min(1).optional(),
    currentInstallment: z.number().int().min(1).optional(),
    startDate: z.string().datetime().optional(),
    type: z.enum(['fixed', 'installment', 'variable']).optional()
})

/**
 * @class PlanningExpenseController
 * @description Controller for planning expense CRUD operations
 */
export class PlanningExpenseController {
    /**
     * Create a new planning expense
     */
    async create(request: FastifyRequest<{Body: {name: string, totalValue: number, installments: number, currentInstallment: number, startDate: string, type: string, planningId: string}}>, reply: FastifyReply) {
        const validation = createExpenseSchema.safeParse(request.body)
        if (!validation.success) {
            return reply.status(400).send({
                error: "Dados inválidos",
                details: validation.error.format()
            })
        }

        const data = validation.data

        try {
            const planning = await db.planning.findUnique({
                where: { id: data.planningId }
            })
            if (!planning) {
                return reply.status(404).send({ error: "Planejamento não encontrado" })
            }

            const monthlyValue = data.type === 'installment'
                ? data.totalValue / data.installments
                : data.totalValue

            const expense = await db.planningExpense.create({
                data: {
                    name: data.name,
                    totalValue: data.totalValue,
                    installments: data.installments,
                    currentInstallment: data.currentInstallment,
                    monthlyValue,
                    startDate: new Date(data.startDate),
                    type: data.type,
                    planningId: data.planningId
                }
            })

            return reply.status(201).send(expense)
        } catch (error) {
            console.error('Erro ao criar despesa:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Get all expenses by planning ID
     */
    async getByPlanningId(request: FastifyRequest<{Params: {planningId: string}}>, reply: FastifyReply) {
        const { planningId } = request.params

        try {
            const expenses = await db.planningExpense.findMany({
                where: { planningId }
            })

            return reply.status(200).send(expenses)
        } catch (error) {
            console.error('Erro ao buscar despesas:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Update a planning expense
     */
    async update(request: FastifyRequest<{Params: {id: string}, Body: any}>, reply: FastifyReply) {
        const validation = updateExpenseSchema.safeParse(request.body)
        if (!validation.success) {
            return reply.status(400).send({
                error: "Dados inválidos",
                details: validation.error.format()
            })
        }

        const data = validation.data
        const { id } = request.params

        try {
            const expense = await db.planningExpense.findUnique({
                where: { id }
            })
            if (!expense) {
                return reply.status(404).send({ error: "Despesa não encontrada" })
            }

            const updateData: any = { ...data }
            if (data.startDate) {
                updateData.startDate = new Date(data.startDate)
            }

            // Recalculate monthlyValue if totalValue, installments, or type changed
            if (data.totalValue !== undefined || data.installments !== undefined || data.type !== undefined) {
                const totalValue = data.totalValue ?? Number(expense.totalValue)
                const installments = data.installments ?? expense.installments
                const type = data.type ?? expense.type

                updateData.monthlyValue = type === 'installment'
                    ? totalValue / installments
                    : totalValue
            }

            const updated = await db.planningExpense.update({
                where: { id },
                data: updateData
            })

            return reply.status(200).send(updated)
        } catch (error) {
            console.error('Erro ao atualizar despesa:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Delete a planning expense
     */
    async delete(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
        const { id } = request.params

        try {
            const expense = await db.planningExpense.findUnique({
                where: { id }
            })
            if (!expense) {
                return reply.status(404).send({ error: "Despesa não encontrada" })
            }

            await db.planningExpense.delete({ where: { id } })

            return reply.status(204).send()
        } catch (error) {
            console.error('Erro ao deletar despesa:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }
}

import { FastifyReply, FastifyRequest } from "fastify"
import { db } from "../lib/db"
import { z } from "zod"

const createIncomeSchema = z.object({
    name: z.string().min(1),
    value: z.number().positive(),
    planningId: z.string().uuid()
})

const updateIncomeSchema = z.object({
    name: z.string().min(1).optional(),
    value: z.number().positive().optional()
})

/**
 * @class PlanningIncomeController
 * @description Controller for planning income CRUD operations
 */
export class PlanningIncomeController {
    /**
     * Create a new planning income
     */
    async create(request: FastifyRequest<{Body: {name: string, value: number, planningId: string}}>, reply: FastifyReply) {
        const validation = createIncomeSchema.safeParse(request.body)
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

            const income = await db.planningIncome.create({
                data: {
                    name: data.name,
                    value: data.value,
                    planningId: data.planningId
                }
            })

            return reply.status(201).send(income)
        } catch (error) {
            console.error('Erro ao criar receita:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Get all incomes by planning ID
     */
    async getByPlanningId(request: FastifyRequest<{Params: {planningId: string}}>, reply: FastifyReply) {
        const { planningId } = request.params

        try {
            const incomes = await db.planningIncome.findMany({
                where: { planningId }
            })

            return reply.status(200).send(incomes)
        } catch (error) {
            console.error('Erro ao buscar receitas:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Update a planning income
     */
    async update(request: FastifyRequest<{Params: {id: string}, Body: {name?: string, value?: number}}>, reply: FastifyReply) {
        const validation = updateIncomeSchema.safeParse(request.body)
        if (!validation.success) {
            return reply.status(400).send({
                error: "Dados inválidos",
                details: validation.error.format()
            })
        }

        const data = validation.data
        const { id } = request.params

        try {
            const income = await db.planningIncome.findUnique({
                where: { id }
            })
            if (!income) {
                return reply.status(404).send({ error: "Receita não encontrada" })
            }

            const updated = await db.planningIncome.update({
                where: { id },
                data
            })

            return reply.status(200).send(updated)
        } catch (error) {
            console.error('Erro ao atualizar receita:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }

    /**
     * Delete a planning income
     */
    async delete(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
        const { id } = request.params

        try {
            const income = await db.planningIncome.findUnique({
                where: { id }
            })
            if (!income) {
                return reply.status(404).send({ error: "Receita não encontrada" })
            }

            await db.planningIncome.delete({ where: { id } })

            return reply.status(204).send()
        } catch (error) {
            console.error('Erro ao deletar receita:', error)
            return reply.status(500).send({ error: "Erro interno do servidor" })
        }
    }
}

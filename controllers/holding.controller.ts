import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { db } from "../lib/db";

const createHoldingSchema = z.object({
    name: z.string(),
    accountId: z.string().uuid(),
    controls: z.any().optional(),
    tax: z.number(),
    dueDate: z.date(),
    total: z.number()
})

export class HoldingController {
    async create(request: FastifyRequest<{
         Body: z.infer<typeof createHoldingSchema> 
        }>,
         reply: FastifyReply) {

        const validation = createHoldingSchema.safeParse(request.body)
        if (!validation.success) {
            return reply.status(400).send({
                error: validation.error.format()
            })
        }

        const { name, accountId, controls, tax, dueDate, total } = validation.data

        const holding = await db.holding.create({
            data: {
                name,
                controls,
                tax,
                dueDate,
                total,
                account: {
                    connect: {
                        id: accountId
                    }
                }
            }
        })

        if (!holding) {
            return reply.status(500).send('Error creating holding')
        }

        return reply.status(201).send(holding)
    }

    async getByAccountId(request: FastifyRequest<{ Params: { accountId: string } }>, reply: FastifyReply) {
        const { accountId } = request.params

        const holdings = await db.holding.findMany({
            where: {
                account: {
                    id: accountId
                }
            },
            include:{
                movimentations: true
            }
        })

        if (!holdings) {
            return reply.status(500).send('Error getting holdings')
        }

        if (holdings.length === 0) {
            return reply.status(404).send('No holdings found')
        }

        return reply.status(200).send({
            holdings
        })
    }
}
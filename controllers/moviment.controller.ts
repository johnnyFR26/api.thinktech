import { TransactionType } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { db } from "../lib/db";

const createMovimentSchema = z.object({
    value: z.number().positive(),
    type: z.nativeEnum(TransactionType),
    holdingId: z.string().uuid(),
    controls: z.any().optional(),
    accountId: z.string().uuid()
})

export class MovimentController {
    async create(request: FastifyRequest<{
        Body: z.infer<typeof createMovimentSchema>
    }>, reply: FastifyReply) {
        const validation = createMovimentSchema.safeParse(request.body)
        
        if (!validation.success) {
            return reply.status(400).send({
                error: validation.error.format()
            })
        }
        
        const { value, type, holdingId, controls, accountId } = validation.data
        
        let accountUpdate;
        let holdingUpdate;
        
        if(type === TransactionType.input) {    
            accountUpdate = await db.account.update({
                where: { id: accountId },
                data: {
                    currentValue: {
                        decrement: value
                    }
                }
            })
            
            holdingUpdate = await db.holding.update({
                where: { id: holdingId },
                data: {
                    total: {
                        increment: value
                    }
                }
            })
        } else {
            accountUpdate = await db.account.update({
                where: { id: accountId },
                data: {
                    currentValue: {
                        increment: value
                    }
                }
            })
            
            holdingUpdate = await db.holding.update({
                where: { id: holdingId },
                data: {
                    total: {
                        decrement: value
                    }
                }
            })
        }
        
        if (!accountUpdate || !holdingUpdate) {
            return reply.status(500).send({ error: "Erro ao atualizar conta ou holding" })
        }
        
        const moviment = await db.moviment.create({
            data: {
                value,
                type,
                controls,
                holding: {
                    connect: {
                        id: holdingId
                    }
                }
            }
        })
        
        if (!moviment) {
            return reply.status(500).send({ error: "Erro ao criar movimentação" })
        }
        
        return reply.status(201).send({
            moviment,
            holdingUpdate,
            accountUpdate,
            message: "Movimentação criada com sucesso",
        })
    }
    
    async getByAccountId(request: FastifyRequest<{ Params: { accountId: string } }>, reply: FastifyReply) {
        const { accountId } = request.params
        
        const moviments = await db.moviment.findMany({
            where: {
                holding: {
                    account: {
                        id: accountId
                    }
                }
            }
        })
        
        if (!moviments) {
            return reply.status(500).send('Error getting moviments')
        }
        
        if (moviments.length === 0) {
            return reply.status(404).send('No moviments found')
        }
        
        return reply.status(200).send({
            moviments
        })
    }
}
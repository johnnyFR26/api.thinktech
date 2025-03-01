import { FastifyReply, FastifyRequest } from "fastify"
import { Transaction } from "../models/transaction.model"
import { db } from "../lib/db"
import { z } from "zod"
import { TransactionType } from "@prisma/client"

const createTransactionSchema = z.object({
    value: z.number(),
    description: z.string(),
    type: z.nativeEnum(TransactionType),
    destination: z.string(),
    accountId: z.string()
})

/**
 * @class TransactionController
 * @description Transaction controller class
 * @memberof module:controllers
 * 
 * @property {function} create - Creates a new transaction.
 * @property {function} delete - Deletes a transaction by id.
 * @property {function} getAll - Retrieves all transactions.
 * @property {function} getOne - Retrieves a transaction by id.
 * @property {function} update - Updates a transaction by id.
 * 
 */
export class TransactionController{
    /**
     * Creates a new transaction.
     * 
     * @function
     * @memberof module:controllers.TransactionController
     * @param request - The incoming request.
     * @param reply - The reply to be sent back to the client.
     * 
     * @example
     * curl -X POST 'http://localhost:3000/transactions'
     * 
     * @throws {Error} If an error occurs while creating a transaction.
     * @returns {Promise<void>}
     */
    async create(request: FastifyRequest<{Body: Transaction}>, reply: FastifyReply){
        const validation = createTransactionSchema.safeParse(request.body)
        if(!validation.success){
            return reply.status(400).send({
                error: validation.error.format()
            })
        }
        const data = validation.data
        const transaction = await db.transaction.create({data})
        return reply.status(201).send(transaction)
    }

}
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
    accountId: z.string(),
    categoryId: z.string()
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
        const transaction = await db.transaction.create({
            data: {
              value: data.value,
              description: data.description,
              type: data.type,
              destination: data.destination,
              account: {
                connect: { id: data.accountId }
              },
              category: {
                connect: { id: data.categoryId }
              }
            }
          });        if(!transaction){
            return reply.status(500).send('Error creating transaction')
        }
        if(data.type == TransactionType.output){
          const accountUpdate = await db.account.update({
              where: {id: data.accountId},
              data: {
                  currentValue: {
                      decrement: data.value
                  }
              }
          })
          return reply.status(201).send({transaction, accountUpdate})

        }else{
            const accountUpdate = await db.account.update({
                where: {id: data.accountId},
                data: {
                    currentValue: {
                        increment: data.value
                    }
                }
            })
            return reply.status(201).send({transaction, accountUpdate})
        }
    }


    /**
     * Retrieves all transactions.
     * 
     * @function
     * @memberof module:controllers.TransactionController
     * @param request - The incoming request.
     * @param reply - The reply to be sent back to the client.
     * 
     * @example
     * curl -X GET 'http://localhost:3000/transactions'
     * 
     * @throws {Error} If an error occurs while retrieving transactions.
     * @returns {Promise<void>}
     */
    async getAll(request: FastifyRequest, reply: FastifyReply){
        const transactions = await db.transaction.findMany()
        return reply.status(200).send(transactions)
    }

    async getAllByAccountId(request: FastifyRequest<{Params: {accountId: string}}>, reply: FastifyReply){
        const accountId = request.params.accountId
        const transactions = await db.transaction.findMany({where: {accountId}})
        return reply.status(200).send(transactions)
    }
    async getAllByCategoryId(request: FastifyRequest<{Params: {categoryId: string}}>, reply: FastifyReply){
        const categoryId = request.params.categoryId
        const transactions = await db.transaction.findMany({where: {categoryId}})
        return reply.status(200).send(transactions)
    }
}
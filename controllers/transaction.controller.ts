import { FastifyReply, FastifyRequest } from "fastify"
import { Transaction } from "../models/transaction.model"
import { db } from "../lib/db"
import { z } from "zod"
import { TransactionType } from "@prisma/client"
import { endOfMonth, startOfMonth } from "date-fns"

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
        const transactions = await db.transaction.findMany({where: {accountId}, include: {category: true}})
        return reply.status(200).send(transactions)
    }
    async getAllByCategoryId(request: FastifyRequest<{Params: {categoryId: string}}>, reply: FastifyReply){
        const categoryId = request.params.categoryId
        const transactions = await db.transaction.findMany({where: {categoryId}, include: {category: true}})
        return reply.status(200).send(transactions)
    }

    /**
     * Retrieves all transactions for a specific account within a given month.
     * 
     * @function
     * @memberof module:controllers.TransactionController
     * @param request - The incoming request containing the month and accountId in the request body.
     * @param reply - The reply to be sent back to the client.
     * 
     * @example
     * curl -X POST 'http://localhost:3000/transactions/by-month' 
     * -H 'Content-Type: application/json' 
     * -d '{ "month": 5, "accountId": "some-account-id" }'
     * 
     * @throws {Error} If an error occurs while retrieving transactions.
     * @returns {Promise<void>}
     */
    async getAllByMonth(
    request: FastifyRequest<{ Body: { 
        month: number,
        accountId: string
    } }>,
    reply: FastifyReply
    ) {
    const month = request.body.month;
    const now = new Date();
    const year = now.getFullYear();

    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    const transactions = await db.transaction.findMany({
        where: {
        accountId: request.body.accountId,
        createdAt: {
            gte: startDate,
            lte: endDate,
        },
        },
    });

    return reply.status(200).send(transactions);
    }

}
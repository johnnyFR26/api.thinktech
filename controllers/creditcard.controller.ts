import { FastifyReply, FastifyRequest } from "fastify"
import { CreditCard } from "../models/creditcard.model"
import { db } from "../lib/db"
import { z } from "zod"

const createCreditCardSchema = z.object({
    availableLimit: z.number(),
    limit: z.number(),
    company: z.string(),
    expire: z.string().transform((str) => new Date(str)),
    close: z.string().transform((str) => new Date(str)),
    accountId: z.string(),
    controls: z.any().optional()
})

const updateCreditCardSchema = z.object({
    availableLimit: z.number().optional(),
    limit: z.number().optional(),
    company: z.string().optional(),
    expire: z.string().transform((str) => new Date(str)).optional(),
    close: z.string().transform((str) => new Date(str)).optional(),
    controls: z.any().optional()
})

/**
 * @class CreditCardController
 * @description Credit Card controller class
 * @memberof module:controllers
 * 
 * @property {function} create - Creates a new credit card.
 * @property {function} delete - Deletes a credit card by id.
 * @property {function} getAll - Retrieves all credit cards.
 * @property {function} getOne - Retrieves a credit card by id.
 * @property {function} getAllByAccountId - Retrieves all credit cards by account id.
 * @property {function} patch - Updates a credit card by id.
 * @property {function} updateLimit - Updates available limit of a credit card.
 * 
 */
export class CreditCardController {
    /**
     * Creates a new credit card.
     * 
     * @function
     * @memberof module:controllers.CreditCardController
     * @param request - The incoming request.
     * @param reply - The reply to be sent back to the client.
     * 
     * @example
     * curl -X POST 'http://localhost:3000/creditcards'
     * -H 'Content-Type: application/json'
     * -d '{ "availableLimit": 5000, "limit": 5000, "company": "Visa", "expire": "2027-12-31", "close": "2025-01-15", "accountId": "some-account-id" }'
     * 
     * @throws {Error} If an error occurs while creating a credit card.
     * @returns {Promise<void>}
     */
    async create(request: FastifyRequest<{Body: CreditCard}>, reply: FastifyReply) {
        const validation = createCreditCardSchema.safeParse(request.body)
        if (!validation.success) {
            return reply.status(400).send({
                error: validation.error.format()
            })
        }
        const data = validation.data
        
        const creditCard = await db.creditCard.create({
            data: {
                availableLimit: data.availableLimit,
                limit: data.limit,
                company: data.company,
                expire: data.expire,
                close: data.close,
                controls: data.controls,
                account: {
                    connect: { id: data.accountId }
                }
            }
        })
        
        if (!creditCard) {
            return reply.status(500).send('Error creating credit card')
        }
        
        return reply.status(201).send(creditCard)
    }

    /**
     * Retrieves all credit cards.
     * 
     * @function
     * @memberof module:controllers.CreditCardController
     * @param request - The incoming request.
     * @param reply - The reply to be sent back to the client.
     * 
     * @example
     * curl -X GET 'http://localhost:3000/creditcards'
     * 
     * @throws {Error} If an error occurs while retrieving credit cards.
     * @returns {Promise<void>}
     */
    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const creditCards = await db.creditCard.findMany({
            include: {
                account: true,
                invoices: true,
                transactions: true
            }
        })
        return reply.status(200).send(creditCards)
    }

    /**
     * Retrieves a credit card by ID.
     * 
     * @function
     * @memberof module:controllers.CreditCardController
     * @param request - The incoming request containing the credit card ID.
     * @param reply - The reply to be sent back to the client.
     * 
     * @example
     * curl -X GET 'http://localhost:3000/creditcards/{id}'
     * 
     * @throws {Error} If an error occurs while retrieving the credit card.
     * @returns {Promise<void>}
     */
    async getOne(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
        const creditCard = await db.creditCard.findUnique({
            where: { id: request.params.id },
            include: {
                account: true,
                invoices: true,
                transactions: true
            }
        })
        
        if (!creditCard) {
            return reply.status(404).send('Credit card not found')
        }
        
        return reply.status(200).send(creditCard)
    }

    /**
     * Retrieves all credit cards by account ID.
     * 
     * @function
     * @memberof module:controllers.CreditCardController
     * @param request - The incoming request containing the account ID.
     * @param reply - The reply to be sent back to the client.
     * 
     * @example
     * curl -X GET 'http://localhost:3000/creditcards/account/{accountId}'
     * 
     * @throws {Error} If an error occurs while retrieving credit cards.
     * @returns {Promise<void>}
     */
    async getAllByAccountId(request: FastifyRequest<{Params: {accountId: string}}>, reply: FastifyReply) {
        const accountId = request.params.accountId
        const creditCards = await db.creditCard.findMany({
            where: { accountId },
            include: {
                invoices: true,
                transactions: true
            }
        })
        return reply.status(200).send(creditCards)
    }

    /**
     * Updates a credit card by ID.
     * 
     * @function
     * @memberof module:controllers.CreditCardController
     * @param request - The incoming request containing the credit card ID and updated data.
     * @param reply - The reply to be sent back to the client.
     * 
     * @example
     * curl -X PATCH 'http://localhost:3000/creditcards/{id}'
     * -H 'Content-Type: application/json'
     * -d '{ "availableLimit": 4500, "company": "Mastercard" }'
     * 
     * @throws {Error} If an error occurs while updating the credit card.
     * @returns {Promise<void>}
     */
    async patch(request: FastifyRequest<{Params: {id: string}, Body: Partial<CreditCard>}>, reply: FastifyReply) {
        const validation = updateCreditCardSchema.safeParse(request.body)
        if (!validation.success) {
            return reply.status(400).send({
                error: validation.error.format()
            })
        }
        const data = validation.data

        const creditCard = await db.creditCard.update({
            where: { id: request.params.id },
            data: {
                ...data
            }
        })

        if (!creditCard) {
            return reply.status(500).send('Error updating credit card')
        }
        
        return reply.status(200).send(creditCard)
    }

    /**
     * Updates the available limit of a credit card after a transaction.
     * 
     * @function
     * @memberof module:controllers.CreditCardController
     * @param request - The incoming request containing the credit card ID and transaction value.
     * @param reply - The reply to be sent back to the client.
     * 
     * @example
     * curl -X PATCH 'http://localhost:3000/creditcards/{id}/limit'
     * -H 'Content-Type: application/json'
     * -d '{ "value": 100.50, "operation": "decrease" }'
     * 
     * @throws {Error} If an error occurs while updating the credit card limit.
     * @returns {Promise<void>}
     */
    async updateLimit(
        request: FastifyRequest<{
            Params: {id: string}, 
            Body: {value: number, operation: 'increase' | 'decrease'}
        }>, 
        reply: FastifyReply
    ) {
        const { value, operation } = request.body
        
        const updateData = operation === 'decrease' 
            ? { availableLimit: { decrement: value } }
            : { availableLimit: { increment: value } }

        const creditCard = await db.creditCard.update({
            where: { id: request.params.id },
            data: updateData
        })

        if (!creditCard) {
            return reply.status(500).send('Error updating credit card limit')
        }

        return reply.status(200).send(creditCard)
    }

    /**
     * Deletes a credit card by ID.
     * 
     * @function
     * @memberof module:controllers.CreditCardController
     * @param request - The incoming request containing the ID of the credit card to be deleted.
     * @param reply - The reply to be sent back to the client.
     * 
     * @example
     * curl -X DELETE 'http://localhost:3000/creditcards/{id}'
     * 
     * @throws {Error} If an error occurs while deleting the credit card.
     * @returns {Promise<void>}
     */
    async delete(request: FastifyRequest<{Params: {id: string}}>, reply: FastifyReply) {
        const creditCard = await db.creditCard.delete({
            where: { id: request.params.id }
        })
        
        if (!creditCard) {
            return reply.status(500).send('Error deleting credit card')
        }
        
        return reply.status(204).send()
    }
}
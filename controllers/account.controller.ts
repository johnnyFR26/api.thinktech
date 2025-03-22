import { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../lib/db";
import { Account } from "../models/account.model";
import { z } from "zod";
import { Currency } from "@prisma/client";

const createAccountSchema = z.object({
    currentValue: z.number().nullable(),
    currency: z.nativeEnum(Currency),
})

/**
 * Controller for account-related operations
 * 
 * @class
 * @memberof module:controllers
 * 
 * @property {function} getAll - Retrieves all accounts.
 * @property {function} create - Creates a new account.
 * @property {function} deletebyId - Deletes an account by ID.
 * @property {function} update - Updates an account by ID.
 * @property {function} getOne - Retrieves an account by ID.
 *
*/
export class AccountController {


    /**
     * Retrieves all accounts.
     *
     * @function
     * @memberof module:controllers.AccountController
     * @param request - The incoming request.
     * @param reply - The reply to be sent back to the client.
     *
     * @example
     * curl -X GET 'http://localhost:3000/accounts'
     *
     * @throws {Error} If an error occurs while retrieving accounts.
     * @returns {Promise<void>}
     */
    async getAll(request: FastifyRequest, reply: FastifyReply) {
        request.log.info('Retrieving all accounts')
        const accounts = await db.account.findMany()

        if(!accounts){
            return reply.status(404).send('Accounts not found')
        }

        return reply.status(200).send(accounts)
    }





    /**
     * Creates a new account.
     *
     * @function
     * @memberof module:controllers.AccountController
     * @param request - The incoming request containing the account data and the email of the user to whom the account will be associated.
     * @param reply - The reply to be sent back to the client.
     *
     * @example
     * curl -X POST 'http://localhost:3000/accounts?email={email}' 
     * -H 'Content-Type: application/json' 
     * -d '{ "currentValue": 0.0, "currency": "BRL" }'
     *
     * @throws {Error} If an error occurs while creating an account.
     * @returns {Promise<void>}
     */
    async create(request: FastifyRequest<{
        Body: Account,
        Params: {email: string}
    }>, reply: FastifyReply) {

        const validation = createAccountSchema.safeParse(request.body)

        if(!validation.success) {
            return reply.status(400).send({
                error: validation.error.format()
            })
        }

        const data = validation.data

        const verifyEmail = z.object({email: z.string().email()}).safeParse(request.params)

        if(!verifyEmail.success) {
            return reply.status(400).send({
                error: verifyEmail.error.format()
            })
        }

        const email = verifyEmail.data.email

        const user = await db.user.findUnique({where: {email}})
        if(!user) {
            return reply.status(404).send('User not found')
        }

        try {
            const account = await db.account.create({
                data: {
                    currentValue: Number(data.currentValue),
                    currency: data.currency,
                    user: {
                        connect: {
                            id: user.id
                        }
                    }
                }
            })
            return reply.status(201).send(account)
        } catch (error) {
            return reply.status(500).send('Error creating account')
        }

    }
}
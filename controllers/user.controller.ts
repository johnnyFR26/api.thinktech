import { FastifyReply, FastifyRequest } from "fastify";
import { User } from "../models/user.model";
import { z } from "zod";
import { db } from "../lib/db";
import bcrypt from "bcrypt"
import { redisClient } from "../lib/redis";

const createUserSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email(),
    password: z.string(),
    cpf: z.string().min(11, 'Cpf must be at least 11 digits').max(11, 'Cpf must be at most 11 digits'),
    phone: z.string().min(11, 'Phone must be at least 11 digits')
})

const updateUserSchema = createUserSchema.partial()

/**
 * Controller for user-related operations.
 * 
 * @class
 * @memberof module:controllers
 * @name UserController
 * @property {function} getAll - Retrieves all users.
 * @property {function} create - Creates a new user.
 * @property {function} deletebyEmail - Deletes a user by email.
 * @property {function} update - Updates a user by email.
 * @property {function} getOne - Retrieves a user by email.
 * 
 */
export class UserController {


    /**
     * Retrieves all users.
     *
     * @function
     * @memberof module:controllers
     * @param request - The incoming request.
     * @param reply - The reply to be sent back to the client.
     * 
     * @example
     * curl -X GET 'http://localhost:3000/users'
     * 
     * @throws {Error} If an error occurs while retrieving users.
     * @returns {Promise<void>}
     */
    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const cacheKey = 'all_users'

        const cachedUsers = await redisClient.get(cacheKey)
        if (cachedUsers) {
            console.log('⚡ Returning cached users');
            return reply.status(200).send(JSON.parse(cachedUsers));
          }
          
        const users = await db.user.findMany()

        await redisClient.setEx(cacheKey, 30, JSON.stringify(users))

        return reply.status(200).send(users)
    }




    /**
     * Retrieves a user by email.
     *
     * @function
     * @memberof module:controllers
     * @param request - The incoming request containing the email parameter.
     * @param reply - The reply to be sent back to the client.
     *
     * @example
     * curl -X GET 'http://localhost:3000/users/{email}'
     *
     * @throws {Error} If the email is not valid or the user is not found.
     * @returns {Promise<void>}
     */
    async getOne(request: FastifyRequest<{Params: {email: string}}>, reply: FastifyReply) {
        const validation = z.object({email: z.string().email()}).safeParse(request.params)
        if(!validation.success) {
            return reply.status(400).send({
                error: validation.error.format()
            })
        }
        const email = validation.data.email
        const user = await db.user.findUnique({where: {email}})
        if(!user) {
            return reply.status(404).send('User not found')
        }
        return reply.status(200).send(user)
    }



    /**
     * Creates a new user.
     *
     * @function
     * @param request - The incoming request. The request body should contain a valid user object.
     * @param reply - The reply to be sent back to the client.
     *
     * @example
     * curl -X POST 'http://localhost:3000/users' 
     * -H 'Content-Type: application/json' 
     * -d '{ "name": "John Doe", "email": "john@example.com", "password": "secret", "cpf": "12345678901", "phone": "12345678901" }'
     *
     * @throws {Error} If an error occurs while creating the user.
     *
     * @returns {Promise<void>}
     */
    async create(request: FastifyRequest<{Body: User}>, reply: FastifyReply) {
        const validation = createUserSchema.safeParse(request.body)
        if(!validation.success) {
            return reply.status(400).send({
                error: validation.error.format()
            })
        }
        const data = validation.data

        data.password = await bcrypt.hash(data.password, 10)
        
        try {
            //@ts-expect-error
            const user = await db.user.create({data})
            return reply.status(201).send(user)
        } catch (error) {
            reply.status(500).send({
                error: error,
                data: data
            })
        }
    }




    /**
     * Updates a user by email.
     *
     * @function
     * @memberof module:controllers
     * @param request - The incoming request. The request body should contain a valid user object.
     * @param reply - The reply to be sent back to the client.
     *
     * @example
     * curl -X PUT 'http://localhost:3000/users/{email}' 
     * -H 'Content-Type: application/json' 
     * -d '{ "name": "John Doe Updated", "email": "john@example.com", "password": "secret", "cpf": "12345678901", "phone": "12345678901" }'
     *
     * @throws {Error} If an error occurs while updating the user.
     * @returns {Promise<void>}
     */
    async update(request: FastifyRequest<{
        Params: {email: string},
        Body: User
    }>, reply: FastifyReply) {
        const email = request.params.email
        const validation = updateUserSchema.safeParse(request.body)
        if(!validation.success) {
            return reply.status(400).send({
                error: validation.error.format()
            })
        }
        const data = validation.data

        const updatedUser = await db.user.update({
            where: {email},
            data
        })

        if(!updatedUser) {
            return reply.status(404).send('User not found')
        } else {
            return reply.status(200).send(updatedUser)
        }
    }

        
    


    
    /**
     * Deletes a user by email.
     *
     * @param request - The incoming request containing the email of the user to be deleted in the request parameters.
     * @param reply - The reply to be sent back to the client.
     *
     * @returns {Promise<void>} - Returns a 200 status with the deleted user data on success, 
     * or a 500 status with an error message on failure.
     */

    async deletebyEmail(request: FastifyRequest<{Params: {email: string}}>, reply: FastifyReply) {
        const email = request.params.email
        try {
            const user = await db.user.delete({where: {email}})
            return reply.status(200).send(user)
        } catch (error) {
            reply.status(500).send({
                error: error,
                email: email
            })
        }
    }

    
}
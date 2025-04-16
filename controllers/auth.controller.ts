import jwt from 'jsonwebtoken'
import  bcrypt  from 'bcrypt';
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { db } from "../lib/db";
import { redisClient } from '../lib/redis';

const loginUserSchema = z.object({
    email: z.string().email(),
    password: z.string()
})

/**
 * Controller for authentication-related operations.
 * 
 * @class
 * @memberof module:controllers
 * @name AuthController
 * 
 */
export class AuthController {
    

    /**
     * Authenticates a user and returns a JWT token that can be used to access protected routes.
     *
     * @function
     * @param request - The incoming request. The request body should contain a valid user object.
     * @param reply - The reply to be sent back to the client.
     *
     * @example
     * curl -X POST 'http://localhost:3000/auth/login' 
     * -H 'Content-Type: application/json' 
     * -d '{ "email": "john@example.com", "password": "secret" }'
     *
     * @throws {Error} If an error occurs while authenticating the user.
     * @returns {Promise<void>}
     */
    async login(request: FastifyRequest, reply: FastifyReply) {
        const validation = loginUserSchema.safeParse(request.body)
        if(!validation.success) {
            return reply.status(401).send({error: validation.error.format()})
        }
        const data = validation.data

        const user = await db.user.findUnique({
            where: {email: data.email},
            include: {
                account: {
                    include: {
                        categories: true
                    }
                }
            }
        })

        if(!user) {
            return reply.status(404).send({error: 'User not found'})
        }

        const isValidPassword = await bcrypt.compare(data.password, user.password)
        if(!isValidPassword) {
            return reply.status(401).send({error: 'Invalid password'})
        }else{
              const token = await jwt.sign({email: user.email}, process.env.JWT_SECRET, {expiresIn: '1d'})
              
              await redisClient.setEx(user.email, 86400, token)
            
              return reply.status(200).send({token, user})
        }
        
    }
}
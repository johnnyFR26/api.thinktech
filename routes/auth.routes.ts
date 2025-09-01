import { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller";

const controller = new AuthController()


/**
 * Registers the following routes with the provided Fastify server instance:
 * <ul>
 * <li>POST /auth/login - Authenticates a user.</li>
 * </ul>
 *
 * @param server - The Fastify server instance to register the routes with.
 * @returns {Promise<void>}
 */
export default async function AuthRoutes(server: FastifyInstance) {
    server.post('/auth/login', controller.login)
    server.post('/auth/google', controller.loginWithGoogle)
}
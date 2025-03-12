import { FastifyInstance } from "fastify";
import { UserController } from "../controllers/user.controller";
import { rateLimit } from "../middlewares/DDOS.middleware";

const controller = new UserController()


/**
 * Registers the following routes with the provided Fastify server instance:
 * <ul>
 * <li>POST /users - Creates a new user.</li>
 * <li>DELETE /users/:email - Deletes a user by email.</li>
 * <li>GET /users - Retrieves all users.</li>
 * </ul>
 *
 * @param server - The Fastify server instance to register the routes with.
 * @returns {Promise<void>}
 */
export default async function UserRoutes(server: FastifyInstance){
    server.post('/users', controller.create )
    server.delete('/users/:email', controller.deletebyEmail)
    server.get('/users',{preHandler: [rateLimit]}, controller.getAll)
    server.put('/users/:email', controller.update)
    server.get('/users/:email', controller.getOne)
}
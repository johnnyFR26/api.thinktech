import { FastifyInstance } from "fastify";
import { AccountController } from "../controllers/account.controller";
import { rateLimit } from "../middlewares/DDOS.middleware";

const controller = new AccountController()

export default async function AccountRoutes(server: FastifyInstance) {
    server.post('/accounts/:email', controller.create )
    server.get('/accounts',{preHandler: [rateLimit]}, controller.getAll)
}
import { FastifyInstance } from "fastify";
import { AccountController } from "../controllers/account.controller";

const controller = new AccountController()

export default async function AccountRoutes(server: FastifyInstance) {
    server.post('/accounts/:email', controller.create )
}
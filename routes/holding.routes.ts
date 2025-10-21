import { FastifyInstance } from "fastify"
import { HoldingController } from "../controllers/holding.controller"

const controller = new HoldingController()
export default async function HoldingRoutes(server: FastifyInstance) {
    server.post('/holdings', controller.create)
    server.get('/holdings/account/:accountId', controller.getByAccountId)
}
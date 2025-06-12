import { FastifyInstance } from "fastify";
import { TransactionController } from "../controllers/transaction.controller";

const controller = new TransactionController()

export default async function TransactionRoutes(server: FastifyInstance) {
    server.post('/transactions', controller.create)
    server.get('/transactions/:accountId', controller.getAllByAccountId)
    server.post('/transactions/by-month', controller.getAllByMonth)
    server.patch('/transactions/:id', controller.patch)
    server.delete('/transactions/:id', controller.delete)
}
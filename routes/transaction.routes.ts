import { FastifyInstance } from "fastify";
import { TransactionController } from "../controllers/transaction.controller";

const controller = new TransactionController()

export default async function TransactionRoutes(server: FastifyInstance) {
    server.post('/transactions', controller.create)
}
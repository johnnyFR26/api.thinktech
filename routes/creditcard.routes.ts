import { FastifyInstance } from "fastify";
import { CreditCardController } from "../controllers/creditcard.controller";

const controller = new CreditCardController()

export default async function CreditCardRoutes(server: FastifyInstance) {
    server.post('/creditcards', controller.create)
    server.get('/creditcards', controller.getAll)
    server.get('/creditcards/:id', controller.getOne)
    server.get('/creditcards/account/:accountId', controller.getAllByAccountId)
    server.patch('/creditcards/:id', controller.patch)
    server.patch('/creditcards/:id/limit', controller.updateLimit)
    server.delete('/creditcards/:id', controller.delete)
}
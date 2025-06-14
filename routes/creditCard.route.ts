import { FastifyInstance } from "fastify";
import { CreditCardController } from "../controllers/creditCard.controller";
const controller = new CreditCardController()
export default async function CreditCardRoutes(server: FastifyInstance) {
    server.post('/creditCard', controller.create)
    server.get('/creditCard', controller.getAll)
    server.get('/creditCard/:id', controller.getOne)
    server.delete('/creditCard/:id', controller.delete)
    server.patch('/creditCard/:id', controller.update)
}
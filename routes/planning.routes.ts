import { FastifyInstance } from "fastify"
import { PlanningController } from "../controllers/planning.controller"

const controller = new PlanningController()
export default async function PlanningRoutes(server: FastifyInstance) {
    server.post('/planning', controller.create)
    server.get('/planning', controller.getAll)
    server.post('/planning/:id/duplicate', controller.duplicate)
    server.get('/planning/:id/projection', controller.getProjection)
    server.get('/planning/:id', controller.getOne)
    server.patch('/planning/:id', controller.patch)
    server.delete('/planning/:id', controller.delete)
    server.get('/planning/account/:accountId', controller.getAllByAccountId)
}

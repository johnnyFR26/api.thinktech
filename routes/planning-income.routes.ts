import { FastifyInstance } from "fastify"
import { PlanningIncomeController } from "../controllers/planning-income.controller"

const controller = new PlanningIncomeController()
export default async function PlanningIncomeRoutes(server: FastifyInstance) {
    server.post('/planning-income', controller.create)
    server.get('/planning-income/planning/:planningId', controller.getByPlanningId)
    server.patch('/planning-income/:id', controller.update)
    server.delete('/planning-income/:id', controller.delete)
}

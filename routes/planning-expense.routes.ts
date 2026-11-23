import { FastifyInstance } from "fastify"
import { PlanningExpenseController } from "../controllers/planning-expense.controller"

const controller = new PlanningExpenseController()
export default async function PlanningExpenseRoutes(server: FastifyInstance) {
    server.post('/planning-expense', controller.create)
    server.get('/planning-expense/planning/:planningId', controller.getByPlanningId)
    server.patch('/planning-expense/:id', controller.update)
    server.delete('/planning-expense/:id', controller.delete)
}

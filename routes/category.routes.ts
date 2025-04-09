import { FastifyInstance } from "fastify";
import { CategoryController } from "../controllers/category.controller";

const controller = new CategoryController()

export default async function CategoryRoutes(server: FastifyInstance) {
    server.post('/category', controller.create)
    server.get('/category', controller.getAll)
}
import { FastifyInstance } from "fastify";
import { MovimentController } from "../controllers/moviment.controller";

const controller = new MovimentController()
export default async function MovimentRoutes(server: FastifyInstance) {
    server.post('/moviment', controller.create)
}
import { FastifyInstance } from "fastify";
import { FileController } from "../controllers/file.controller";

const controller = new FileController()

export default async function FileRoutes(server: FastifyInstance) {
    server.post('/file', controller.uploadOne)
}
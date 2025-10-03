import { FastifyInstance } from "fastify";
import { IaAgentController } from "../controllers/ia-agent.controller";

const controller = new IaAgentController();
export default async function IaAgentRoutes(server: FastifyInstance) {
    server.post("/ai-agent", controller.message);
    server.post("/ai-agent/chat", controller.chat);
}
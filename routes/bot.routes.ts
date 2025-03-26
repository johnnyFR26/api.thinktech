import { FastifyInstance } from "fastify";
import { handleGitHubWebhook } from "../controllers/discord.controller";

export default async function BotRoutes(server: FastifyInstance) {
    server.post('/webhook', handleGitHubWebhook)

}
import { FastifyInstance } from "fastify";
import { handleGitHubWebhook } from "../controllers/discord.controller";
import { client } from "../lib/bot";

export default async function BotRoutes(server: FastifyInstance) {
    server.post('/webhook', handleGitHubWebhook)
    server.get("/ping", async (request, reply) => {
        if (!client.isReady()) {
          return reply.status(500).send({ error: "Bot não está pronto!" });
        }
        return reply.send({ status: "Bot online!", uptime: process.uptime() });
      });

}
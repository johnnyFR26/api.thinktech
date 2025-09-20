import { FastifyInstance } from "fastify";
import { handleGitHubWebhook } from "../controllers/discord.controller";
import { client } from "../lib/bot";

export default async function BotRoutes(server: FastifyInstance) {
    server.post('/webhook', handleGitHubWebhook)
    server.get("/ping", async (request, reply) => {
        const waitForClientReady = () => {
            return new Promise<void>((resolve, reject) => {
                const interval = setInterval(() => {
                    if (client.isReady()) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 1000);
            });
        };
    
        try {
            await waitForClientReady();
            
            return reply.send({ status: "Bot online!", uptime: process.uptime() });
        } catch (error) {
            return reply.status(500).send({ error: "Erro ao verificar o status do bot." });
        }
    });
    
}
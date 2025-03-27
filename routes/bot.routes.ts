import { FastifyInstance } from "fastify";
import { handleGitHubWebhook } from "../controllers/discord.controller";
import { client } from "../lib/bot";

export default async function BotRoutes(server: FastifyInstance) {
    server.post('/webhook', handleGitHubWebhook)
    server.get("/ping", async (request, reply) => {
        // Função que retorna uma Promise que resolve quando o client estiver pronto
        const waitForClientReady = () => {
            return new Promise<void>((resolve, reject) => {
                const interval = setInterval(() => {
                    if (client.isReady()) {
                        clearInterval(interval);  // Para o intervalo quando o client estiver pronto
                        resolve();  // Resolve a Promise quando o client estiver pronto
                    }
                }, 1000);  // Verifica a cada 1 segundo
            });
        };
    
        try {
            // Espera até que o client esteja pronto
            await waitForClientReady();
            
            return reply.send({ status: "Bot online!", uptime: process.uptime() });
        } catch (error) {
            return reply.status(500).send({ error: "Erro ao verificar o status do bot." });
        }
    });
    
}
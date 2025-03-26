import { FastifyReply, FastifyRequest } from "fastify";
import { client } from "../lib/bot";
import { TextChannel, NewsChannel, Channel } from "discord.js";

interface GitHubWebhookPayload {
  action?: string
  pull_request?: {
    title: string;
    html_url: string
    user: {
      login: string
    };
  };
}

export async function handleGitHubWebhook(
  request: FastifyRequest<{ Body: GitHubWebhookPayload }>,
  reply: FastifyReply
) {
  const payload = request.body;

  if (payload?.action === "opened" && payload.pull_request) {
    try {
      const channelId = "1354221727823171624";

      if (!channelId) {
        console.error("⚠️ CHANNEL_ID não está definido no .env");
        return reply.status(500).send({ error: "Configuração inválida" })
      }

      const channel: Channel | null = await client.channels.fetch(channelId)

      if (channel instanceof TextChannel) {
        const pr = payload.pull_request;
        await channel.send(
          `🔔 Novo Pull Request aberto! **${pr.title}**\n🔗 ${pr.html_url}\n👤 Autor: ${pr.user.login}`
        );
      } else {
        console.error("⚠️ O canal do Discord não é um canal de texto ou não foi encontrado.")
      }
    } catch (error) {
      console.error("❌ Erro ao enviar mensagem para o Discord:", error);
      return reply.status(500).send({ error: "Erro ao processar webhook" })
    }
  }
  reply.send({ success: true })
}
